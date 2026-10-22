/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";

/*
 * Hands a song from `/me` to the home page, which owns the analysis view.
 *
 * The analysis view is component state inside `HomeContainer`, not a route, so
 * there is no URL to link to. sessionStorage carries the song across the
 * client-side navigation instead: it is tab-scoped (two tabs never steal each
 * other's song) and it is consumed on read, so a later reload of `/` does not
 * replay an old analysis.
 */
const PENDING_ANALYSIS_KEY = "analyrics:pending-analysis";

type StoredSong = Partial<Record<keyof ISongMetadata, string | null>>;

export function setPendingAnalysis(song: ISongMetadata): void {
    /* Copied field by field so extra fields such as `viewedAt` are not stored. */
    const payload: ISongMetadata = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        imageUrl: song.imageUrl,
        spotifyUrl: song.spotifyUrl,
        previewUrl: song.previewUrl,
    };

    try {
        sessionStorage.setItem(PENDING_ANALYSIS_KEY, JSON.stringify(payload));
    } catch {
        /* Storage blocked (private mode, quota): the link still lands on home. */
    }
}

export function consumePendingAnalysis(): ISongMetadata | null {
    let raw: string | null = null;

    try {
        raw = sessionStorage.getItem(PENDING_ANALYSIS_KEY);
        sessionStorage.removeItem(PENDING_ANALYSIS_KEY);
    } catch {
        return null;
    }

    if (!raw) return null;

    try {
        const stored = JSON.parse(raw) as StoredSong | null;
        if (!stored) return null;

        const { id, title, artist, album, imageUrl, spotifyUrl, previewUrl } = stored;

        /* Storage is writable by anything on the origin, so check the shape. */
        const isComplete = [id, title, artist, album, imageUrl, spotifyUrl].every(
            (field) => typeof field === "string" && field.length > 0,
        );
        if (!isComplete) return null;

        return {
            id: id as string,
            title: title as string,
            artist: artist as string,
            album: album as string,
            imageUrl: imageUrl as string,
            spotifyUrl: spotifyUrl as string,
            previewUrl: typeof previewUrl === "string" ? previewUrl : null,
        };
    } catch {
        return null;
    }
}
