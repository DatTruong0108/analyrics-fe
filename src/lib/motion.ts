/* System Package */
import type { Transition, Variants } from "framer-motion";

/**
 * Shared entrance-animation primitives for the dashboard.
 *
 * Performance rule: every variant here animates ONLY `opacity` and `transform`
 * (x / y / scale). Those two are handled by the compositor, so they never
 * trigger layout or paint and stay at 60fps even on low-end devices. Never add
 * `filter`, `width`, `height`, `top` or `box-shadow` to these variants.
 */

/** Cubic-bezier "ease-out expo" — fast start, gentle settle. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Base transition shared by every entrance animation. */
export const ENTER_TRANSITION: Transition = {
    duration: 0.5,
    ease: EASE_OUT,
};

/** Short transition used when content leaves the screen. */
export const EXIT_TRANSITION: Transition = {
    duration: 0.2,
    ease: "easeIn",
};

/** Delay (seconds) between two consecutive children of a stagger container. */
export const STAGGER_STEP = 0.08;

/** Delay (seconds) between two consecutive cards inside a grid. */
export const GRID_STAGGER_STEP = 0.06;

/**
 * Parent orchestrator. Children declaring `variants={fadeInUp}` inherit the
 * `hidden` / `visible` states automatically and are revealed one after another
 * instead of all at once.
 */
export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            delayChildren: 0.05,
            staggerChildren: STAGGER_STEP,
        },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: ENTER_TRANSITION },
    exit: { opacity: 0, transition: EXIT_TRANSITION },
};

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: ENTER_TRANSITION },
    exit: { opacity: 0, y: -12, transition: EXIT_TRANSITION },
};

export const fadeInDown: Variants = {
    hidden: { opacity: 0, y: -16 },
    visible: { opacity: 1, y: 0, transition: ENTER_TRANSITION },
    exit: { opacity: 0, y: -16, transition: EXIT_TRANSITION },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: ENTER_TRANSITION },
    exit: { opacity: 0, scale: 0.98, transition: EXIT_TRANSITION },
};

/** Vertical rule / divider that draws itself in. */
export const growLine: Variants = {
    hidden: { opacity: 0, scaleY: 0 },
    visible: {
        opacity: 1,
        scaleY: 1,
        transition: { duration: 0.6, ease: EASE_OUT },
    },
};

/** Horizontal rule / divider that draws itself in. */
export const growLineX: Variants = {
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
        opacity: 1,
        scaleX: 1,
        transition: { duration: 0.7, ease: EASE_OUT },
    },
};

/**
 * Entrance for a card at `index` inside a grid.
 *
 * The delay is derived from the position within its own batch (`index % batchSize`)
 * so that appending a new page of results replays a short local stagger instead
 * of pushing later cards behind an ever-growing delay.
 */
export function gridItemTransition(index: number, batchSize: number): Transition {
    return {
        duration: 0.45,
        ease: EASE_OUT,
        delay: (index % batchSize) * GRID_STAGGER_STEP,
    };
}
