'use client';

/* System Package */
import Link from "next/link";
import { Icon } from "@iconify/react";

interface SongErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/* The analysis could not be loaded (API down or erroring) — distinct from "never analysed". */
export default function SongError({ reset }: SongErrorProps) {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center gap-8">
            <Icon icon="ph:cloud-slash-bold" aria-hidden="true" className="w-20 h-20 text-zinc-800" />
            <div className="space-y-3">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Không thể tải bản phân tích</h1>
                <p className="text-zinc-500 max-w-md mx-auto">Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform cursor-pointer"
                >
                    <Icon icon="ph:arrow-clockwise-bold" aria-hidden="true" className="w-4 h-4" />
                    Thử lại
                </button>
                <Link
                    href="/"
                    className="px-8 py-3 rounded-full border border-zinc-800 font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                    Về trang chủ
                </Link>
            </div>
        </main>
    );
}
