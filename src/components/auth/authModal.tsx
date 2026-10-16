'use client';

/* System Package */
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import { fadeIn, scaleIn } from "@/lib/motion";
import LoginForm from "@/components/auth/loginForm";
import RegisterForm from "@/components/auth/registerForm";

export type AuthTab = "login" | "register";

export interface IAuthModalProps {
    isOpen: boolean;
    initialTab?: AuthTab;
    onClose: () => void;
    triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function AuthModal({
    isOpen,
    initialTab = "login",
    onClose,
    triggerRef,
}: IAuthModalProps) {
    const [tab, setTab] = useState<AuthTab>(initialTab);
    const modalRef = useRef<HTMLDivElement>(null);
    const prevActiveElementRef = useRef<HTMLElement | null>(null);

    const [prevProps, setPrevProps] = useState({ isOpen, initialTab });

    // Sync tab when modal opens or initialTab changes (adjusting state during render)
    if (prevProps.isOpen !== isOpen || prevProps.initialTab !== initialTab) {
        setPrevProps({ isOpen, initialTab });
        if (isOpen) {
            setTab(initialTab);
        }
    }

    // Lock body scroll while open
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Focus management: capture active trigger, focus first input on open, restore on close
    useEffect(() => {
        if (isOpen) {
            prevActiveElementRef.current = (document.activeElement as HTMLElement) || null;

            const timer = setTimeout(() => {
                if (modalRef.current) {
                    const firstInput = modalRef.current.querySelector<HTMLElement>(
                        "input:not([disabled]), button:not([disabled])",
                    );
                    firstInput?.focus();
                }
            }, 50);

            return () => clearTimeout(timer);
        }

        // When closed, restore focus
        if (triggerRef?.current) {
            triggerRef.current.focus();
        } else if (prevActiveElementRef.current) {
            prevActiveElementRef.current.focus();
        }
    }, [isOpen, triggerRef]);

    // Focus trap and Escape key handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
            return;
        }

        if (e.key === "Tab") {
            if (!modalRef.current) return;

            const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );

            if (focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    onKeyDown={handleKeyDown}
                >
                    {/* Backdrop: animates only opacity, keeps backdrop-blur a static class */}
                    <motion.div
                        key="auth-modal-backdrop"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        className="fixed inset-0 bg-black/75 backdrop-blur-md"
                        aria-hidden="true"
                    />

                    {/* Modal Panel: glass styling matching songCard, animated with scaleIn */}
                    <motion.div
                        key="auth-modal-panel"
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="auth-modal-title"
                        tabIndex={-1}
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md bg-zinc-900/95 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10 outline-none"
                    >
                        {/* Accessible title for screen readers */}
                        <h2 id="auth-modal-title" className="sr-only">
                            {tab === "login" ? "Đăng nhập tài khoản" : "Đăng ký tài khoản"}
                        </h2>

                        {/* Top bar: Tabs + Close Button */}
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-6">
                            <div role="tablist" aria-label="Tài khoản" className="flex items-center gap-6">
                                <button
                                    role="tab"
                                    id="auth-tab-login"
                                    aria-selected={tab === "login"}
                                    aria-controls="auth-panel-login"
                                    onClick={() => setTab("login")}
                                    className={`relative pb-2 text-base font-bold transition-colors cursor-pointer ${
                                        tab === "login" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    Đăng nhập
                                    {tab === "login" && (
                                        <motion.div
                                            layoutId="auth-tab-underline"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>

                                <button
                                    role="tab"
                                    id="auth-tab-register"
                                    aria-selected={tab === "register"}
                                    aria-controls="auth-panel-register"
                                    onClick={() => setTab("register")}
                                    className={`relative pb-2 text-base font-bold transition-colors cursor-pointer ${
                                        tab === "register" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    Đăng ký
                                    {tab === "register" && (
                                        <motion.div
                                            layoutId="auth-tab-underline"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                                            transition={{ duration: 0.2 }}
                                        />
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Đóng cửa sổ"
                                className="p-1.5 -mr-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <Icon icon="ph:x-bold" className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Content */}
                        {tab === "login" ? (
                            <LoginForm
                                onSuccess={onClose}
                                onSwitchToRegister={() => setTab("register")}
                            />
                        ) : (
                            <RegisterForm
                                onSuccess={onClose}
                                onSwitchToLogin={() => setTab("login")}
                            />
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
