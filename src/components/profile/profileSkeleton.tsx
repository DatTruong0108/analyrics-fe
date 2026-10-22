/* Application Package */
import SongCardSkeleton from "@/components/dashboard/songCardSkeleton";

const SKELETON_CARD_COUNT = 6;

/* Shown while the session is still being resolved, before we know who is signed in. */
export default function ProfileSkeleton() {
    return (
        <div aria-busy="true" aria-label="Đang tải hồ sơ" className="space-y-14">
            <div className="h-3 w-24 rounded-full bg-zinc-900 animate-pulse" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 animate-pulse">
                <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-zinc-900" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-28 rounded-full bg-zinc-900" />
                    <div className="h-10 md:h-14 w-2/3 max-w-md rounded-2xl bg-zinc-900" />
                </div>
            </div>

            <div className="space-y-6">
                <div className="h-6 w-48 rounded-full bg-zinc-900 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
                        <SongCardSkeleton key={`profile-skeleton-${i}`} />
                    ))}
                </div>
            </div>
        </div>
    );
}
