'use client';

/* System Package */
import { useState } from "react";
import { Icon } from "@iconify/react";

/* Application Package */
import { useAuth } from "@/components/auth/authProvider";
import { formatAuthError } from "@/lib/auth-error";

export interface ILoginFormProps {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
}

interface IFormErrors {
    email?: string;
    password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm({ onSuccess, onSwitchToRegister }: ILoginFormProps) {
    const { signIn } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [fieldErrors, setFieldErrors] = useState<IFormErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = (): boolean => {
        const errors: IFormErrors = {};

        if (!email.trim()) {
            errors.email = "Email không được để trống";
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errors.email = "Email không đúng định dạng";
        }

        if (!password) {
            errors.password = "Mật khẩu không được để trống";
        } else if (password.length < 6) {
            errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await signIn({
                email: email.trim(),
                password,
            });
            onSuccess?.();
        } catch (err) {
            setFormError(formatAuthError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            id="auth-panel-login"
            role="tabpanel"
            aria-labelledby="auth-tab-login"
        >
            {formError && (
                <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
                >
                    <Icon icon="ph:warning-circle-bold" className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                    <span className="leading-snug">{formError}</span>
                </div>
            )}

            <div className="space-y-1.5">
                <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                    Email
                </label>
                <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                    disabled={isSubmitting}
                    className={`w-full bg-zinc-950/70 border rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 ${
                        fieldErrors.email
                            ? "border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                            : "border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20"
                    }`}
                />
                {fieldErrors.email && (
                    <p id="login-email-error" className="text-xs text-red-400 flex items-center gap-1.5 pt-0.5">
                        <Icon icon="ph:warning-circle-fill" className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.email}</span>
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                >
                    Mật khẩu
                </label>
                <div className="relative">
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        placeholder="Tối thiểu 6 ký tự"
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                        disabled={isSubmitting}
                        className={`w-full bg-zinc-950/70 border rounded-xl px-4 py-2.5 pr-11 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-200 ${
                            fieldErrors.password
                                ? "border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
                                : "border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20"
                        }`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                    >
                        <Icon icon={showPassword ? "ph:eye-slash-bold" : "ph:eye-bold"} className="w-4 h-4" />
                    </button>
                </div>
                {fieldErrors.password && (
                    <p id="login-password-error" className="text-xs text-red-400 flex items-center gap-1.5 pt-0.5">
                        <Icon icon="ph:warning-circle-fill" className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.password}</span>
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-zinc-100 text-black hover:bg-white active:scale-[0.99] font-bold text-sm py-2.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 flex items-center justify-center shadow-lg mt-2 cursor-pointer"
            >
                {isSubmitting ? (
                    <>
                        <Icon icon="ph:circle-notch-bold" className="w-4 h-4 mr-2 animate-spin" />
                        <span>Đang đăng nhập...</span>
                    </>
                ) : (
                    "Đăng nhập"
                )}
            </button>

            {onSwitchToRegister && (
                <div className="text-center pt-2 text-xs text-zinc-500">
                    Chưa có tài khoản?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-zinc-200 hover:text-white font-semibold underline underline-offset-4 transition-colors cursor-pointer"
                    >
                        Đăng ký ngay
                    </button>
                </div>
            )}
        </form>
    );
}
