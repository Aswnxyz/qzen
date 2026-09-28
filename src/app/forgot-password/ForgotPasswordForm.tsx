"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { loginSchema } from "@/lib/validations/auth";
import CustomerShell from "@/components/customer/CustomerShell";
import { Field } from "@/components/customer/ui";
import {
  cardClass,
  EASE,
  eyebrowClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  linkClass,
  primaryButtonClass,
} from "@/components/customer/styles";

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
    <CustomerShell>
      <motion.section {...fadeUp(0.05)} className={cardClass}>
        <motion.div {...fadeUp(0.12)} className="text-center">
          <p className={eyebrowClass}>Password recovery</p>

          <h1 className={`mt-3 ${headingClass}`}>Forgot your password?</h1>

          <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </motion.div>

        <motion.div
          key={success ? "sent" : "form"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mt-7"
        >
          {success ? (
            <div className="rounded-2xl border border-qzen-brand/25 bg-qzen-brand-soft px-5 py-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/80">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-qzen-brand"
                  aria-hidden="true"
                >
                  <path d="M4 12.5 9 17.5 20 6.5" />
                </svg>
              </div>

              <p className="mt-3 text-[15px] font-semibold text-qzen-brand-strong">
                Check your email
              </p>

              <p className="mt-1.5 text-[13.5px] leading-[1.6] text-qzen-brand">
                If an account exists with that email, we&apos;ve sent a
                password reset link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {error && (
                <p role="alert" className={errorClass}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={primaryButtonClass}
              >
                {loading ? "Sending reset link..." : "Send reset link"}
              </button>
            </form>
          )}
        </motion.div>

        <motion.div
          {...fadeUp(0.3)}
          className="mt-7 border-t border-line-light pt-6 text-center"
        >
          <button
            type="button"
            onClick={() => router.push("/login")}
            className={`inline-flex min-h-6 items-center px-2 py-1 text-[14px] ${linkClass}`}
          >
            &larr; Back to login
          </button>
        </motion.div>
      </motion.section>
    </CustomerShell>
  );
}
