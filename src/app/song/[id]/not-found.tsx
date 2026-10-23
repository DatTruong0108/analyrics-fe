/* System Package */
import Link from "next/link";
import { Icon } from "@iconify/react";

/*
 * A song with no cached analysis. The page never generates one itself — that
 * would let any crawler or stray link spend Gemini quota — so the way forward
 * is to search for it from the home page.
 */
export default function SongNotFound() {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center gap-8">
            <Icon icon="ph:music-notes-simple-bold" aria-hidden="true" className="w-20 h-20 text-zinc-800" />
            <div className="space-y-3">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Chưa có bản phân tích</h1>
                <p className="text-zinc-500 max-w-md mx-auto">
                    Bài hát này chưa được phân tích, hoặc đường dẫn không đúng. Hãy tìm bài hát ở trang chủ để AI giải mã nhé.
                </p>
            </div>
            <Link
                href="/"
                className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
            >
                Về trang chủ
            </Link>
        </main>
    );
}
