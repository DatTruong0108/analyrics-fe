/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";
import SongCard from "./songCard";

interface SearchResultsProps {
    songs: ISongMetadata[];
    loading: boolean;
    onSongClick: (song: ISongMetadata) => void;
}

export default function SearchResults({ songs, loading, onSongClick }: SearchResultsProps) {
    if (loading) {
        return (
            <div className="mt-20 flex justify-center">
                <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (songs.length === 0) {
        return (
            <div className="mt-20 text-center text-zinc-500">
                Không tìm thấy bài hát nào phù hợp với yêu cầu của bạn.
            </div>
        );
    }

    return (
        <div className="mt-12 space-y-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {songs.map((song) => (
                    <div key={song.id} onClick={() => onSongClick(song)}>
                        <SongCard song={song} />
                    </div>
                ))}
            </div>
        </div>
    )
}