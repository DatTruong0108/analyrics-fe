'use client';

/* System Package */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import SongCard from "@/components/dashboard/songCard";
import SongCardSkeleton from "@/components/dashboard/songCardSkeleton";
import { ApiError, isAbortError } from "@/lib/api";
import { EASE_OUT, gridItemTransition } from "@/lib/motion";
import { setPendingAnalysis } from "@/lib/pending-analysis";
import { fetchHistory } from "@/lib/profile-api";
import { IHistoryItem } from "@/types/profile/profile.interface";

/* Multiple of the 3-column grid, so every full page fills its rows. */
const PAGE_SIZE = 9;
const FALLBACK_LOAD_ERROR = "Không thể tải lịch sử phân tích.";

type InitialState = "loading" | "ready" | "error";

const toMessage = (error: unknown): string =>
    error instanceof ApiError ? error.message : FALLBACK_LOAD_ERROR;

export default function HistorySection() {
    const [items, setItems] = useState<IHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [initialState, setInitialState] = useState<InitialState>("loading");
    const [initialError, setInitialError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

    /*
     * Synchronous guard against a second request while one is in flight: a
     * keyboard double-press on "Tải thêm" would otherwise fetch the same offset
     * twice and append duplicate cards.
     */
    const isFetchingRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);

    const loadPage = useCallback(async (offset: number) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        const controller = new AbortController();
        abortRef.current = controller;
        const isFirstPage = offset === 0;

        if (isFirstPage) {
            setInitialState("loading");
            setInitialError(null);
        } else {
            setIsLoadingMore(true);
            setLoadMoreError(null);
        }

        try {
            const page = await fetchHistory(PAGE_SIZE, offset, controller.signal);

            /*
             * Offset paging over a "last viewed" order: viewing a song in another
             * tab moves it to the top and shifts every row down one, so the next
             * page can repeat a song already on screen. Drop those repeats.
             */
            setItems((prev) => {
                if (isFirstPage) return page.items;
                const seen = new Set(prev.map((item) => item.id));
                return [...prev, ...page.items.filter((item) => !seen.has(item.id))];
            });
            setTotal(page.total);
            setHasMore(page.hasMore);
            setInitialState("ready");
        } catch (error) {
            if (isAbortError(error)) return;

            /*
             * A failed "load more" keeps the pages already on screen; only the
             * first page may replace the list with an error state.
             */
            if (isFirstPage) {
                setInitialError(toMessage(error));
                setInitialState("error");
            } else {
                setLoadMoreError(toMessage(error));
            }
        } finally {
            /* A superseded request must not release the guard the newer one holds. */
            if (abortRef.current === controller) {
                isFetchingRef.current = false;
                setIsLoadingMore(false);
            }
        }
    }, []);

    useEffect(() => {
        void loadPage(0);

        return () => {
            abortRef.current?.abort();
            abortRef.current = null;
            isFetchingRef.current = false;
        };
    }, [loadPage]);

    const handleLoadMore = () => {
        if (isFetchingRef.current) return;
        void loadPage(items.length);
    };

    const remaining = Math.max(total - items.length, 0);
    const pendingSkeletons = Math.min(PAGE_SIZE, remaining);

    return (
        <section aria-labelledby="history-heading" className="space-y-6">
            <div className="flex items-end justify-between gap-4 border-b border-zinc-900 pb-4">
                <div>
                    <h2 id="history-heading" className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        Lịch sử phân tích
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Những bài hát bạn đã giải mã gần đây</p>
                </div>

                <AnimatePresence>
                    {initialState === "ready" && total > 0 && (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: EASE_OUT }}
                            className="shrink-0 px-3 py-1 text-[10px] border border-zinc-800 rounded-full text-zinc-400 uppercase tracking-widest tabular-nums"
                        >
                            {total} bài hát
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={initialState === "ready" && items.length === 0 ? "empty" : initialState}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                >
                    {initialState === "loading" && (
                        <div
                            aria-busy="true"
                            aria-label="Đang tải lịch sử phân tích"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                                <SongCardSkeleton key={`history-skeleton-${i}`} />
                            ))}
                        </div>
                    )}

                    {initialState === "error" && (
                        <div role="alert" className="flex flex-col items-center text-center gap-4 py-16">
                            <Icon icon="ph:cloud-slash-bold" aria-hidden="true" className="w-12 h-12 text-zinc-700" />
                            <p className="text-sm text-zinc-400">{initialError ?? FALLBACK_LOAD_ERROR}</p>
                            <motion.button
                                type="button"
                                onClick={() => void loadPage(0)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.25, ease: EASE_OUT }}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                            >
                                <Icon icon="ph:arrow-clockwise-bold" aria-hidden="true" className="w-4 h-4" />
                                Thử lại
                            </motion.button>
                        </div>
                    )}

                    {initialState === "ready" && items.length === 0 && (
                        <div className="flex flex-col items-center text-center gap-4 py-16">
                            <Icon icon="ph:music-notes-bold" aria-hidden="true" className="w-12 h-12 text-zinc-700" />
                            <div className="space-y-1">
                                <p className="text-base font-semibold text-zinc-200">Bạn chưa phân tích bài hát nào</p>
                                <p className="text-sm text-zinc-500">Tìm một bài hát và để AI giải mã lời nhạc cho bạn.</p>
                            </div>
                            <Link
                                href="/"
                                className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:scale-105 transition-transform"
                            >
                                Khám phá ngay
                            </Link>
                        </div>
                    )}

                    {initialState === "ready" && items.length > 0 && (
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item, index) => (
                                <motion.li
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={gridItemTransition(index, PAGE_SIZE)}
                                >
                                    {/*
                                        A real link, so it is keyboard- and middle-click-friendly.
                                        The song rides along in sessionStorage; the home page
                                        picks it up and opens the analysis (served from the DB
                                        cache, not a new AI call).
                                    */}
                                    <Link
                                        href="/"
                                        onClick={() => setPendingAnalysis(item)}
                                        aria-label={`Xem bản phân tích ${item.title} - ${item.artist}`}
                                        className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                    >
                                        <SongCard song={item} />
                                    </Link>
                                </motion.li>
                            ))}

                            {isLoadingMore &&
                                Array.from({ length: pendingSkeletons }).map((_, i) => (
                                    <li key={`history-more-skeleton-${i}`} aria-hidden="true">
                                        <SongCardSkeleton />
                                    </li>
                                ))}
                        </ul>
                    )}
                </motion.div>
            </AnimatePresence>

            {initialState === "ready" && hasMore && (
                <div className="flex flex-col items-center gap-3 pt-6">
                    <AnimatePresence>
                        {loadMoreError && (
                            <motion.p
                                role="alert"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: EASE_OUT }}
                                className="flex items-center gap-1.5 text-xs text-red-400"
                            >
                                <Icon icon="ph:warning-circle-bold" aria-hidden="true" className="w-3.5 h-3.5" />
                                {loadMoreError}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <motion.button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        aria-busy={isLoadingMore}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        /* No hover/tap feedback while disabled — it would imply the button still responds. */
                        whileHover={isLoadingMore ? undefined : { scale: 1.04 }}
                        whileTap={isLoadingMore ? undefined : { scale: 0.95 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="inline-flex items-center gap-2 px-10 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-sm font-bold transition-colors cursor-pointer enabled:hover:bg-zinc-800 enabled:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingMore ? (
                            <>
                                <Icon icon="ph:spinner-gap-bold" aria-hidden="true" className="w-4 h-4 animate-spin" />
                                Đang tải...
                            </>
                        ) : loadMoreError ? (
                            "Thử lại"
                        ) : (
                            "Tải thêm"
                        )}
                    </motion.button>
                </div>
            )}
        </section>
    );
}
