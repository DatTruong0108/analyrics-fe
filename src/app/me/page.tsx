/* System Package */
import type { Metadata } from "next";

/* Application Package */
import ProfileContainer from "@/components/profile/profileContainer";

export const metadata: Metadata = {
    title: "Hồ sơ của bạn - Analyrics",
    description: "Thông tin tài khoản và lịch sử phân tích lời bài hát của bạn",
};

export default function Page() {
    return <ProfileContainer />;
}
