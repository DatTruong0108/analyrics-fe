/*
 * The user as the API serialises it — not as Prisma stores it.
 *
 * `created_at` keeps the backend's snake_case name and arrives as an ISO string:
 * `UserData.created_at` is a `Date` on the server, but JSON has no date type, so
 * anything that wants a `Date` here must parse it explicitly.
 */
export interface IAuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

/*
 * What the app knows about the current session.
 *
 * `user` is nullable because `/auth/me` answers 200 with `user: null` for a
 * guest instead of 401 — bootstrapping therefore does not have to treat "not
 * signed in" as an error.
 *
 * `accessTokenExpiresAt` is an epoch milliseconds number (or ISO string) and
 * may be absent: it is what the silent-refresh timer schedules against, and a
 * session restored without it simply gets no timer rather than a bogus one.
 */
export interface IAuthSession {
    user: IAuthUser | null;
    accessTokenExpiresAt: number | string | null;
}

/* Mirrors the backend `LoginDto`. */
export interface ILoginPayload {
    email: string;
    password: string;
}

/*
 * Mirrors the backend `RegisterDto`, which extends `LoginDto`. `phone` is the
 * one optional field; every other declared field is required there too.
 */
export interface IRegisterPayload extends ILoginPayload {
    name: string;
    phone?: string;
}
