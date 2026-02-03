'use client';

/* System Package */
import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";

/* Application Package */
import quotesData from "@/data/quotes.json";

export default function QuoteSection() {
    const [quote, setQuote] = useState({
        text: "",
        author: "",
        source: "",
    });

    const getRandomQuote = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * quotesData.length);
        setQuote(quotesData[randomIndex]);
    }, []);

    useEffect(() => {
        getRandomQuote();
    }, [getRandomQuote]);

    if (!quote.text) return null;

    return (
        <div className="my-12 max-w-4xl mx-auto text-center px-6 animate-slide-up">
            <div className="relative group">
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-zinc-900 font-serif opacity-50 select-none">
                    “
                </span>

                <p className="relative z-10 text-xl md:text-2xl font-extralight italic text-zinc-200 leading-snug tracking-wide transition-all duration-700">
                    {quote.text}
                </p>

                <div className="mt-6 flex flex-col items-center space-y-2">
                    <div className="h-px w-8 bg-zinc-800"></div>
                    <div className="flex items-center space-x-4">
                        <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.4em] font-bold">
                            <span className="text-zinc-300">{quote.author}</span>
                            <span className="mx-2 opacity-30">/</span>
                            <span className="font-medium opacity-60">{quote.source}</span>
                        </p>
                        <button
                            onClick={getRandomQuote}
                            title="Đổi câu khác"
                            className="text-zinc-600 hover:text-white transition-all duration-300 active:rotate-180 hover:scale-110"
                        >
                            <Icon icon="ph:shuffle-bold" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}