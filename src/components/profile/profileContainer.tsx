'use client';

/* System Package */
import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import Navbar from "@/components/dashboard/navBar";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import ProfileHeader from "./profileHeader";
import HistorySection from "./historySection";
import FavoritesSection from "./favoritesSection";
import ProfileTabs, { ProfileTab, profilePanelId, profileTabId } from "./profileTabs";
import ProfileSkeleton from "./profileSkeleton";
import GuestPrompt from "./guestPrompt";

export default function ProfileContainer() {
    const { user, status } = useAuth();
    const [activeTab, setActiveTab] = useState<ProfileTab>("history");

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

                                    <motion.div variants={fadeInUp} className="space-y-8">
                                        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

                                        {/*
                                            Only the active panel is mounted, so switching tabs refetches
                                            it — a song favourited or viewed meanwhile shows up. Each
                                            section is keyed by user so one account's list never shows
                                            under another.
                                        */}
                                        <div
                                            role="tabpanel"
                                            id={profilePanelId(activeTab)}
                                            aria-labelledby={profileTabId(activeTab)}
                                        >
                                            <AnimatePresence mode="wait" initial={false}>
                                                <motion.div
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                >
                                                    {activeTab === "history" ? (
                                                        <HistorySection key={user.id} />
                                                    ) : (
                                                        <FavoritesSection key={user.id} />
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>
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
