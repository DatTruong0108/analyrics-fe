/* Application Package */
import { ApiError, apiFetch } from "@/lib/api";
import { refreshSession } from "@/lib/auth-api";
import { IAuthUser } from "@/types/auth/auth.interface";
import { IHistoryPage } from "@/types/profile/profile.interface";

/* Mirrors the backend's `MAX_USER_NAME_LENGTH` in `auth.dto.ts`. */
export const MAX_USER_NAME_LENGTH = 50;

/* Mirrors the backend's `MAX_PAGE_LIMIT` in `pagination.ts`. */
export const MAX_HISTORY_PAGE_LIMIT = 50;

const UNAUTHORIZED_STATUS = 401;
const NOT_FOUND_STATUS = 404;

/*
 * Every profile endpoint answers 401 to a caller whose access token has lapsed
 * while the refresh cookie is still good — the most common real session there
 * is. Rotate once and replay instead of showing "please sign in" to someone who
 * is signed in. A second 401 is genuine and propagates.
 *
 * Safe to replay: reading history is a GET, and a rename and a history
 * delete are both idempotent.
 */
async function withSessionRetry<T>(run: () => Promise<T>): Promise<T> {
    try {
        return await run();
    } catch (error) {
        if (!(error instanceof ApiError) || error.statusCode !== UNAUTHORIZED_STATUS) {
            throw error;
        }

        const refreshed = await refreshSession().catch(() => null);
        if (!refreshed?.user) throw error;

        return run();
    }
}

export function fetchHistory(
    limit: number,
    offset: number,
    signal?: AbortSignal,
): Promise<IHistoryPage> {
    return withSessionRetry(() =>
        apiFetch<IHistoryPage>(`/analysis/history?limit=${limit}&offset=${offset}`, { signal }),
    ).then((response) => response.data);
}

/*
 * Resolves once the song is no longer in the caller's history. A 404 means it
 * already is not — removed from another tab, or a double submit that lost the
 * race — which is the outcome the caller asked for, not a failure to show.
 */
export async function removeHistoryItem(songId: string): Promise<void> {
    try {
        await withSessionRetry(() =>
            apiFetch<{ id: string }>(`/analysis/history/${encodeURIComponent(songId)}`, {
                method: "DELETE",
            }),
        );
    } catch (error) {
        if (error instanceof ApiError && error.statusCode === NOT_FOUND_STATUS) return;
        throw error;
    }
}

/* Only `name` is sent: the body is validated with `forbidNonWhitelisted`. */
export function updateName(name: string): Promise<IAuthUser> {
    return withSessionRetry(() =>
        apiFetch<IAuthUser>("/auth/me", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name }),
        }),
    ).then((response) => response.data);
}
