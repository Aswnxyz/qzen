"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";
import CustomerShell from "@/components/customer/CustomerShell";
import { PasswordField } from "@/components/customer/ui";
import {
  cardClass,
  eyebrowClass,
  errorClass,
  fadeUp,
  headingClass,
  linkClass,
  primaryButtonClass,
} from "@/components/customer/styles";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      <CustomerShell>
        <motion.section {...fadeUp(0.05)} className={cardClass}>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-qzen-brand-soft">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-qzen-brand"
                aria-hidden="true"
              >
                <path d="M4 12.5 9 17.5 20 6.5" />
              </svg>
            </div>

            <p className={`mt-6 ${eyebrowClass}`}>Password recovery</p>

            <h1 className={`mt-3 ${headingClass}`}>
              Password reset successful
            </h1>

            <p className="mt-3 text-[15px] leading-[1.6] text-ink-text-2">
              Your password has been changed successfully. You can now sign in
              with your new password.
            </p>
          </div>

          <motion.button
            {...fadeUp(0.2)}
            type="button"
            onClick={() => router.push("/login")}
            className={`${primaryButtonClass} mt-8`}
          >
            Go to login
          </motion.button>
        </motion.section>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <motion.section {...fadeUp(0.05)} className={cardClass}>
        <motion.div {...fadeUp(0.12)} className="text-center">
          <p className={eyebrowClass}>Password recovery</p>

          <h1 className={`mt-3 ${headingClass}`}>
            {token ? "Create a new password" : "Get a new reset link"}
          </h1>

          <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
            {token
              ? "Choose a new password for your Qzen account."
              : "This page needs a valid reset link. Request a new one and we'll email it to you."}
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.2)} className="mt-7 space-y-4">
          {urlError && (
            <div role="alert" className={errorClass}>
              This password reset link is invalid or has expired. Please
              request a new one.
            </div>
          )}

          {!token ? (
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className={primaryButtonClass}
            >
              Request a new reset link
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <PasswordField
                id="password"
                label="New password"
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Create a new password"
                revealDuration={2000}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Confirm your new password"
                revealDuration={2000}
              />

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
                {loading ? "Resetting password..." : "Reset password"}
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
