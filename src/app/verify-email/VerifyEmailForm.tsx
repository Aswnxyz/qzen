"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    if (error) {
      setError(
        error.message ||
          "The verification code is incorrect or has expired."
      );
      setLoading(false);
      return;
    }

    setVerified(true);
    setLoading(false);
  }

  if (verified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
        <section className="w-full max-w-md">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Qzen
            </p>

            <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="h-8 w-8 text-emerald-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 12 4 4L19 6"
                />
              </svg>
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
              Email verified!
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Your email address has been successfully verified.
            </p>

            <p className="mt-1 text-sm leading-6 text-zinc-600">
              You can now sign in to your Qzen account.
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-8 w-full rounded-full bg-emerald-800 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Continue to sign in
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
              Verify your email
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              We sent a 6-digit verification code to
            </p>

            <p className="mt-1 break-all text-sm font-semibold text-zinc-900">
              {email || "your email address"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="otp"
                className="text-sm font-medium text-zinc-700"
              >
                Verification code
              </label>

              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6 || !email}
              className="w-full rounded-full bg-emerald-800 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
            Your verification code expires in 10 minutes.
          </p>
        </div>
      </section>
    </main>
  );
}