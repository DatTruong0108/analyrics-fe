'use client';

/* System Package */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

/* Application Package */
import { isAbortError } from "@/lib/api";

/* How long "copied" / "failed" feedback stays before the button resets. */
const FEEDBACK_DURATION_MS = 2500;

type ShareState = "idle" | "copied" | "error";

interface ShareButtonProps {
    /* Site-relative path, e.g. `/song/abc`; resolved against the current origin. */
    path: string;
    title: string;
    text: string;
}

/*
 * Native share sheet where the platform has one (mobile — where Zalo and
 * Facebook sharing happens), otherwise copies the link to the clipboard.
 */
export default function ShareButton({ path, title, text }: ShareButtonProps) {
    const [state, setState] = useState<ShareState>("idle");
    const resetTimerRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    }, []);

    const showFeedback = (next: ShareState) => {
        setState(next);
        if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = window.setTimeout(() => setState("idle"), FEEDBACK_DURATION_MS);
    };

    const handleShare = async () => {
        const url = new URL(path, window.location.origin).toString();

        if (typeof navigator.share === "function") {
            try {
                await navigator.share({ title, text, url });
                return;
            } catch (error) {
                /* The user closed the share sheet: nothing went wrong. */
                if (isAbortError(error)) return;
                /* Otherwise (e.g. not allowed here) fall back to copying. */
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            showFeedback("copied");
        } catch {
            showFeedback("error");
        }
    };

    const label =
        state === "copied" ? "Đã sao chép liên kết" : state === "error" ? "Không thể sao chép" : "Chia sẻ";
    const icon =
        state === "copied" ? "ph:check-bold" : state === "error" ? "ph:warning-circle-bold" : "ph:share-network-bold";

    return (
        <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-sm font-bold tracking-wide text-zinc-200 hover:bg-white/15 transition-colors cursor-pointer"
        >
            <Icon icon={icon} aria-hidden="true" className={`w-5 h-5 ${state === "error" ? "text-red-400" : ""}`} />
            {/* Announced when it changes, so screen readers hear "copied". */}
            <span aria-live="polite">{label}</span>
        </button>
    );
}
