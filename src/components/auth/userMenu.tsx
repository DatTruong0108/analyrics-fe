'use client';

/* System Package */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import { scaleIn } from "@/lib/motion";

export default function UserMenu() {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    // Escape key to close and restore focus
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                setIsOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    if (!user) return null;

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            setIsOpen(false);
            await signOut();
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div ref={menuRef} className="relative inline-block text-left">
            <button
                ref={triggerRef}
                id="user-menu-button"
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-controls="user-menu-dropdown"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-sm font-medium cursor-pointer"
            >
                <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                    <Icon icon="ph:user-bold" className="w-3 h-3" />
                </div>
                <span className="text-zinc-200 font-medium">
                    Xin chào, <strong className="text-white font-semibold">{user.name}</strong>
                </span>
                <Icon
                    icon="ph:caret-down-bold"
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        id="user-menu-dropdown"
                        role="menu"
                        aria-labelledby="user-menu-button"
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-zinc-900/95 border border-white/10 p-2 shadow-2xl backdrop-blur-xl z-50 outline-none"
                    >
                        <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
                            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">{user.email}</p>
                        </div>

                        <button
                            role="menuitem"
                            type="button"
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                        >
                            <Icon icon="ph:sign-out-bold" className="w-4 h-4" />
                            <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
