/* Application Package */
import { apiFetch } from "@/lib/api";
import { withSessionRetry } from "@/lib/session-retry";
import { IFavoritesPage } from "@/types/favorites/favorite.interface";

/* The `data` payload of `POST` / `DELETE /favorites/:songId`. */
interface IFavoriteState {
    songId: string;
    isFavorited: boolean;
}

export function fetchFavorites(
    limit: number,
    offset: number,
    signal?: AbortSignal,
): Promise<IFavoritesPage> {
    return withSessionRetry(() =>
        apiFetch<IFavoritesPage>(`/favorites?limit=${limit}&offset=${offset}`, { signal }),
    ).then((response) => response.data);
}

/* The heart's state for one song, asked by the browser after the song page loads. */
export function fetchFavoriteState(songId: string, signal?: AbortSignal): Promise<boolean> {
    return withSessionRetry(() =>
        apiFetch<IFavoriteState>(`/favorites/${encodeURIComponent(songId)}`, { signal }),
    ).then((response) => response.data.isFavorited);
}

/*
 * Both writes are idempotent on the server — adding twice or removing a song
 * that is not favourited still answers 200 — so they are safe to replay after
 * a session refresh, and a double submit cannot leave the wrong state behind.
 */
export function setFavorite(songId: string, isFavorited: boolean): Promise<boolean> {
    return withSessionRetry(() =>
        apiFetch<IFavoriteState>(`/favorites/${encodeURIComponent(songId)}`, {
            method: isFavorited ? "POST" : "DELETE",
        }),
    ).then((response) => response.data.isFavorited);
}
