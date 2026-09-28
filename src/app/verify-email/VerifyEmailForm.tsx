"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import CustomerShell from "@/components/customer/CustomerShell";
import { Field } from "@/components/customer/ui";
import {
  cardClass,
  eyebrowClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  primaryButtonClass,
} from "@/components/customer/styles";

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
      <CustomerShell>
        <motion.section {...fadeUp(0.05)} className={cardClass}>
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-qzen-brand-soft">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7 text-qzen-brand"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
            </div>

            <p className={`mt-6 ${eyebrowClass}`}>Email verification</p>

            <h1 className={`mt-3 ${headingClass}`}>Email verified!</h1>

            <p className="mt-3 text-[15px] leading-[1.6] text-ink-text-2">
              Your email address has been successfully verified.
            </p>

            <p className="mt-1 text-[15px] leading-[1.6] text-ink-text-2">
              You can now sign in to your Qzen account.
            </p>
          </div>

          <motion.button
            {...fadeUp(0.2)}
            type="button"
            onClick={() => router.push("/login")}
            className={`${primaryButtonClass} mt-8`}
          >
            Continue to sign in
          </motion.button>
        </motion.section>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <motion.section {...fadeUp(0.05)} className={cardClass}>
        <motion.div {...fadeUp(0.12)} className="text-center">
          <p className={eyebrowClass}>Email verification</p>

          <h1 className={`mt-3 ${headingClass}`}>Verify your email</h1>

          <p className="mt-3 text-[15px] leading-6 text-ink-text-2">
            We sent a 6-digit verification code to
          </p>

          <p className="mt-1 break-all text-[15px] font-semibold text-ink-text">
            {email || "your email address"}
          </p>
        </motion.div>

        <motion.form
          {...fadeUp(0.2)}
          onSubmit={handleSubmit}
          className="mt-7 space-y-5"
        >
          <Field id="otp" label="Verification code">
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
              placeholder="000000"
              className={`${inputClass} text-center font-mono text-[24px] font-semibold tracking-[0.42em] [text-indent:0.42em] tabular-nums`}
            />
          </Field>

          {error && (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || !email}
            className={primaryButtonClass}
          >
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </motion.form>

        <motion.p
          {...fadeUp(0.3)}
          className="mt-6 border-t border-line-light pt-5 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-text-3"
        >
          Code expires in 10 minutes
        </motion.p>
      </motion.section>
    </CustomerShell>
  );
}
