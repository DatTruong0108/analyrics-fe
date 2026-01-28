export default function FooterCredits() {
    return (
        <footer className="w-full flex flex-col items-center space-y-4 py-10">
            <div className="flex flex-col items-center text-[10px] uppercase tracking-[0.4em] font-medium space-y-2">
                <p className="text-zinc-600 cursor-default">
                    Built with using Gemini 2.5 Flash
                </p>

                <div className="flex gap-4 items-center">
                    <a
                        href="https://facebook.com/tora0108"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white underline decoration-zinc-800 hover:decoration-white underline-offset-4 transition-all duration-300"
                    >
                        Connect with Owner (Dat Truong)
                    </a>

                    <span className="text-zinc-800 select-none">•</span>

                    <a
                        href="https://facebook.com/iamquocvu"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-white underline decoration-zinc-800 hover:decoration-white underline-offset-4 transition-all duration-300"
                    >
                        Inspired by Vu Nguyen
                    </a>
                </div>
            </div>
        </footer>
    );
}