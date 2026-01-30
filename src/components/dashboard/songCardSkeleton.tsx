export default function SongCardSkeleton() {
    return (
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-4xl p-4 flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 bg-zinc-800 rounded-3xl shrink-0" />

            <div className="flex-1 space-y-3">
                <div className="h-4 bg-zinc-800 rounded-full w-3/4" />
                <div className="h-3 bg-zinc-800/60 rounded-full w-1/2" />
            </div>

            <div className="w-6 h-6 bg-zinc-800/40 rounded-full shrink-0 mr-2" />
        </div>
    );
}