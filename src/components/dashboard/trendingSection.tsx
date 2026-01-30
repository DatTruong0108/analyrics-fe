'use client';

/* System Package */
import { useState, useEffect } from "react";

/* Application Package */
import SongCard from "./songCard";
import SongCardSkeleton from "./songCardSkeleton";
import { ISongMetadata } from "@/types/dashboard/song.interface";

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

    if (loading) {
        return (
            <div className="mt-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin"></div>
                <p className="text-zinc-500 text-sm animate-pulse">Đang tải bài hát thịnh hành...</p>
            </div>
        );
    }

    return (
        <div className="border-t border-zinc-900 pt-16">
            <div className="flex flex-col items-center mb-10 text-center">
                <span className="px-3 py-1 text-[10px] border border-zinc-800 rounded-full text-zinc-500 uppercase tracking-widest mb-3">
                    Cộng đồng
                </span>
                <h2 className="text-3xl font-bold text-white tracking-tight">Trending</h2>
                <p className="text-sm text-zinc-500 mt-2">Khám phá những bài hát mọi người đang phân tích</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: LIMIT }).map((_, i) => (
                        <SongCardSkeleton key={i} />
                    ))
                ) : (
                    songs.map((song, index) => (
                        <div key={`${song.id}-${index}`} onClick={() => onSongClick(song)}>
                            <SongCard song={song} />
                        </div>
                    ))
                )}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={() => {
                            const nextOffset = offset + LIMIT;
                            setOffset(nextOffset);
                            fetchTrending(nextOffset);
                        }}
                        className="px-10 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-800 hover:text-white transition-all active:scale-95"
                    >
                        Tải thêm
                    </button>
                </div>
            )}
        </div>
    );
}