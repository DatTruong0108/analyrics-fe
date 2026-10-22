'use client';

/* System Package */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

/* Application Package */
import {
    fetchSession,
    login,
    logout,
    refreshSession,
    register,
} from "@/lib/auth-api";
import {
    IAuthUser,
    ILoginPayload,
    IRegisterPayload,
} from "@/types/auth/auth.interface";

export type AuthStatus = "loading" | "authenticated" | "guest";

export interface IAuthContext {
    user: IAuthUser | null;
    status: AuthStatus;
    signIn: (payload: ILoginPayload) => Promise<void>;
    signUp: (payload: IRegisterPayload) => Promise<void>;
    signOut: () => Promise<void>;
    /* Replaces the cached user after a profile edit, so the navbar updates without a refetch. */
    updateUser: (nextUser: IAuthUser) => void;
}

export interface IAuthProviderProps {
    children: React.ReactNode;
}

const REFRESH_BUFFER_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 30 * 1000;
const MAX_TIMER_DELAY_MS = 24 * 60 * 60 * 1000;

function parseExpiresAt(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return value;
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && asNum > 0) return asNum;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
}

const AuthContext = createContext<IAuthContext | null>(null);

export function AuthProvider({ children }: IAuthProviderProps) {
    const [user, setUser] = useState<IAuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const expiresAtRef = useRef<number | null>(null);
    const statusRef = useRef<AuthStatus>("loading");

    const updateStatus = useCallback((nextStatus: AuthStatus, nextUser: IAuthUser | null) => {
        statusRef.current = nextStatus;
        setStatus(nextStatus);
        setUser(nextUser);
    }, []);

    const clearTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const scheduleRefresh = useCallback(
        (rawExpiresAt: number | string | null | undefined) => {
            clearTimer();
            const expiresAtMs = parseExpiresAt(rawExpiresAt);
            expiresAtRef.current = expiresAtMs;
            if (!expiresAtMs) return;

            const armTimer = () => {
                const targetMs = expiresAtMs - REFRESH_BUFFER_MS;
                const now = Date.now();
                const rawDelay = targetMs - now;

                if (rawDelay > MAX_TIMER_DELAY_MS) {
                    timeoutRef.current = setTimeout(() => {
                        armTimer();
                    }, MAX_TIMER_DELAY_MS);
                    return;
                }

                const finalDelay = Math.max(rawDelay, MIN_REFRESH_DELAY_MS);

                timeoutRef.current = setTimeout(async () => {
                    const currentTarget = (expiresAtRef.current ?? 0) - REFRESH_BUFFER_MS;
                    if (Date.now() < currentTarget - 5_000) {
                        armTimer();
                        return;
                    }

                    try {
                        const refreshed = await refreshSession();
                        if (refreshed.user) {
                            updateStatus("authenticated", refreshed.user);
                            scheduleRefresh(refreshed.accessTokenExpiresAt);
                        } else {
                            clearTimer();
                            expiresAtRef.current = null;
                            updateStatus("guest", null);
                        }
                    } catch {
                        clearTimer();
                        expiresAtRef.current = null;
                        updateStatus("guest", null);
                    }
                }, finalDelay);
            };

            armTimer();
        },
        [clearTimer, updateStatus],
    );

    // Bootstrap session on mount
    useEffect(() => {
        let isCancelled = false;

        async function bootstrap() {
            try {
                const session = await fetchSession();
                if (isCancelled) return;

                if (session.user) {
                    updateStatus("authenticated", session.user);
                    scheduleRefresh(session.accessTokenExpiresAt);
                    return;
                }

                // Guest or access token expired: attempt silent refresh with refresh_token cookie
                const refreshed = await refreshSession();
                if (isCancelled) return;

                if (refreshed.user) {
                    updateStatus("authenticated", refreshed.user);
                    scheduleRefresh(refreshed.accessTokenExpiresAt);
                } else {
                    updateStatus("guest", null);
                }
            } catch {
                if (isCancelled) return;
                updateStatus("guest", null);
            }
        }

        void bootstrap();

        return () => {
            isCancelled = true;
            clearTimer();
        };
    }, [clearTimer, scheduleRefresh, updateStatus]);

    // Handle tab focus / wake from sleep
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState !== "visible") return;
            if (statusRef.current !== "authenticated") return;

            const expiresAtMs = expiresAtRef.current;
            if (!expiresAtMs) return;

            const targetMs = expiresAtMs - REFRESH_BUFFER_MS;
            if (Date.now() >= targetMs) {
                clearTimer();
                try {
                    const refreshed = await refreshSession();
                    if (refreshed.user) {
                        updateStatus("authenticated", refreshed.user);
                        scheduleRefresh(refreshed.accessTokenExpiresAt);
                    } else {
                        clearTimer();
                        expiresAtRef.current = null;
                        updateStatus("guest", null);
                    }
                } catch {
                    clearTimer();
                    expiresAtRef.current = null;
                    updateStatus("guest", null);
                }
            } else {
                scheduleRefresh(expiresAtMs);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [clearTimer, scheduleRefresh, updateStatus]);

    const signIn = useCallback(
        async (payload: ILoginPayload): Promise<void> => {
            const session = await login(payload);
            if (session.user) {
                updateStatus("authenticated", session.user);
                scheduleRefresh(session.accessTokenExpiresAt);
            } else {
                updateStatus("guest", null);
            }
        },
        [scheduleRefresh, updateStatus],
    );

    const signUp = useCallback(
        async (payload: IRegisterPayload): Promise<void> => {
            const session = await register(payload);
            if (session.user) {
                updateStatus("authenticated", session.user);
                scheduleRefresh(session.accessTokenExpiresAt);
            } else {
                updateStatus("guest", null);
            }
        },
        [scheduleRefresh, updateStatus],
    );

    const signOut = useCallback(async (): Promise<void> => {
        try {
            await logout();
        } finally {
            clearTimer();
            expiresAtRef.current = null;
            updateStatus("guest", null);
        }
    }, [clearTimer, updateStatus]);

    const updateUser = useCallback((nextUser: IAuthUser): void => {
        /*
         * A rename that resolves after the user signed out must not quietly
         * sign them back in on screen.
         */
        if (statusRef.current !== "authenticated") return;
        setUser(nextUser);
    }, []);

    const value = useMemo<IAuthContext>(
        () => ({
            user,
            status,
            signIn,
            signUp,
            signOut,
            updateUser,
        }),
        [user, status, signIn, signUp, signOut, updateUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): IAuthContext {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthProvider;
