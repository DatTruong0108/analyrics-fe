'use client';

/* System Package */
import { useRef, useState } from "react";
import { motion } from "framer-motion";

/* Application Package */
import { EASE_OUT } from "@/lib/motion";
import { useAuth } from "@/components/auth/authProvider";
import AuthModal, { AuthTab } from "@/components/auth/authModal";
import UserMenu from "@/components/auth/userMenu";

export default function Navbar() {
    const { status } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialTab, setInitialTab] = useState<AuthTab>("login");

    const triggerRef = useRef<HTMLElement | null>(null);

    const openAuthModal = (tab: AuthTab, triggerElement: HTMLElement) => {
        triggerRef.current = triggerElement;
        setInitialTab(tab);
        setIsModalOpen(true);
    };

    return (
        <>
            <motion.nav
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
                className="fixed top-0 w-full z-50 flex justify-end items-center px-6 py-2 bg-black/40 backdrop-blur-xl min-h-[48px]"
            >
                {status === "loading" ? (
                    <div
                        className="h-7 w-28 rounded-full bg-zinc-800/60 animate-pulse"
                        aria-hidden="true"
                    />
                ) : status === "authenticated" ? (
                    <UserMenu />
                ) : (
                    <div className="space-x-8 text-xs font-black uppercase tracking-[0.2em]">
                        <button
                            onClick={(e) => openAuthModal("register", e.currentTarget)}
                            className="hover:text-zinc-400 transition-colors cursor-pointer"
                        >
                            Đăng ký
                        </button>
                        <button
                            onClick={(e) => openAuthModal("login", e.currentTarget)}
                            className="hover:text-zinc-400 transition-colors cursor-pointer"
                        >
                            Đăng nhập
                        </button>
                    </div>
                )}
            </motion.nav>

            <AuthModal
                isOpen={isModalOpen}
                initialTab={initialTab}
                onClose={() => setIsModalOpen(false)}
                triggerRef={triggerRef}
            />
        </>
    );
}
