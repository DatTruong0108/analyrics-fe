'use client';

/* System Package */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import AuthModal from "@/components/auth/authModal";
import { useAuth } from "@/components/auth/authProvider";
import { ApiError } from "@/lib/api";
import { EASE_OUT } from "@/lib/motion";
import { setFavorite } from "@/lib/favorites-api";

const FALLBACK_ERROR = "Không thể cập nhật danh sách yêu thích.";

interface FavoriteButtonProps {
    songId: string;
    /* From the analyze response, so the heart is right on first paint. */
    initialIsFavorited: boolean;
}

/*
 * Stand-in while the heart's state is still unknown (a signed-in visitor whose
 * favourite lookup has not answered yet). Same footprint as the real button,
 * so nothing shifts when it swaps in.
 */
export function FavoriteButtonPlaceholder() {
    return (
        <button
            type="button"
            disabled
            aria-busy="true"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-sm font-bold tracking-wide text-zinc-500 cursor-wait"
        >
            <Icon icon="ph:heart-bold" aria-hidden="true" className="w-5 h-5 animate-pulse" />
            Yêu thích
        </button>
    );
}

export default function FavoriteButton({ songId, initialIsFavorited }: FavoriteButtonProps) {
    const { status } = useAuth();
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    /* Synchronous guard: a double click must not fire a second request mid-flight. */
    const isPendingRef = useRef(false);
    /*
     * Set when a guest clicks the heart. Signing in from the modal flips the
     * auth status, and the effect below finishes what they asked for. The
     * analyze response was computed for a guest, so it says `false` either
     * way — an add is idempotent, so it is also the safe way to resync.
     */
    const pendingAddAfterLoginRef = useRef(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    const applyFavorite = async (next: boolean) => {
        if (isPendingRef.current) return;
        isPendingRef.current = true;

        /* Optimistic: the heart flips now and rolls back if the server refuses. */
        setIsFavorited(next);
        setIsPending(true);
        setError(null);

        try {
            setIsFavorited(await setFavorite(songId, next));
        } catch (err) {
            setIsFavorited(!next);
            setError(err instanceof ApiError ? err.message : FALLBACK_ERROR);
        } finally {
            isPendingRef.current = false;
            setIsPending(false);
        }
    };

    useEffect(() => {
        if (status !== "authenticated" || !pendingAddAfterLoginRef.current) return;
        pendingAddAfterLoginRef.current = false;
        void applyFavorite(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on the guest → member transition only
    }, [status]);

    const handleClick = () => {
        if (status === "guest") {
            pendingAddAfterLoginRef.current = true;
            setIsAuthModalOpen(true);
            return;
        }

        void applyFavorite(!isFavorited);
    };

    /* Until the session resolves we cannot tell a guest from a member, so the click would guess. */
    const isDisabled = status === "loading" || isPending;

    return (
        <div className="flex flex-col items-center md:items-start gap-2">
            <motion.button
                ref={triggerRef}
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                aria-pressed={isFavorited}
                aria-busy={isPending}
                whileTap={isDisabled ? undefined : { scale: 0.94 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md text-sm font-bold tracking-wide transition-colors cursor-pointer disabled:cursor-wait ${
                    isFavorited
                        ? "bg-pink-500/15 border-pink-500/40 text-pink-300 enabled:hover:bg-pink-500/25"
                        : "bg-white/5 border-white/15 text-zinc-200 enabled:hover:bg-white/15"
                }`}
            >
                <motion.span
                    key={isFavorited ? "filled" : "outline"}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="inline-flex"
                    aria-hidden="true"
                >
                    <Icon
                        icon={isFavorited ? "ph:heart-fill" : "ph:heart-bold"}
                        className={`w-5 h-5 ${isFavorited ? "text-pink-500" : ""}`}
                    />
                </motion.span>
                {isFavorited ? "Đã yêu thích" : "Yêu thích"}
            </motion.button>

            <AnimatePresence>
                {error && (
                    <motion.p
                        role="alert"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        className="flex items-center gap-1.5 text-xs text-red-400"
                    >
                        <Icon icon="ph:warning-circle-bold" aria-hidden="true" className="w-3.5 h-3.5" />
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={isAuthModalOpen}
                initialTab="login"
                onClose={() => setIsAuthModalOpen(false)}
                triggerRef={triggerRef}
            />
        </div>
    );
}
