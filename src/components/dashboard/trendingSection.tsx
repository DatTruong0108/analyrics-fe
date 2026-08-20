'use client';

/* System Package */
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import SongCard from "./songCard";
import SongCardSkeleton from "./songCardSkeleton";
import { ISongMetadata } from "@/types/dashboard/song.interface";
import { EASE_OUT, fadeInUp, gridItemTransition, staggerContainer } from "@/lib/motion";

interface TrendingSectionProps {
    onSongClick: (song: ISongMetadata) => void;
}

export default function TrendingSection({ onSongClick }: TrendingSectionProps) {
    const [songs, setSongs] = useState<ISongMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 6;

    const fetchTrending = async (currentOffset: number) => {
        try {
            setLoading(true);
            const baseUrl = process.env.NODE_ENV === "development"
                ? process.env.NEXT_PUBLIC_API_URL
                : process.env.NEXT_PUBLIC_API_PROD;
            const response = await fetch(`${baseUrl}/analysis/trending?limit=${LIMIT}&offset=${currentOffset}`);

            if (response.status !== 200) {
                setHasMore(false);
                setSongs([]);
                return;
            }

            const result = await response.json();
            if (currentOffset === 0) {
                setSongs(result.data);
            } else {
                setSongs((prevSongs) => [...prevSongs, ...result.data]);
            }

            setHasMore(result.hasMore);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu trending", error);
            setHasMore(false);
            setSongs([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTrending(0);
    }, []);

    return (
        <div className="border-t border-zinc-900 pt-16">
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
                className="flex flex-col items-center mb-10 text-center"
            >
                <motion.span
                    variants={fadeInUp}
                    className="px-3 py-1 text-[10px] border border-zinc-800 rounded-full text-zinc-500 uppercase tracking-widest mb-3"
                >
                    Cộng đồng
                </motion.span>
                <motion.h2 variants={fadeInUp} className="text-3xl font-bold text-white tracking-tight">
                    Trending
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-sm text-zinc-500 mt-2">
                    Khám phá những bài hát mọi người đang phân tích
                </motion.p>
            </motion.div>

            {/*
                One keyed wrapper per state with `mode="wait"`: the outgoing set is
                fully unmounted before the incoming one mounts, so the grid never
                holds both at once and never jumps mid-transition.
            */}
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={loading ? "skeletons" : "songs"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {loading ? (
                        Array.from({ length: LIMIT }).map((_, i) => (
                            <SongCardSkeleton key={`skeleton-${i}`} />
                        ))
                    ) : (
                        songs.map((song, index) => (
                            <motion.div
                                key={`${song.id}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={gridItemTransition(index, LIMIT)}
                                onClick={() => onSongClick(song)}
                            >
                                <SongCard song={song} />
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </AnimatePresence>

            {hasMore && (
                <div className="flex justify-center mt-12">
                    <motion.button
                        onClick={() => {
                            const nextOffset = offset + LIMIT;
                            setOffset(nextOffset);
                            fetchTrending(nextOffset);
                        }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="px-10 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        Tải thêm
                    </motion.button>
                </div>
            )}
        </div>
    );
}
