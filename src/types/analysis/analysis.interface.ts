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