"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    const result = loginSchema.shape.email.safeParse(email);

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email: result.data,
      redirectTo: "/reset-password",
    });

    if (error) {
      setError(
        error.message || "Unable to send the password reset link."
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Enter your email and we'll send you a link to reset your
              password.
            </p>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-sm font-semibold text-emerald-800">
                Check your email
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-700">
                If an account exists with that email, we've sent a password
                reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                />
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
                {loading ? "Sending reset link..." : "Send reset link"}
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