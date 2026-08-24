'use client';

/* System Package */
import { motion } from "framer-motion";

/* Application Package */
import { EASE_OUT } from "@/lib/motion";

export default function Navbar() {
    const user = { name: "Khách" };

    return (
        <motion.nav
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
            className="fixed top-0 w-full z-50 flex justify-end items-center px-6 py-2 bg-black/40 backdrop-blur-xl"
        >
            {user ? (
                <div className="text-sm font-medium">
                    Xin chào, <span className="text-zinc-400 font-bold">{user.name}</span>!
                </div>
            ) : (
                <div className="space-x-8 text-xs font-black uppercase tracking-[0.2em]">
                    <button className="hover:text-zinc-400">Đăng ký</button>
                    <button className="hover:text-zinc-400">Đăng nhập</button>
                </div>
            )}
        </motion.nav>
    );
}
