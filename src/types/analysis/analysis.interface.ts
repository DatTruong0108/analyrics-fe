/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";

export interface IAnalysisSection {
    section: string;
    lyricsQuote: string;
    content: string;
}

export interface IMetaphor {
    phrase: string;
    meaning: string;
}

export interface IAnalysisResult {
    syncedLyrics: string | null;
    fullLyrics: string;
    vibe: string;
    overview: string;
    analysis: IAnalysisSection[];
    metaphors: IMetaphor[];
    coreMessage: string;
}

/* An analysis together with its song: the `data` of `GET /analysis/songs/:id`. */
export interface ISongAnalysis extends IAnalysisResult {
    song: ISongMetadata;
}

/* The `data` of `POST /analysis/analyze`. */
export interface IAnalyzeResponse extends ISongAnalysis {
    fromCache: boolean;
    isFavorited: boolean;
}
