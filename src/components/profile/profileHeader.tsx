/* Application Package */
import { IAuthUser } from "@/types/auth/auth.interface";
import EditableName from "./editableName";

interface ProfileHeaderProps {
    user: IAuthUser;
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
    const initial = user.name.trim().charAt(0).toUpperCase() || "?";

    return (
        <section aria-label="Thông tin hồ sơ" className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div
                aria-hidden="true"
                className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl md:text-4xl font-black text-zinc-300"
            >
                {initial}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
                <p className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.3em] font-medium">
                    Hồ sơ của bạn
                </p>
                <EditableName name={user.name} />
            </div>
        </section>
    );
}
