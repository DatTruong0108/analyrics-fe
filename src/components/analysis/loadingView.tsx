/* System Package */
import { Icon } from "@iconify/react";

/* Application Package */
import FooterCredits from "./footerCredits";

export default function LoadingView() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-between py-10">
            <div />

            <div className="flex flex-col items-center space-y-8 animate-pulse">
                <div className="relative h-24 w-24">
                    <Icon icon="ph:circle-notch-bold" className="text-white w-full h-full animate-spin opacity-20" />
                    <Icon icon="ph:sparkle-fill" className="absolute inset-0 m-auto text-white w-8 h-8 animate-bounce" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold tracking-tight">Đang phân tích lời bài hát...</h2>
                    <p className="text-zinc-500 text-sm">Đang tìm kiếm và giải mã ý nghĩa ✨</p>
                </div>
            </div>

            <FooterCredits />
        </div>
    );
}