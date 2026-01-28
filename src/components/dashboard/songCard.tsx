'use client';

/* System Package */
import { Icon } from "@iconify/react";

/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";

export default function SongCard({ song }: { song: ISongMetadata }) {
    if (!song) return null;

    return (
        <div className="group relative h-full song-card">
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 
                      group-hover:bg-white/10 group-hover:border-white/20 
                      group-active:scale-[0.98] transition-all duration-300 
                      p-4 rounded-2xl flex items-center gap-4 h-full shadow-xl group-hover:shadow-2xl cursor-pointer">

                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-lg 
                        group-hover:shadow-2xl group-hover:shadow-purple-500/30 transition-all duration-500 shimmer-effect">
                    <img
                        alt={song.title}
                        src={song.imageUrl || "https://placehold.co/400x400/1a1a1a/FFF?text=Music"}
                        loading="lazy"
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 song-img"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-bold song-title text-lg text-white/90 group-hover:text-white truncate transition-colors duration-300 drop-shadow-sm">
                        {song.title || "Tên bài hát"}
                    </h4>
                    <p className="text-neutral-400 song-artist text-sm truncate group-hover:text-white/80 transition-colors duration-300">
                        {song.artist || "Nghệ sĩ"}
                    </p>
                </div>

                <div className="text-neutral-600 group-hover:text-white transition-all duration-300 
                        opacity-30 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 drop-shadow-lg song-icon">
                    <Icon icon="ph:caret-right-bold" className="w-6 h-6" />
                </div>

            </div>
        </div>
    );
}