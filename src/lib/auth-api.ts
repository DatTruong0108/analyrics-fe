/* Application Package */
import { ApiError, apiFetch, apiFetchVoid } from "@/lib/api";
import {
    IAuthSession,
    IAuthUser,
    ILoginPayload,
    IRegisterPayload,
} from "@/types/auth/auth.interface";

/*
 * The session as it arrives on the wire.
 *
 * Two shapes are tolerated because two endpoints answer differently: `/auth/me`
 * and `/auth/refresh` wrap the user in `{ user, accessTokenExpiresAt }`, while
 * `/auth/login` and `/auth/register` put the bare `UserData` in `data`. Papering
 * over that here means no caller has to know which endpoint it came from.
 *
 * `user` is declared required-but-nullable rather than optional so that `"user"
 * in body` narrows in both directions — an optional property cannot be ruled
 * out of the negative branch.
 */
interface IAuthSessionBody {
    user: IAuthUser | null;
    accessTokenExpiresAt?: number | string | null;
}

type AuthSessionBody = IAuthSessionBody | IAuthUser;

/*
 * The single in-flight rotation.
 *
 * Refresh tokens rotate: the old one dies the moment a new one is issued. Two
 * components mounting at once — or React StrictMode's double-mount in dev —
 * would fire two rotations, and the loser presents a token that no longer
 * exists. Its 401 is indistinguishable from a real token-reuse attack, so the
 * user is signed out for doing nothing wrong. Sharing one promise means the
 * second caller waits for the first rotation instead of racing it.
 */
let inFlightRefresh: Promise<IAuthSession> | null = null;

/* `{ user }` present means the session shape; anything else is a bare user. */
function toSession(body: AuthSessionBody): IAuthSession {
    if ("user" in body) {
        return {
            user: body.user ?? null,
            accessTokenExpiresAt: body.accessTokenExpiresAt ?? null,
        };
    }

    return { user: body, accessTokenExpiresAt: null };
}

function postJson(path: string, payload: unknown): Promise<IAuthSession> {
    return apiFetch<AuthSessionBody>(path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    }).then((response) => toSession(response.data));
}

/*
 * The DTO fields are listed one by one rather than spreading the payload: the
 * global validation pipe runs with `forbidNonWhitelisted: true`, so one stray
 * key — a form's `confirmPassword`, say — is a hard 400 rather than an ignored
 * field.
 */
export function login(payload: ILoginPayload): Promise<IAuthSession> {
    return postJson("/auth/login", {
        email: payload.email,
        password: payload.password,
    });
}

/* `phone` is optional in `RegisterDto`; `JSON.stringify` drops it when unset. */
export function register(payload: IRegisterPayload): Promise<IAuthSession> {
    return postJson("/auth/register", {
        email: payload.email,
        password: payload.password,
        name: payload.name,
        phone: payload.phone,
    });
}

/*
 * Logout answers 200 with `{ statusCode, message }` and no `data`, which is
 * exactly what `apiFetchVoid` exists for — `apiFetch` would reject it.
 */
export async function logout(): Promise<void> {
    await apiFetchVoid("/auth/logout", { method: "POST" });
}

/*
 * Reads the current session. A guest is a 200 carrying `{ user: null }`, not an
 * error — the object is still a payload, so `apiFetch`'s data guard passes.
 */
export function fetchSession(): Promise<IAuthSession> {
    return apiFetch<AuthSessionBody>("/auth/me").then((response) =>
        toSession(response.data),
    );
}

/*
 * Delays before each retry of a refresh the server marked `retryable`. Three
 * attempts over ~3s ride out a cold database start or a lost multi-tab race;
 * past that the failure is treated as real.
 */
const REFRESH_RETRY_DELAYS_MS = [1_000, 2_000];

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
 * One rotation, retried only when the server says the failure was transient.
 * Without this, a 500 from a sleeping database (cookies untouched, session
 * perfectly valid) dropped the user to guest until they reloaded the page.
 * A retry after a lost race also works: the winner has already set the new
 * cookie, so the second attempt presents the fresh token.
 */
async function rotateWithRetry(): Promise<IAuthSession> {
    for (let attempt = 0; ; attempt++) {
        try {
            /*
             * No request body: the credential is the httpOnly `refresh_token`
             * cookie, which `apiFetch` already sends via `credentials: "include"`.
             */
            const response = await apiFetch<AuthSessionBody>("/auth/refresh", {
                method: "POST",
            });
            return toSession(response.data);
        } catch (error) {
            const delay = REFRESH_RETRY_DELAYS_MS[attempt];
            const isRetryable = error instanceof ApiError && error.isRetryable;
            if (!isRetryable || delay === undefined) throw error;

            await wait(delay);
        }
    }
}

/*
 * Rotates the refresh token, coalescing concurrent callers onto one request.
 * Retries happen inside the shared promise, so coalesced callers wait for the
 * final outcome instead of each starting their own retry loop.
 */
export function refreshSession(): Promise<IAuthSession> {
    if (inFlightRefresh) return inFlightRefresh;

    const rotation = rotateWithRetry();

    inFlightRefresh = rotation;

    /*
     * Clear only if the slot still holds *this* rotation. A caller that starts
     * the next rotation right after this one settles must not have its promise
     * wiped by the previous rotation's cleanup.
     *
     * Both outcomes clear it: a failed rotation must not pin a rejected promise
     * in the slot, or every later caller would inherit that one failure.
     */
    const release = () => {
        if (inFlightRefresh === rotation) inFlightRefresh = null;
    };

    rotation.then(release, release);

    return rotation;
}
