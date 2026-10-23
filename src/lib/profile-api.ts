/* Application Package */
import { ApiError, apiFetch } from "@/lib/api";
import { withSessionRetry } from "@/lib/session-retry";
import { IAuthUser } from "@/types/auth/auth.interface";
import { IHistoryPage } from "@/types/profile/profile.interface";

/* Mirrors the backend's `MAX_USER_NAME_LENGTH` in `auth.dto.ts`. */
export const MAX_USER_NAME_LENGTH = 50;

/* Mirrors the backend's `MAX_PAGE_LIMIT` in `pagination.ts`. */
export const MAX_HISTORY_PAGE_LIMIT = 50;

const NOT_FOUND_STATUS = 404;

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
 * Moves the song to the top of the caller's history. The song page is
 * server-rendered without the user's session, so the browser reports the view.
 * Idempotent, so safe to replay after a session refresh.
 */
export async function recordHistoryView(songId: string): Promise<void> {
    await withSessionRetry(() =>
        apiFetch<{ id: string }>(`/analysis/history/${encodeURIComponent(songId)}`, {
            method: "POST",
        }),
    );
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
