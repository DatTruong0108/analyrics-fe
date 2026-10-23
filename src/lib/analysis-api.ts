/* Application Package */
import { apiFetch } from "@/lib/api";
import { IAnalyzeResponse } from "@/types/analysis/analysis.interface";
import { ISongMetadata } from "@/types/dashboard/song.interface";

/*
 * Gets the analysis for a song, generating it on a cache miss (or always, with
 * `forceRefresh`). Shared by the home page, which generates and then opens the
 * song page, and the song page's "Tạo phân tích mới".
 *
 * The song is copied field by field: the body is validated with
 * `forbidNonWhitelisted`, so extra fields such as `viewedAt` would be a 400.
 */
export function analyzeSong(song: ISongMetadata, forceRefresh = false): Promise<IAnalyzeResponse> {
    return apiFetch<IAnalyzeResponse>("/analysis/analyze", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: song.id,
            album: song.album,
            title: song.title,
            artist: song.artist,
            imageUrl: song.imageUrl,
            spotifyUrl: song.spotifyUrl,
            previewUrl: song.previewUrl,
            forceRefresh,
        }),
    }).then((response) => response.data);
}
