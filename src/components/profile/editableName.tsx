'use client';

/* System Package */
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import { ApiError } from "@/lib/api";
import { EASE_OUT } from "@/lib/motion";
import { MAX_USER_NAME_LENGTH, updateName } from "@/lib/profile-api";

interface EditableNameProps {
    name: string;
}

const SAVED_FLASH_MS = 2_000;
const FALLBACK_SAVE_ERROR = "Không thể lưu tên, vui lòng thử lại.";

const swapTransition = { duration: 0.2, ease: EASE_OUT };

export default function EditableName({ name }: EditableNameProps) {
    const { updateUser } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasJustSaved, setHasJustSaved] = useState(false);

    /*
     * State updates are async, so two Enter presses in the same tick would both
     * see `isSaving === false`. The ref flips synchronously and is the real guard
     * against a double submit; the state only drives what is rendered.
     */
    const isSavingRef = useRef(false);

    /*
     * The pencil button remounts only after the form's exit animation, so focus
     * cannot be moved back to it right after saving — it does not exist yet.
     * The flag is picked up by the button's ref callback once it mounts.
     */
    const shouldRestoreFocusRef = useRef(false);

    const trimmedDraft = draft.trim();
    const isTooLong = trimmedDraft.length > MAX_USER_NAME_LENGTH;
    const isUnchanged = trimmedDraft === name;
    const canSave = !isSaving && trimmedDraft.length > 0 && !isTooLong && !isUnchanged;

    useEffect(() => {
        if (!hasJustSaved) return;
        const timer = setTimeout(() => setHasJustSaved(false), SAVED_FLASH_MS);
        return () => clearTimeout(timer);
    }, [hasJustSaved]);

    const startEditing = () => {
        setDraft(name);
        setError(null);
        setHasJustSaved(false);
        setIsEditing(true);
    };

    const stopEditing = () => {
        if (isSavingRef.current) return;
        shouldRestoreFocusRef.current = true;
        setError(null);
        setIsEditing(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSavingRef.current) return;

        /* Enter on an untouched name just closes the editor — nothing to save. */
        if (isUnchanged) {
            stopEditing();
            return;
        }
        if (!canSave) return;

        isSavingRef.current = true;
        setIsSaving(true);
        setError(null);

        try {
            const updatedUser = await updateName(trimmedDraft);
            updateUser(updatedUser);

            shouldRestoreFocusRef.current = true;
            setIsEditing(false);
            setHasJustSaved(true);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : FALLBACK_SAVE_ERROR);
        } finally {
            isSavingRef.current = false;
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            stopEditing();
        }
    };

    const restoreFocusOnMount = (button: HTMLButtonElement | null) => {
        if (button && shouldRestoreFocusRef.current) {
            shouldRestoreFocusRef.current = false;
            button.focus();
        }
    };

    return (
        <AnimatePresence mode="wait" initial={false}>
            {isEditing ? (
                <motion.form
                    key="edit"
                    onSubmit={handleSubmit}
                    aria-busy={isSaving}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={swapTransition}
                    className="space-y-2"
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <label htmlFor="profile-name" className="sr-only">
                            Tên hiển thị
                        </label>
                        <input
                            id="profile-name"
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={(e) => e.currentTarget.select()}
                            readOnly={isSaving}
                            autoFocus
                            autoComplete="name"
                            maxLength={MAX_USER_NAME_LENGTH}
                            aria-invalid={Boolean(error) || isTooLong}
                            aria-describedby="profile-name-hint"
                            className="flex-1 min-w-0 bg-white/5 border border-white/15 focus:border-white/40 rounded-xl px-4 py-2 text-2xl md:text-4xl font-black tracking-tight text-white outline-none transition-colors read-only:opacity-60 read-only:cursor-wait"
                        />

                        <div className="flex items-center gap-2 shrink-0">
                            <motion.button
                                type="submit"
                                disabled={!canSave}
                                whileHover={canSave ? { scale: 1.04 } : undefined}
                                whileTap={canSave ? { scale: 0.95 } : undefined}
                                transition={swapTransition}
                                className="inline-flex items-center justify-center gap-2 min-w-28 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Icon icon="ph:spinner-gap-bold" aria-hidden="true" className="w-4 h-4 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="ph:check-bold" aria-hidden="true" className="w-4 h-4" />
                                        Lưu
                                    </>
                                )}
                            </motion.button>

                            <button
                                type="button"
                                onClick={stopEditing}
                                disabled={isSaving}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Huỷ
                            </button>
                        </div>
                    </div>

                    <div id="profile-name-hint" className="flex items-start justify-between gap-4 text-xs min-h-4">
                        <AnimatePresence mode="wait" initial={false}>
                            {error ? (
                                <motion.p
                                    key="error"
                                    role="alert"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={swapTransition}
                                    className="flex items-center gap-1.5 text-red-400"
                                >
                                    <Icon icon="ph:warning-circle-bold" aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
                                    {error}
                                </motion.p>
                            ) : (
                                <motion.p
                                    key="help"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={swapTransition}
                                    className="text-zinc-500"
                                >
                                    Nhấn Enter để lưu, Esc để huỷ
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <span className={`tabular-nums shrink-0 ${isTooLong ? "text-red-400" : "text-zinc-600"}`}>
                            {trimmedDraft.length}/{MAX_USER_NAME_LENGTH}
                        </span>
                    </div>
                </motion.form>
            ) : (
                <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={swapTransition}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                    <h1 className="min-w-0 wrap-break-word text-4xl md:text-6xl font-black tracking-tighter text-white">
                        {name}
                    </h1>

                    <motion.button
                        ref={restoreFocusOnMount}
                        type="button"
                        onClick={startEditing}
                        aria-label="Chỉnh sửa tên"
                        title="Chỉnh sửa tên"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        transition={swapTransition}
                        className="w-10 h-10 shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        <Icon icon="ph:pencil-simple-bold" aria-hidden="true" className="w-4 h-4" />
                    </motion.button>

                    {/* Persistent live region: it must exist before its text changes to be announced. */}
                    <span role="status" className="text-xs font-semibold text-emerald-400">
                        <AnimatePresence>
                            {hasJustSaved && (
                                <motion.span
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={swapTransition}
                                    className="inline-flex items-center gap-1"
                                >
                                    <Icon icon="ph:check-circle-bold" aria-hidden="true" className="w-4 h-4" />
                                    Đã lưu
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
