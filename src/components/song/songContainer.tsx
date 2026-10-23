'use client';

/* System Package */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig } from "framer-motion";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import AnalyzedView from "@/components/analysis/analyzedView";
import ErrorView from "@/components/analysis/errorView";
import LoadingView from "@/components/analysis/loadingView";
import { ApiError, NETWORK_ERROR_STATUS } from "@/lib/api";
import { analyzeSong } from "@/lib/analysis-api";
import { fetchFavoriteState } from "@/lib/favorites-api";
import { recordHistoryView } from "@/lib/profile-api";
import { ISongAnalysis } from "@/types/analysis/analysis.interface";

type View = "analysis" | "regenerating" | "error";

interface SongContainerProps {
    /* Server-rendered for everyone alike — it carries nothing user-specific. */
    data: ISongAnalysis;
}

/*
 * The interactive half of `/song/[id]`. The server renders the analysis
 * without the visitor's session (so crawlers and link previews see the same
 * page), and everything per-user happens here once the session is known:
 * recording the view in history and resolving the heart.
 */
export default function SongContainer({ data }: SongContainerProps) {
    const router = useRouter();
    const { status } = useAuth();
    const songId = data.song.id;

    const [analysis, setAnalysis] = useState(data);
    const [view, setView] = useState<View>("analysis");
    const [errorStatus, setErrorStatus] = useState(500);
    /* A cached read by definition; only a regeneration here makes it fresh. */
    const [isFromCache, setIsFromCache] = useState(true);
    /*
     * null = not known yet. Once known it stays known for the life of the
     * page: the heart button owns its state from then on (including the
     * "guest clicks, signs in, add completes" flow), so it must never be
     * unmounted by this resolving again.
     */
    const [isFavorited, setIsFavorited] = useState<boolean | null>(null);

    /* A guest has no favourites — known immediately, no request. Adjusted during render, not in an effect. */
    if (isFavorited === null && status === "guest") {
        setIsFavorited(false);
    }

    /*
     * Runs when the visitor is (or becomes) signed in. The view is recorded
     * even after a mid-page sign-in; the favourite lookup only fills an
     * unknown state, so it can never overwrite a heart the user just toggled.
     */
    useEffect(() => {
        if (status !== "authenticated") return;

        const controller = new AbortController();

        /* Best effort: a missed history entry must not disturb reading the page. */
        recordHistoryView(songId).catch(() => undefined);

        fetchFavoriteState(songId, controller.signal)
            .then((value) => setIsFavorited((prev) => prev ?? value))
            .catch(() => {
                if (controller.signal.aborted) return;
                /* Unknown is worse than wrong-but-fixable: an empty heart can still be clicked. */
                setIsFavorited((prev) => prev ?? false);
            });

        return () => controller.abort();
    }, [status, songId]);

    const handleRegenerate = async () => {
        if (view === "regenerating") return;
        setView("regenerating");

        try {
            const { fromCache, isFavorited: nextIsFavorited, ...nextAnalysis } = await analyzeSong(analysis.song, true);

            setAnalysis(nextAnalysis);
            setIsFromCache(fromCache);
            /* The heart remounts with the view; the server's answer is the freshest state. */
            if (status === "authenticated") setIsFavorited(nextIsFavorited);
            setView("analysis");
        } catch (error) {
            /* Same split as the home page: a transport failure is "server side", not "this song". */
            const isServerSide = !(error instanceof ApiError) || error.statusCode === NETWORK_ERROR_STATUS;

            setErrorStatus(isServerSide ? 500 : (error as ApiError).statusCode);
            setView("error");
        }
    };

    /*
     * Back within the site when there is somewhere to go back to; a link
     * opened in a fresh tab or an in-app browser (Zalo, Facebook) has no
     * history, so it lands on the home page instead of closing nothing.
     */
    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push("/");
    };

    return (
        <MotionConfig reducedMotion="user">
            {view === "regenerating" && <LoadingView />}

            {view === "error" && <ErrorView status={errorStatus} onBack={() => setView("analysis")} />}

            {view === "analysis" && (
                <AnalyzedView
                    data={analysis}
                    onBack={handleBack}
                    onRegenerate={() => void handleRegenerate()}
                    isFromCache={isFromCache}
                    isFavorited={isFavorited}
                />
            )}
        </MotionConfig>
    );
}
