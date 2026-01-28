'use client';

/* System Package */
import { useState } from "react";
import { Icon } from "@iconify/react";

interface ISearchBarProps {
    onSearch: (query: string) => void;
    onClear: () => void;
    isSearching: boolean;
}

export default function SearchBar({ onSearch, onClear, isSearching }: ISearchBarProps) {
    const [query, setQuery] = useState('');

    return (
        <div className="max-w-2xl mx-auto w-full">
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-full px-5 py-2.5 
                            focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500/20 
                            transition-all duration-300 shadow-2xl">

                <Icon
                    icon="ph:magnifying-glass-bold"
                    className="w-5 h-5 mr-3 text-zinc-500 group-focus-within:text-zinc-300 transition-colors"
                />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && query.trim() && onSearch(query)}
                    placeholder="Tìm kiếm bài hát để phân tích..."
                    className="flex-1 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-600 
                               outline-none ring-0 focus:ring-0 focus:outline-none"
                />

                <button
                    onClick={() => onSearch(query)}
                    disabled={!query.trim() || isSearching}
                    className="bg-zinc-100 text-black px-6 py-2 rounded-full text-sm font-bold 
                               disabled:opacity-30 hover:bg-white transition-all flex items-center shrink-0 ml-2"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {isSearching ? "Đang tìm..." : "Tìm"}
                </button>
            </div>
            {query && (
                <button onClick={() => { setQuery(''); onClear(); }} className="mt-4 text-xs text-zinc-500 w-full hover:text-white transition-colors">
                    Quay lại trang chủ
                </button>
            )}
        </div>
    );
}