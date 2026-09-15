"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message || "Failed to create account.");
      setLoading(false);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    });

    if (error) {
      setError(error.message || "Unable to sign up with Google.");
      setGoogleLoading(false);
    }
  }

  const isLoading = loading || googleLoading;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <section className="w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Qzen
            </p>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
              Create your account
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Start managing your queue with Qzen.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleLoading ? (
              "Connecting to Google..."
            ) : (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.95h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.25Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85V7.62H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.38l3.24-2.53Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.15 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.62l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              or
            </span>

            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-zinc-700"
              >
                Your name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="name"
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Create a password"
                className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
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
              disabled={isLoading}
              className="w-full rounded-full bg-emerald-800 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Sign in
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
