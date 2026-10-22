'use client';

/* System Package */
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import Navbar from "@/components/dashboard/navBar";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import ProfileHeader from "./profileHeader";
import HistorySection from "./historySection";
import ProfileSkeleton from "./profileSkeleton";
import GuestPrompt from "./guestPrompt";

export default function ProfileContainer() {
    const { user, status } = useAuth();

    /* "authenticated" without a user cannot happen, but it must never render a blank page. */
    const view = status === "loading" ? "loading" : user ? "profile" : "guest";

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
                <Navbar />

                <main className="max-w-6xl mx-auto px-6 pt-24 pb-16">
                    {/*
                        Keyed per auth state with `mode="wait"`: signing in from the
                        guest prompt cross-fades into the profile instead of snapping.
                    */}
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={view}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                            {view === "loading" && <ProfileSkeleton />}

                            {view === "guest" && <GuestPrompt />}

                            {view === "profile" && user && (
                                <motion.div
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-14"
                                >
                                    <motion.div variants={fadeInUp}>
                                        <Link
                                            href="/"
                                            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
                                        >
                                            <Icon
                                                icon="ph:arrow-left-bold"
                                                aria-hidden="true"
                                                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1"
                                            />
                                            Trang chủ
                                        </Link>
                                    </motion.div>

                                    <motion.div variants={fadeInUp}>
                                        <ProfileHeader user={user} />
                                    </motion.div>

                                    <motion.div variants={fadeInUp}>
                                        {/* Remounts on account switch so one user's history never shows under another. */}
                                        <HistorySection key={user.id} />
                                    </motion.div>
                                </motion.div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </MotionConfig>
    );
}
