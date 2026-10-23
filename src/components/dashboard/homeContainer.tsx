'use client';

/* System Package */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

/* Application Package */
import { EASE_OUT, growLineX } from "@/lib/motion";
import { ApiError, NETWORK_ERROR_STATUS, apiFetch, isAbortError } from "@/lib/api";
import { analyzeSong } from "@/lib/analysis-api";
import { IPaginatedResult } from "@/types/baseApiResponse";
import { ISongMetadata } from "@/types/dashboard/song.interface";
import Navbar from "./navBar";
import Hero from "./hero";
import QuoteSection from "./quoteSection";
import SearchBar from "./searchBar";
import TrendingSection from "./trendingSection";
import SearchResults from "./searchResult";
import LoadingView from "../analysis/loadingView";
import ErrorView from "../analysis/errorView";

export default function HomeContainer() {
    const router = useRouter();
    const [view, setView] = useState<'dashboard' | 'loading' | 'error'>('dashboard');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [results, setResults] = useState<ISongMetadata[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [errorStatus, setErrorStatus] = useState<number>(200);

    /* Holds the in-flight search so a newer query can cancel it. */
    const searchAbortRef = useRef<AbortController | null>(null);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        /*
         * Cancel whatever is in flight. Without this, two searches race and
         * the slower response wins whenever it lands second — so typing
         * "abba" then "queen" could leave Abba's results on screen.
         */
        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;

        setIsSearching(true);
        setLoading(true);

        try {
            const response = await apiFetch<IPaginatedResult<ISongMetadata>>(
                `/analysis/search?q=${encodeURIComponent(query)}`,
                { signal: controller.signal },
            );

            setResults(response.data.items ?? []);
        } catch (error) {
            /* We cancelled it ourselves — the newer search owns the UI now. */
            if (isAbortError(error)) return;

            console.error("Lỗi khi tìm kiếm", error);
            setResults([]);
        } finally {
            /*
             * Only the newest request may clear the spinner; a superseded one
             * reaching here would otherwise stop the spinner mid-search.
             */
            if (searchAbortRef.current === controller) {
                setLoading(false);
            }
        }
    }

    const handleClearSearch = () => {
        /* Nothing on screen will consume the pending response any more. */
        searchAbortRef.current?.abort();
        searchAbortRef.current = null;

        setIsSearching(false);
        setLoading(false);
        setResults([]);
    };

    /*
     * Home generates (or fetches from cache), then hands off to the song's own
     * page, which reads the now-cached analysis. The loading view stays up
     * through the navigation, so there is no flash of the dashboard between.
     */
    const handleAnalyze = async (song: ISongMetadata) => {
        if (!song) return;
        setView('loading');

        try {
            await analyzeSong(song);
            router.push(`/song/${encodeURIComponent(song.id)}`);
        } catch (error) {
            /*
             * ErrorView only splits "server side, come back later" (500) from
             * "this song failed, try another". A transport failure is the
             * former, so a dead backend must not surface as 0 — that would
             * render the "try another song" copy for an outage.
             */
            const isServerSide =
                !(error instanceof ApiError) ||
                error.statusCode === NETWORK_ERROR_STATUS;

            setErrorStatus(isServerSide ? 500 : (error as ApiError).statusCode);
            setView('error');
        }
    }

    const handleBackToDashboard = () => {
        setView('dashboard');
        setIsSearching(false);
    }

    const renderView = () => {
        if (view === 'loading') return <LoadingView />;
        if (view === 'error') return <ErrorView status={errorStatus} onBack={handleBackToDashboard} />;

        return (
            <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
                <Navbar />

                <main className="max-w-6xl mx-auto px-6 pt-18 pb-16 flex flex-col items-center">
                    <Hero />

                    <SearchBar
                        onSearch={handleSearch}
                        onClear={handleClearSearch}
                        isSearching={loading}
                    />

                    <AnimatePresence mode="wait" initial={false}>
                        {!isSearching ? (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.4, ease: EASE_OUT }}
                                className="w-full space-y-4"
                            >
                                {/* <QuoteSection /> */}

                                <motion.div
                                    variants={growLineX}
                                    initial="hidden"
                                    animate="visible"
                                    className="w-full h-px bg-linear-gradient-to-r from-transparent via-zinc-900 to-transparent my-8"
                                />

                                <TrendingSection onSongClick={handleAnalyze} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.4, ease: EASE_OUT }}
                                className="w-full"
                            >
                                <SearchResults
                                    songs={results}
                                    loading={loading}
                                    onSongClick={handleAnalyze}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                </main>

                <motion.footer
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                    className="py-10 text-center border-t border-zinc-950"
                >
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em]">
                        Analyrics — 2026 Edition by{" "}
                        <a href="https://facebook.com/tora0108" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white underline decoration-zinc-800 hover:decoration-white underline-offset-4 transition-all duration-300">
                            Dat Truong
                        </a>
                    </p>
                </motion.footer>
            </div>
        );
    };

    /*
     * `reducedMotion="user"` makes every transform animation below collapse to a
     * plain opacity fade when the OS asks for reduced motion — no per-component
     * media query needed.
     */
    return (
        <MotionConfig reducedMotion="user">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                >
                    {renderView()}
                </motion.div>
            </AnimatePresence>
        </MotionConfig>
    );
}