/* Application Package */
import { ApiError } from "@/lib/api";

/**
 * Extracts a display-ready error message in Vietnamese from any error thrown
 * during authentication.
 *
 * Handles NestJS validation pipe errors (where `message` is a string array)
 * and normal `ApiError` responses, ensuring no raw `[object Object]` reaches
 * the user.
 */
export function formatAuthError(error: unknown): string {
    if (!error) {
        return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
    }

    if (error instanceof ApiError) {
        return error.message;
    }

    if (typeof error === "object") {
        const errObj = error as { message?: unknown; data?: { message?: unknown } };
        const msg = errObj.message ?? errObj.data?.message;

        if (Array.isArray(msg)) {
            return msg.filter(Boolean).join(". ");
        }

        if (typeof msg === "string" && msg.trim()) {
            return msg;
        }
    }

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    return "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
}
