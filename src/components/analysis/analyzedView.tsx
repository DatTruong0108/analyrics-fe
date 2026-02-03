/* System Package */
import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { EB_Garamond, Lora } from "next/font/google";
import Image from "next/image";

/* Application Package */
import FooterCredits from "./footerCredits";
import { ISongMetadata } from "@/types/dashboard/song.interface";
import { IAnalysisResult } from "@/types/analysis/analysis.interface";

export type AnalysisWithSong = IAnalysisResult & { song: ISongMetadata };

interface AnalyzedViewProps {
    data: AnalysisWithSong;
    onBack: () => void;
    onRegenerate: () => void;
    isFromCache: boolean;
}

const ebGaramond = EB_Garamond({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500"],
    style: ["italic"],
    display: "swap"
});

const lora = Lora({
    subsets: ["latin", "vietnamese"],
    weight: ["400", "500"],
    style: ["italic"],
    display: "swap"
});

export default function AnalyzedView({ data, onBack, onRegenerate, isFromCache }: AnalyzedViewProps) {
    const [openLyricsIndex, setOpenLyricsIndex] = useState<number | null>(null);
    const [isRotating, setIsRotating] = useState(false);

    const handleRegenerate = () => {
        setIsRotating(true);
        onRegenerate();
    }

    return (
        <div className="min-h-screen bg-transparent text-white pb-20 relative selection:bg-purple-500/30">
            <div className="fixed inset-0 -z-10 overflow-hidden background-img">
                {data.song && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            transition={{ duration: 1.5 }}
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${data.song.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                willChange: 'transform, opacity',
                            }}
                        />
                        <motion.div
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-3xl"
                        />
                    </>
                )}
            </div>

            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onBack}
                className="fixed top-8 left-6 md:left-12 z-50 flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl hover:bg-white/15 transition-all group"
            >
                <Icon icon="ph:arrow-left-bold" className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold tracking-wider">Quay lại</span>
            </motion.button>

            {/* Header */}
            <header className="pt-24 px-6 max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-10">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative w-64 h-64 md:w-72 md:h-72 rounded-4xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 shrink-0 cursor-pointer"
                >
                    <Image
                        src={data.song.imageUrl}
                        alt={data.song.title}
                        fill
                        priority
                        className="object-cover"
                    />
                </motion.div>

                <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="text-[10px] md:text-xs uppercase font-black tracking-[0.2em] text-white/50 select-none">
                            Vibe:
                        </span>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {data.vibe.split(',').map((vibe, index) => (
                                <motion.span
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className="px-4 py-1.5 bg-white/20 backdrop-blur-xl border border-white/40 rounded-full text-[10px] md:text-xs uppercase font-black tracking-widest shadow-lg text-white whitespace-nowrap"
                                >
                                    {vibe.trim()}
                                </motion.span>
                            ))}
                        </div>
                    </div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl"
                    >
                        {data.song.title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="text-2xl text-zinc-400 font-medium italic"
                    >
                        {data.song.artist}
                    </motion.p>
                </div>
            </header>

            {/* Thông điệp cốt lõi */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="max-w-6xl mx-auto px-6 mt-20"
            >
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-4xl relative overflow-hidden shadow-2xl">
                    <Icon icon="ph:quotes-fill" className="absolute -top-4 -left-4 text-9xl text-white/5" />
                    <h2 className="flex items-center gap-2 text-zinc-500 uppercase tracking-widest text-[14px] font-black mb-4">
                        <Icon icon="ph:chat-circle-dots-bold" className="text-purple-400" /> Thông điệp cốt lõi
                    </h2>
                    <p className="text-sm md:text-lg italic font-light leading-relaxed text-zinc-100 relative z-10">
                        "{data.coreMessage}"
                    </p>

                    {isFromCache && (
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                                <span>💾</span>
                                <span>Kết quả đã lưu từ lần phân tích trước</span>
                            </div>

                            <button
                                onClick={handleRegenerate}
                                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
                            >
                                <Icon
                                    icon="ph:arrow-clockwise-bold"
                                    className={`text-xs ${isRotating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest underline decoration-dotted underline-offset-4">
                                    Tạo phân tích mới
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </motion.section>

            <div className="max-w-6xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Phân tích chi tiết */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="space-y-4">
                        <h3 className="flex items-center gap-2 text-white font-bold text-3xl tracking-tight">
                            <Icon icon="ph:music-notes-bold" className="text-pink-500" /> Phân tích chi tiết
                        </h3>
                        <p className="text-zinc-400 text-lg leading-relaxed font-light">{data.overview}</p>
                    </div>

                    <div className="space-y-6">
                        {data.analysis.map((item: any, index: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                key={index}
                                className="bg-zinc-900/30 border border-white/5 hover:border-white/10 rounded-4xl p-8 space-y-6 transition-colors"
                            >
                                <h4 className="text-pink-500 font-black uppercase tracking-[0.2em] text-xs">{item.section}</h4>
                                <p className="text-zinc-200 text-lg leading-relaxed font-light">{item.content}</p>

                                <button
                                    onClick={() => setOpenLyricsIndex(openLyricsIndex === index ? null : index)}
                                    className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 border border-white/5 transition-all"
                                >
                                    <Icon icon={openLyricsIndex === index ? "ph:caret-up-bold" : "ph:caret-down-bold"} />
                                    {openLyricsIndex === index ? "Ẩn lời bài hát" : "Xem lời bài hát"}
                                </button>

                                <AnimatePresence>
                                    {openLyricsIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-black/40 border border-white/5 p-6 rounded-2xl shadow-inner">
                                                <p className={`whitespace-pre-line italic text-zinc-400 font-serif text-[18px] leading-loose tracking-wide ${ebGaramond.className}`}>
                                                    {item.lyricsQuote}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Giải mã Slang/Metaphor */}
                <aside className="lg:col-span-4 space-y-10">
                    {/* Cột Lời bài hát đầy đủ */}
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl lyrics-container">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                            <Icon icon="ph:music-notes-simple-bold" className="text-zinc-500" /> Lời bài hát
                        </h3>
                        <div className="max-h-[500px] overflow-y-auto pr-3 lyrics-scrollbar">
                            <div className={`text-[17px] leading-relaxed tracking-wide text-zinc-300 ${lora.className}`}>
                                {data.fullLyrics.split('\n').map((line, index) => (
                                    <p
                                        key={index}
                                        className="opacity-100 md:opacity-40 md:hover:opacity-100 md:hover:text-glow transition-all duration-500 cursor-default min-h-[1.6em]"
                                    >
                                        {line || '\u00A0'}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Phần Slang */}
                    <div className="space-y-6">
                        <h3 className="flex items-center gap-2 text-white font-bold text-2xl tracking-tight">
                            <Icon icon="ph:lightning-bold" className="text-cyan-400" /> Giải mã Slang
                        </h3>
                        <div className="space-y-4">
                            {data.metaphors.map((meta: { phrase: string; meaning: string }, idx: number) => (
                                <motion.div
                                    whileHover={{ x: 5 }}
                                    key={idx}
                                    className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-2 hover:bg-white/10 transition-all"
                                >
                                    <span className="text-[9px] uppercase font-black text-zinc-600 tracking-tighter">Keyword</span>
                                    <h5 className="font-bold text-white text-lg leading-tight">"{meta.phrase}"</h5>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-light">{meta.meaning}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>

            <div className="mt-32">
                <FooterCredits />
            </div>
        </div>
    );
}