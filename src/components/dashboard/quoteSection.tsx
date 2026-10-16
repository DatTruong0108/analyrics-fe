'use client';

/* System Package */
import { useState, useSyncExternalStore } from "react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

/* Application Package */
import quotesData from "@/data/quotes.json";
import { EASE_OUT, fadeInUp, staggerContainer } from "@/lib/motion";

/*
 * The quote is chosen at random, so the server and the client can never agree
 * on one. Rather than render a quote during SSR and correct it afterwards —
 * which React reports as a hydration mismatch — this section renders nothing
 * until it has hydrated, then reveals a client-chosen quote.
 *
 * `useSyncExternalStore` is the hook that expresses exactly that: React must
 * use `getServerSnapshot` for both the SSR pass and the hydration pass, then
 * re-render with `getSnapshot`. Doing the same job with `useEffect` +
 * `setState` is the cascading-render pattern that `react-hooks/set-state-in-effect`
 * forbids, so the subscription is deliberate rather than a workaround.
 *
 * All three callbacks live at module scope so their identity is stable; passing
 * inline arrows would resubscribe on every render.
 */
const subscribeToNothing = () => () => { };
const getIsHydrated = () => true;
const getIsHydratedOnServer = () => false;

/** Index of a quote other than `current`, so shuffling always visibly changes something. */
function pickOtherQuoteIndex(current: number): number {
    if (quotesData.length < 2) return current;

    /*
     * Draw from the shortened range and skip over `current`, instead of
     * re-rolling until the value differs — this always terminates.
     */
    const drawn = Math.floor(Math.random() * (quotesData.length - 1));
    return drawn >= current ? drawn + 1 : drawn;
}

export default function QuoteSection() {
    const isHydrated = useSyncExternalStore(
        subscribeToNothing,
        getIsHydrated,
        getIsHydratedOnServer,
    );

    /*
     * Lazy initialiser: one quote is picked per mount rather than per render.
     * It also runs during the server pass, but that value is never rendered
     * because `isHydrated` is false there.
     */
    const [index, setIndex] = useState(() =>
        Math.floor(Math.random() * quotesData.length),
    );

    const quote = quotesData[index];

    if (!isHydrated || !quote) return null;

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="my-12 max-w-4xl mx-auto text-center px-6"
        >
            <div className="relative group">
                <motion.span
                    variants={fadeInUp}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-zinc-900 font-serif opacity-50 select-none"
                >
                    “
                </motion.span>

                {/* Keyed on the quote text so shuffling crossfades instead of snapping. */}
                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={quote.text}
                        variants={fadeInUp}
                        exit={{ opacity: 0, y: -12, transition: { duration: 0.18, ease: "easeIn" } }}
                        className="relative z-10 text-xl md:text-2xl font-extralight italic text-zinc-200 leading-snug tracking-wide"
                    >
                        {quote.text}
                    </motion.p>
                </AnimatePresence>

                <motion.div variants={fadeInUp} className="mt-6 flex flex-col items-center space-y-2">
                    <div className="h-px w-8 bg-zinc-800"></div>
                    <div className="flex items-center space-x-4">
                        <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.4em] font-bold">
                            <span className="text-zinc-300">{quote.author}</span>
                            <span className="mx-2 opacity-30">/</span>
                            <span className="font-medium opacity-60">{quote.source}</span>
                        </p>
                        <motion.button
                            onClick={() => setIndex(pickOtherQuoteIndex)}
                            title="Đổi câu khác"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9, rotate: 180 }}
                            transition={{ duration: 0.25, ease: EASE_OUT }}
                            className="text-zinc-600 hover:text-white transition-colors duration-300"
                        >
                            <Icon icon="ph:shuffle-bold" className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}
