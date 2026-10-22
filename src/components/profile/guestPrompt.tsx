'use client';

/* System Package */
import { useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

/* Application Package */
import AuthModal from "@/components/auth/authModal";
import { EASE_OUT, fadeInUp, scaleIn, staggerContainer } from "@/lib/motion";

/*
 * What a guest sees on `/me`. No profile data is ever rendered here — signing
 * in from this screen flips the auth status, and the container swaps in the
 * real profile.
 */
export default function GuestPrompt() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement | null>(null);

    return (
        <>
            <motion.section
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-6"
            >
                <motion.div
                    variants={scaleIn}
                    className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center"
                >
                    <Icon icon="ph:lock-key-bold" aria-hidden="true" className="w-8 h-8 text-zinc-400" />
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                        Vui lòng đăng nhập
                    </h1>
                    <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                        Đăng nhập để xem hồ sơ và lịch sử các bài hát bạn đã phân tích.
                    </p>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3">
                    <motion.button
                        ref={triggerRef}
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black text-sm font-bold cursor-pointer"
                    >
                        <Icon icon="ph:sign-in-bold" aria-hidden="true" className="w-4 h-4" />
                        Đăng nhập
                    </motion.button>

                    <Link
                        href="/"
                        className="px-8 py-3 rounded-full border border-zinc-800 text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                        Về trang chủ
                    </Link>
                </motion.div>
            </motion.section>

            <AuthModal
                isOpen={isModalOpen}
                initialTab="login"
                onClose={() => setIsModalOpen(false)}
                triggerRef={triggerRef}
            />
        </>
    );
}
