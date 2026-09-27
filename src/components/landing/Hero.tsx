"use client";

import Link from "next/link";
import { motion } from "motion/react";
import JoinQueueButton from "@/components/landing/JoinQueueButton";
import ProductTableau from "@/components/landing/ProductTableau";

interface HeroProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero({ isAuthenticated, hasBusiness }: HeroProps) {
  const ownerDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  return (
    <section
      id="join"
      className="relative isolate overflow-hidden bg-ink pt-[72px] text-on-dark"
    >
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 qzl-grid opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 qzl-grain" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-40 top-[-10%] h-[560px] w-[560px] rounded-full bg-qz-accent/10 blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-[6%] h-[420px] w-[420px] rounded-full bg-emerald-700/10 blur-[120px]"
        aria-hidden="true"
      />

      {/* Top hairline of the grid, aligns with the header */}
      <div className="pointer-events-none absolute inset-x-0 top-[72px] h-px bg-line-dark" aria-hidden="true" />

      <div className="qzl-hero-grid relative mx-auto grid w-full max-w-[1320px] items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-28 lg:pt-24">
        {/* ── Copy column ─────────────────────────────────────── */}
        <div className="max-w-[640px]">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="inline-flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-on-dark-2"
          >
            <span className="relative flex h-2 w-2">
              <span className="qzl-rail-pulse absolute inline-flex h-full w-full rounded-full bg-qz-accent" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-qz-accent" />
            </span>
            Queue management for modern businesses
          </motion.p>

          <h1 className="mt-7 text-[clamp(2.75rem,8.5vw,5.5rem)] font-editorial leading-[0.94] tracking-[-0.02em] text-white">
            {["Waiting,", "reimagined."].map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1, delay: 0.18 + i * 0.1, ease }}
                >
                  {i === 1 ? (
                    <>
                      reimagined<span className="text-qz-accent">.</span>
                    </>
                  ) : (
                    line
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease }}
            className="mt-7 max-w-[540px] text-[17px] leading-[1.6] text-on-dark-2 sm:text-lg"
          >
            Qzen is the digital queue platform for{" "}
            <span className="text-white">clinics, salons, banks, retail counters</span>{" "}
            and service centres. Customers join from their phone — your team
            serves from one screen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.62, ease }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href={ownerDestination}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-qz-accent px-6 text-sm font-semibold text-qz-accent-ink shadow-[0_16px_40px_-14px_rgba(16,185,129,0.9)] transition hover:bg-qz-accent-strong"
            >
              Start free
              <span aria-hidden="true">→</span>
            </Link>

            <JoinQueueButton variant="dark" className="h-12 px-6" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.78 }}
            className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-on-dark-3"
          >
            No app download for customers · Live in minutes
          </motion.p>

          {/* Hero queue rail — abstract, non-numeric motif */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.95 }}
            className="relative mt-12 hidden h-8 items-center lg:flex"
            aria-hidden="true"
          >
            <div className="relative h-px w-full bg-line-dark-strong">
              {/* settled tokens */}
              {[6, 17, 28, 39].map((left) => (
                <span
                  key={left}
                  style={{ left: `${left}%` }}
                  className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/25"
                />
              ))}
              <span
                style={{ left: "50%" }}
                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-qz-accent shadow-[0_0_12px_rgba(16,185,129,0.9)]"
              />
              {/* runner */}
              <span className="qzl-rail-runner absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
            </div>
            <span className="absolute -top-6 left-0 font-mono text-[9px] uppercase tracking-[0.2em] text-on-dark-3">
              Queue rail
            </span>
          </motion.div>
        </div>

        {/* ── Visual column ───────────────────────────────────── */}
        <div className="relative lg:pl-4">
          <ProductTableau />
        </div>
      </div>

      {/* Bottom hairline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-line-dark" aria-hidden="true" />
    </section>
  );
}
