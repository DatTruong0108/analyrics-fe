/* System Package */
import { cache } from "react";

/* Application Package */
import { ApiError, apiFetch } from "@/lib/api";
import { ISongAnalysis } from "@/types/analysis/analysis.interface";

const BAD_REQUEST_STATUS = 400;
const NOT_FOUND_STATUS = 404;

/*
 * Server-side read for `/song/[id]`: the cached analysis, or null when the song
 * has never been analysed (or the id is malformed — both are "no such page").
 * Any other failure throws, so the route's error boundary renders instead of a
 * misleading 404 that crawlers would treat as permanent.
 *
 * `cache` dedupes the call within one render, so `generateMetadata` and the
 * page share a single request. `no-store` keeps it fresh across requests: a
 * regenerated analysis must show up on the next load, and the read is a single
 * indexed lookup that never touches Gemini.
 */
export const getSongAnalysis = cache(async (songId: string): Promise<ISongAnalysis | null> => {
    try {
        const response = await apiFetch<ISongAnalysis>(
            `/analysis/songs/${encodeURIComponent(songId)}`,
            { cache: "no-store" },
        );

        return response.data;
    } catch (error) {
        if (
            error instanceof ApiError &&
            (error.statusCode === NOT_FOUND_STATUS || error.statusCode === BAD_REQUEST_STATUS)
        ) {
            return null;
        }

        throw error;
    }
});
