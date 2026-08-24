/* Application Package */
import { IBaseApiResponse, IErrorResponse } from "@/types/baseApiResponse";

/*
 * `NODE_ENV` and every `NEXT_PUBLIC_*` value are inlined by Next at build time,
 * so resolving the base URL once at module scope is safe — it cannot change at
 * runtime, and the three call sites no longer each repeat this ternary.
 */
const API_BASE_URL =
    process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_API_URL
        : process.env.NEXT_PUBLIC_API_PROD;

const FALLBACK_ERROR_MESSAGE = "Không thể kết nối tới máy chủ";

/* `statusCode` 0 means the request never reached the server (DNS, CORS, offline). */
export const NETWORK_ERROR_STATUS = 0;

/*
 * Every non-success outcome — transport failure, HTTP error, or an envelope
 * carrying a non-2xx `statusCode` — surfaces as this one type, so callers
 * branch on a single shape instead of re-deriving it per call site.
 */
export class ApiError extends Error {
    readonly statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
    }
}

/*
 * An abort is not a failure: it means a newer request superseded this one.
 * Callers must be able to tell it apart so they bail out quietly instead of
 * rendering an error for a request they themselves cancelled.
 */
export function isAbortError(error: unknown): boolean {
    /*
     * Duck-typed on `name`, not `instanceof DOMException`: an error crossing a
     * realm, or thrown by a patched/polyfilled fetch, is still an abort and
     * must not be reported to the user as a real failure.
     */
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { name?: unknown }).name === "AbortError"
    );
}

/*
 * Single entry point for every backend call.
 *
 * Resolves with the full envelope (callers need `hasMore` alongside `data`).
 * Throws `ApiError` on any failure, and rethrows `AbortError` untouched.
 */
export async function apiFetch<T>(
    path: string,
    init: RequestInit = {},
): Promise<IBaseApiResponse<T>> {
    if (!API_BASE_URL) {
        throw new ApiError(
            NETWORK_ERROR_STATUS,
            "Thiếu cấu hình NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_PROD",
        );
    }

    let res: Response;

    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            /*
             * After the spread, not before: the `access_token` cookie is
             * httpOnly, so omitting this makes the API treat a logged-in user
             * as a guest. Keeping it last means a caller cannot undo it.
             */
            credentials: "include",
        });
    } catch (error) {
        if (isAbortError(error)) throw error;
        throw new ApiError(NETWORK_ERROR_STATUS, FALLBACK_ERROR_MESSAGE);
    }

    /*
     * Nest's auth guard and rate limiter reply outside the app envelope, and a
     * 204 or a proxy error page has no JSON at all — so a missing or malformed
     * body is an expected outcome here, not an exception.
     */
    let body: unknown = null;

    try {
        body = await res.json();
    } catch (error) {
        if (isAbortError(error)) throw error;
        body = null;
    }

    const envelope = body as
        | (Partial<IBaseApiResponse<T>> & Partial<IErrorResponse>)
        | null;

    /* HTTP status wins: it is the one field every responder sets. */
    if (!res.ok) {
        throw new ApiError(
            envelope?.statusCode ?? res.status,
            envelope?.message ?? FALLBACK_ERROR_MESSAGE,
        );
    }

    if (!envelope || typeof envelope.statusCode !== "number") {
        throw new ApiError(res.status, FALLBACK_ERROR_MESSAGE);
    }

    if (envelope.statusCode < 200 || envelope.statusCode >= 300) {
        throw new ApiError(
            envelope.statusCode,
            envelope.message ?? FALLBACK_ERROR_MESSAGE,
        );
    }

    /*
     * `IBaseApiResponse<T>` declares `data` as required, so every caller
     * dereferences it without a guard. Enforce that here instead of returning
     * an envelope whose type lies — a success body with no `data` would
     * otherwise reach the UI as `undefined` and crash on first use.
     *
     * An endpoint that legitimately answers 200 with no payload needs its own
     * helper rather than a loosening of this check.
     */
    if (envelope.data === undefined || envelope.data === null) {
        throw new ApiError(envelope.statusCode, FALLBACK_ERROR_MESSAGE);
    }

    return envelope as IBaseApiResponse<T>;
}
