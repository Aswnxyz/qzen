"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or less."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmPasswordTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const passwordTimeout = passwordTimeoutRef.current;
    const confirmPasswordTimeout = confirmPasswordTimeoutRef.current;

    return () => {
      if (passwordTimeout) {
        clearTimeout(passwordTimeout);
      }

      if (confirmPasswordTimeout) {
        clearTimeout(confirmPasswordTimeout);
      }
    };
  }, []);

  function temporarilyShowPassword(
    setVisible: (visible: boolean) => void,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setVisible(true);

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = null;
    }, 2000);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("This password reset link is invalid or has expired.");
      return;
    }

    const result = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: result.data.password,
      token,
    });

    if (error) {
      setError(
        error.message || "This password reset link is invalid or has expired.",
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
        <section className="w-full max-w-md">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Qzen
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
              Password reset successful
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Your password has been changed successfully. You can now sign in
              with your new password.
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-8 w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Go to login
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Qzen
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
              Create a new password
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Choose a new password for your Qzen account.
            </p>
          </div>

          {urlError && (
            <div
              role="alert"
              className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              This password reset link is invalid or has expired. Please request
              a new one.
            </div>
          )}

          {!token ? (
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="mt-6 w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Request a new reset link
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-zinc-700"
                >
                  New password
                </label>

                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Create a new password"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 pr-12 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    aria-label="Show password temporarily"
                    onClick={() =>
                      temporarilyShowPassword(
                        setShowPassword,
                        passwordTimeoutRef,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                  >
                    {showPassword ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8-0.5 1.3-1.2 2.4-2 3.4" />
                        <path d="M6.2 6.2C4.6 7.4 3.5 9 2 12c1.5 4 5 8 10 8 1.5 0 2.9-.4 4.1-1" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-zinc-700"
                >
                  Confirm password
                </label>

                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    className="w-full rounded-xl border border-zinc-300 px-4 py-3 pr-12 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                  />

                  <button
                    type="button"
                    aria-label="Show password temporarily"
                    onClick={() =>
                      temporarilyShowPassword(
                        setShowConfirmPassword,
                        confirmPasswordTimeoutRef,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus:ring-emerald-600"
                  >
                    {showConfirmPassword ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8-0.5 1.3-1.2 2.4-2 3.4" />
                        <path d="M6.2 6.2C4.6 7.4 3.5 9 2 12c1.5 4 5 8 10 8 1.5 0 2.9-.4 4.1-1" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Resetting password..." : "Reset password"}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              ← Back to login
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
