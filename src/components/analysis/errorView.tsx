/* System Package */
import { Icon } from "@iconify/react";

export default function ErrorView({ status, onBack }: { status: number, onBack: () => void }) {
    const isServerDown = status === 500;

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
            <div className="text-8xl">
                <Icon icon={isServerDown ? "ph:cloud-slash-bold" : "ph:warning-circle-bold"} className="text-zinc-800 mx-auto" />
            </div>
            <div className="space-y-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                    {isServerDown ? "Hệ thống đang quá tải" : "Có lỗi khi phân tích"}
                </h2>
                <p className="text-zinc-500 max-w-md mx-auto">
                    {isServerDown
                        ? "AI đang bận xử lý quá nhiều bài hát cùng lúc. Vui lòng quay lại sau ít phút nhé!"
                        : "Chúng tôi không thể giải mã bài hát này vào lúc này. Vui lòng thử lại với một bài khác."}
                </p>
            </div>
            <button onClick={onBack} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-all">
                Thử lại bài khác
            </button>
        </div>
    );
}