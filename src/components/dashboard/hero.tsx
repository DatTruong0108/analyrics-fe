export default function Hero() {
    return (
        <section className="w-full flex flex-col items-center text-center space-y-8 animate-fade-in">
            <div className="relative w-full">
                <span className="inline-block px-4 py-1.5 text-[10px] md:text-xs border border-zinc-800 rounded-full text-zinc-400 uppercase tracking-[0.3em] font-medium bg-zinc-950/50 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    Vượt qua giới hạn của đôi tai
                </span>

                <h1 className="text-5xl min-[430px]:text-6xl md:text-9xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                    Ana<span className="text-zinc-700">lyrics</span>
                </h1>
            </div>

            <div className="max-w-2xl space-y-4">
                <p className="text-sm md:text-base text-zinc-500 leading-relaxed font-light px-4">
                    Phía sau mỗi giai điệu là một vũ trụ ngôn từ chưa được khai phá. Hệ thống sử dụng trí tuệ nhân tạo để giúp bạn chạm vào lớp nghĩa sâu nhất, những ẩn dụ tầng tầng lớp lớp mà nghệ sĩ đã gửi gắm.
                </p>
            </div>

            <div className="w-px h-12 bg-linear-gradient-to-b from-zinc-800 to-transparent"></div>
        </section>
    );
}