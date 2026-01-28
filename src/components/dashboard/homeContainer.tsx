'use client';

/* System Package */
import { useState, useEffect } from "react";

/* Application Package */
import { ISongMetadata } from "@/types/dashboard/song.interface";
import { AnalysisWithSong } from "../analysis/analyzedView";
import Navbar from "./navBar";
import Hero from "./hero";
import QuoteSection from "./quoteSection";
import SearchBar from "./searchBar";
import TrendingSection from "./trendingSection";
import SearchResults from "./searchResult";
import AnalyzedView from "../analysis/analyzedView";
import LoadingView from "../analysis/loadingView";
import ErrorView from "../analysis/errorView";

export default function HomeContainer() {
    const [view, setView] = useState<'dashboard' | 'loading' | 'analysis' | 'error'>('dashboard');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisWithSong | null>(null);
    const [errorStatus, setErrorStatus] = useState<number>(200);

    const handleSearch = async (query: string) => {
        if (!query.trim()) return;

        setIsSearching(true);
        setLoading(true);

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_API_URL
            : process.env.NEXT_PUBLIC_API_PROD;

        try {
            const res = await fetch(`${baseUrl}/analysis/search?q=${query}`);

            const response = await res.json();
            console.log("🚀 ~ handleSearch ~ response:", response)

            if (response.statusCode === 200) {
                setResults(response.data.items || []);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error("Lỗi khi tìm kiếm", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    const handleClearSearch = () => {
        setIsSearching(false);
        setResults([]);
    };

    const handleAnalyze = async (song: ISongMetadata) => {
        if (!song) return;
        setView('loading');

        const baseUrl = process.env.NODE_ENV === "development"
            ? process.env.NEXT_PUBLIC_API_URL
            : process.env.NEXT_PUBLIC_API_PROD;

        try {
            const res = await fetch(`${baseUrl}/analysis/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: song.id,
                    album: song.album,
                    title: song.title,
                    artist: song.artist,
                    imageUrl: song.imageUrl,
                    spotifyUrl: song.spotifyUrl,
                }),
            });

            const response = await res.json();

            if (response.statusCode === 200) {
                setAnalysisData(response.data);
                setView('analysis');
            } else {
                setErrorStatus(response.statusCode);
                setView('error');
            }
        } catch (error) {
            setErrorStatus(500);
            setView('error');
        }
    }

    const handleBackToDashboard = () => {
        setView('dashboard');
        setIsSearching(false);
    }

    if (view === 'loading') return <LoadingView />;
    if (view === 'error') return <ErrorView status={errorStatus} onBack={handleBackToDashboard} />;
    if (view === 'analysis' && analysisData) return <AnalyzedView data={analysisData} onBack={handleBackToDashboard} />;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-zinc-800 selection:text-zinc-200">
            {/* 1. Navbar: Luôn cố định ở trên cùng */}
            <Navbar />

            <main className="max-w-6xl mx-auto px-6 pt-18 pb-16 flex flex-col items-center">

                {/* 2. Hero Section: Tiêu đề lớn và lời giới thiệu */}
                <Hero />

                {/* 3. Search Bar: Trung tâm điều khiển */}
                <SearchBar
                    onSearch={handleSearch}
                    onClear={handleClearSearch}
                    isSearching={isSearching}
                />

                {/* 4. Logic hiển thị có điều kiện:
            - Nếu KHÔNG search: Hiện Quotes -> Trending
            - Nếu ĐANG search: Hiện Search Results (Ẩn Quotes và Trending)
        */}
                {!isSearching ? (
                    <div className="w-full space-y-4 animate-fade-in">
                        {/* Quote nằm ngay dưới thanh tìm kiếm như ý bạn */}
                        <QuoteSection />

                        {/* Đường kẻ ngang tinh tế để phân tách phần Trending */}
                        <div className="w-full h-px bg-linear-gradient-to-r from-transparent via-zinc-900 to-transparent my-8" />

                        <TrendingSection onSongClick={handleAnalyze} />
                    </div>
                ) : (
                    <div className="w-full animate-slide-up">
                        <SearchResults
                            songs={results}
                            loading={loading}
                            onSongClick={handleAnalyze}
                        />
                    </div>
                )}

            </main>

            {/* Footer đơn giản cho đúng chất minimalist */}
            <footer className="py-10 text-center border-t border-zinc-950">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em]">
                    Analyrics — 2026 Edition
                </p>
            </footer>
        </div>
    );
}