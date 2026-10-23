'use client';

/* System Package */
import { useRef } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

/* Application Package */
import { EASE_OUT } from "@/lib/motion";

export type ProfileTab = "history" | "favorites";

const TABS: { id: ProfileTab; label: string; icon: string }[] = [
    { id: "history", label: "Lịch sử", icon: "ph:clock-counter-clockwise-bold" },
    { id: "favorites", label: "Yêu thích", icon: "ph:heart-bold" },
];

export const profileTabId = (tab: ProfileTab): string => `profile-tab-${tab}`;
export const profilePanelId = (tab: ProfileTab): string => `profile-panel-${tab}`;

interface ProfileTabsProps {
    activeTab: ProfileTab;
    onChange: (tab: ProfileTab) => void;
}

/*
 * WAI-ARIA tabs with automatic activation: arrow keys move focus and select,
 * and only the active tab is in the Tab order (roving tabindex).
 */
export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
    const tabRefs = useRef<Record<ProfileTab, HTMLButtonElement | null>>({ history: null, favorites: null });

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const index = TABS.findIndex((tab) => tab.id === activeTab);
        let nextIndex: number | null = null;

        if (event.key === "ArrowRight") nextIndex = (index + 1) % TABS.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + TABS.length) % TABS.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = TABS.length - 1;
        if (nextIndex === null) return;

        event.preventDefault();
        const next = TABS[nextIndex].id;
        onChange(next);
        tabRefs.current[next]?.focus();
    };

    return (
        <div
            role="tablist"
            aria-label="Nội dung hồ sơ"
            onKeyDown={handleKeyDown}
            className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-950 border border-zinc-900"
        >
            {TABS.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                    <button
                        key={tab.id}
                        ref={(element) => {
                            tabRefs.current[tab.id] = element;
                        }}
                        type="button"
                        role="tab"
                        id={profileTabId(tab.id)}
                        aria-selected={isActive}
                        /* Only the active panel is mounted, so only it can be referenced. */
                        aria-controls={isActive ? profilePanelId(tab.id) : undefined}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onChange(tab.id)}
                        className={`relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                            isActive ? "text-black" : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        {isActive && (
                            <motion.span
                                layoutId="profile-tab-indicator"
                                transition={{ duration: 0.3, ease: EASE_OUT }}
                                className="absolute inset-0 rounded-full bg-white"
                                aria-hidden="true"
                            />
                        )}
                        <Icon icon={tab.icon} aria-hidden="true" className="relative w-4 h-4" />
                        <span className="relative">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
