/* Application Package */
import { ApiError } from "@/lib/api";
import { refreshSession } from "@/lib/auth-api";

const UNAUTHORIZED_STATUS = 401;

/*
 * Every per-user endpoint (profile, history, favourites) answers 401 to a
 * caller whose access token has lapsed while the refresh cookie is still good —
 * the most common real session there is. Rotate once and replay instead of
 * showing "please sign in" to someone who is signed in. A second 401 is genuine
 * and propagates.
 *
 * Only wrap requests that are safe to replay: GETs, and idempotent writes such
 * as a rename, a history delete, or adding/removing a favourite.
 */
export async function withSessionRetry<T>(run: () => Promise<T>): Promise<T> {
    try {
        return await run();
    } catch (error) {
        if (!(error instanceof ApiError) || error.statusCode !== UNAUTHORIZED_STATUS) {
            throw error;
        }

        const refreshed = await refreshSession().catch(() => null);
        if (!refreshed?.user) throw error;

        return run();
    }
}
