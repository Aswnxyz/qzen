"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import CustomerShell from "@/components/customer/CustomerShell";
import { Field, PasswordField } from "@/components/customer/ui";
import {
  cardClass,
  eyebrowClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  linkClass,
  primaryButtonClass,
  quietButtonClass,
} from "@/components/customer/styles";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setVerificationRequired(false);
    setLoading(true);

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setError("Your email address is not verified yet.");
        setVerificationRequired(true);
      } else {
        setError(error.message || "Invalid email or password.");
      }

      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  async function handleResendVerification() {
    setError("");
    setVerificationLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });

    if (error) {
      setError(error.message || "Unable to send verification code.");
      setVerificationLoading(false);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    });

    if (error) {
      setError(error.message || "Unable to sign in with Google.");
      setGoogleLoading(false);
    }
  }

  const isLoading = loading || googleLoading || verificationLoading;

  return (
    <CustomerShell>
      <motion.section {...fadeUp(0.05)} className={cardClass}>
        <motion.div {...fadeUp(0.12)} className="text-center">
          <p className={eyebrowClass}>Business account</p>

          <h1 className={`mt-3 ${headingClass}`}>Welcome back</h1>

          <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
            Sign in to manage your queue.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.2)}>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`${quietButtonClass} mt-8 h-12`}
          >
            {googleLoading ? (
              "Connecting to Google..."
            ) : (
              <>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
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
            <div className="h-px flex-1 bg-line-light" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-text-3">
              or
            </span>
            <div className="h-px flex-1 bg-line-light" />
          </div>
        </motion.div>

        <motion.form
          {...fadeUp(0.28)}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <Field id="email" label="Email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@company.com"
              className={inputClass}
            />
          </Field>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Enter your password"
            hint={
              <a href="/forgot-password" className={linkClass}>
                Forgot password?
              </a>
            }
          />

          {error && (
            <div role="alert" className={errorClass}>
              <p>{error}</p>

              {verificationRequired && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="mt-3 font-semibold underline underline-offset-2 transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verificationLoading
                    ? "Sending verification code..."
                    : "Send verification code again"}
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={primaryButtonClass}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </motion.form>

        <motion.p
          {...fadeUp(0.36)}
          className="mt-7 border-t border-line-light pt-6 text-center text-[14px] text-ink-text-2"
        >
          Don&apos;t have an account?{" "}
          <a href="/signup" className={linkClass}>
            Create one
          </a>
        </motion.p>
      </motion.section>
    </CustomerShell>
  );
}
