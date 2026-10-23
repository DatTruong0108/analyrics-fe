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
import { EASE_OUT, EXIT_TRANSITION, gridItemTransition } from "@/lib/motion";
import { setPendingAnalysis } from "@/lib/pending-analysis";
import { MAX_HISTORY_PAGE_LIMIT, fetchHistory, removeHistoryItem } from "@/lib/profile-api";
import { IHistoryItem } from "@/types/profile/profile.interface";

/* Multiple of the 3-column grid, so every full page fills its rows. */
const PAGE_SIZE = 9;
const FALLBACK_LOAD_ERROR = "Không thể tải lịch sử phân tích.";
const FALLBACK_DELETE_ERROR = "Không thể xoá bài hát khỏi lịch sử.";

type InitialState = "loading" | "ready" | "error";

const toMessage = (error: unknown, fallback = FALLBACK_LOAD_ERROR): string =>
    error instanceof ApiError ? error.message : fallback;

export default function HistorySection() {
    const [items, setItems] = useState<IHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [initialState, setInitialState] = useState<InitialState>("loading");
    const [initialError, setInitialError] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
    /* Songs whose DELETE is in flight; each card tracks its own removal. */
    const [deletingIds, setDeletingIds] = useState<ReadonlySet<string>>(() => new Set());
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    /*
     * Synchronous guard against a second request while one is in flight: a
     * keyboard double-press on "Tải thêm" would otherwise fetch the same offset
     * twice and append duplicate cards.
     */
    const isFetchingRef = useRef(false);
    const abortRef = useRef<AbortController | null>(null);
    /* Synchronous twin of `deletingIds`, so a double click cannot send two DELETEs. */
    const deletingRef = useRef(new Set<string>());
    /* How many cards are loaded, read by the post-delete reload to keep that window. */
    const loadedCountRef = useRef(0);
    const headingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        loadedCountRef.current = items.length;
    }, [items]);

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

    /*
     * Quiet re-fetch after a delete: the list stays on screen (no skeleton) and
     * is swapped in place, refilled to as many cards as were loaded so the gap
     * the removed song left is filled by the next one.
     *
     * It supersedes any request in flight — a pending "load more" or an older
     * reload — since its answer is the newer view of the history.
     */
    const reloadList = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        isFetchingRef.current = true;
        setIsRefreshing(true);

        const limit = Math.min(Math.max(loadedCountRef.current, PAGE_SIZE), MAX_HISTORY_PAGE_LIMIT);

        try {
            const page = await fetchHistory(limit, 0, controller.signal);
            setItems(page.items);
            setTotal(page.total);
            setHasMore(page.hasMore);
        } catch {
            /*
             * Abort or failure alike: the delete already succeeded and the card
             * is already gone locally, so the list on screen is still correct —
             * just one card short until the next load.
             */
        } finally {
            if (abortRef.current === controller) {
                isFetchingRef.current = false;
                setIsRefreshing(false);
                setIsLoadingMore(false);
            }
        }
    }, []);

    const handleRemove = async (item: IHistoryItem, hadFocus: boolean) => {
        if (deletingRef.current.has(item.id)) return;

        deletingRef.current.add(item.id);
        setDeletingIds(new Set(deletingRef.current));
        setDeleteError(null);

        try {
            await removeHistoryItem(item.id);

            /* Drop the card now so the removal feels instant, then resync from the server. */
            setItems((prev) => prev.filter((entry) => entry.id !== item.id));
            setTotal((prev) => Math.max(prev - 1, 0));
            /* The focused × button is about to unmount; keep keyboard users in the section. */
            if (hadFocus) headingRef.current?.focus();
            void reloadList();
        } catch (error) {
            setDeleteError(toMessage(error, FALLBACK_DELETE_ERROR));
        } finally {
            deletingRef.current.delete(item.id);
            setDeletingIds(new Set(deletingRef.current));
        }
    };

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
                    <h2
                        id="history-heading"
                        ref={headingRef}
                        tabIndex={-1}
                        className="text-2xl md:text-3xl font-bold text-white tracking-tight outline-none"
                    >
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

            <AnimatePresence>
                {initialState === "ready" && deleteError && (
                    <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        className="flex items-center gap-1.5 text-xs text-red-400"
                    >
                        <Icon icon="ph:warning-circle-bold" aria-hidden="true" className="w-3.5 h-3.5" />
                        {deleteError}
                    </motion.p>
                )}
            </AnimatePresence>

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
                        <ul
                            aria-busy={isRefreshing}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            <AnimatePresence initial={false}>
                                {items.map((item, index) => {
                                    const isDeleting = deletingIds.has(item.id);

                                    return (
                                        <motion.li
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: EXIT_TRANSITION }}
                                            transition={gridItemTransition(index, PAGE_SIZE)}
                                            aria-busy={isDeleting}
                                            className="relative"
                                        >
                                            {/*
                                                A real link, so it is keyboard- and middle-click-friendly.
                                                The song rides along in sessionStorage; the home page
                                                picks it up and opens the analysis (served from the DB
                                                cache, not a new AI call).

                                                Blocked while deleting: opening the analysis records a
                                                view, which would put the song straight back in history.
                                            */}
                                            <Link
                                                href="/"
                                                onClick={(event) => {
                                                    if (isDeleting) {
                                                        event.preventDefault();
                                                        return;
                                                    }
                                                    setPendingAnalysis(item);
                                                }}
                                                aria-disabled={isDeleting}
                                                tabIndex={isDeleting ? -1 : undefined}
                                                aria-label={`Xem bản phân tích ${item.title} - ${item.artist}`}
                                                className={`block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-opacity ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                                            >
                                                <SongCard song={item} showArrow={false} />
                                            </Link>

                                            {/*
                                                Sits in the card's trailing slot, where other lists show the
                                                arrow. A sibling of the link, not a child: a button inside an
                                                <a> is invalid HTML.
                                            */}
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    void handleRemove(item, event.currentTarget === document.activeElement)
                                                }
                                                disabled={isDeleting}
                                                aria-label={`Xoá ${item.title} - ${item.artist} khỏi lịch sử`}
                                                title="Xoá khỏi lịch sử"
                                                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full text-neutral-500 transition-colors cursor-pointer enabled:hover:text-white enabled:hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-wait"
                                            >
                                                <Icon
                                                    icon={isDeleting ? "ph:spinner-gap-bold" : "ph:x-bold"}
                                                    aria-hidden="true"
                                                    className={`w-5 h-5 ${isDeleting ? "animate-spin" : ""}`}
                                                />
                                            </button>
                                        </motion.li>
                                    );
                                })}
                            </AnimatePresence>

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
                        /* A post-delete reload owns the request slot; "load more" waits for it. */
                        disabled={isLoadingMore || isRefreshing}
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
