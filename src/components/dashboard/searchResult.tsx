'use client';

/* System Package */
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";
import SongCard from "./songCard";
import SongCardSkeleton from "./songCardSkeleton";
import { EASE_OUT, gridItemTransition } from "@/lib/motion";

interface SearchResultsProps {
    songs: ISongMetadata[];
    loading: boolean;
    onSongClick: (song: ISongMetadata) => void;
}

const SKELETON_COUNT = 6;

export default function SearchResults({ songs, loading, onSongClick }: SearchResultsProps) {
    /* One key per state so `mode="wait"` crossfades skeletons -> results -> empty. */
    const stateKey = loading ? "loading" : songs.length === 0 ? "empty" : "results";

    return (
        <AnimatePresence mode="wait" initial={false}>
            {loading && (
                <motion.div
                    key={stateKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-12 space-y-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <SongCardSkeleton key={i} />
                        ))}
                    </div>
                </motion.div>
            )}

            {!loading && songs.length === 0 && (
                <motion.div
                    key={stateKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    className="mt-20 text-center text-zinc-500"
                >
                    Không tìm thấy bài hát nào phù hợp với yêu cầu của bạn.
                </motion.div>
            )}

            {!loading && songs.length > 0 && (
                <motion.div
                    key={stateKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-12 space-y-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {songs.map((song, index) => (
                            <motion.div
                                key={song.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={gridItemTransition(index, SKELETON_COUNT)}
                                onClick={() => onSongClick(song)}
                            >
                                <SongCard song={song} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
