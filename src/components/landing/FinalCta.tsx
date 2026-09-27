"use client";

import Link from "next/link";
import { motion } from "motion/react";
import JoinQueueButton from "@/components/landing/JoinQueueButton";
import Reveal from "@/components/landing/Reveal";

interface FinalCtaProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

/**
 * Act V — conversion. The queue rail from the hero returns and settles.
 */
export default function FinalCta({
  isAuthenticated,
  hasBusiness,
}: FinalCtaProps) {
  const ownerDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  return (
    <div className="relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-24">
      {/* Ambient light from top center */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] max-w-[90%] -translate-x-1/2 rounded-full bg-qz-accent/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[820px] text-center">
        <Reveal>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-signal">
            06 / Start
          </span>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 text-[clamp(2.4rem,6.5vw,4.5rem)] font-editorial leading-[1.0] tracking-[-0.02em] text-white">
            Start your first queue
            <span className="text-qz-accent">.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-[1.65] text-on-dark-2">
            Create a workspace, name the queue, share the link. You can be
            taking customers today — and your customers never install a thing.
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ownerDestination}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-qz-accent px-7 text-sm font-semibold text-qz-accent-ink shadow-[0_16px_40px_-14px_rgba(16,185,129,0.9)] transition hover:bg-qz-accent-strong"
            >
              {isAuthenticated ? "Open your dashboard" : "Start free"}
              <span aria-hidden="true">→</span>
            </Link>

            <JoinQueueButton variant="dark" className="h-12 px-6" />
          </div>
        </Reveal>

        <Reveal delay={0.24}>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-on-dark-3">
            No app · No downloads · Cancel anytime
          </p>
        </Reveal>
      </div>

      {/* Queue rail — returns from the hero and settles */}
      <div
        className="relative mx-auto mt-16 hidden h-8 max-w-[900px] items-center sm:flex"
        aria-hidden="true"
      >
        <div className="relative h-px w-full bg-line-dark-strong">
          {[10, 24, 38, 52, 66, 80].map((left) => (
            <motion.span
              key={left}
              initial={{ opacity: 0.2, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.5, delay: left / 500 }}
              style={{ left: `${left}%` }}
              className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-qz-accent"
            />
          ))}
          <motion.span
            initial={{ left: "0%" }}
            whileInView={{ left: "93%" }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-signal shadow-[0_0_14px_rgba(245,158,11,0.9)]"
          />
        </div>
        <span className="absolute -top-6 right-0 font-mono text-[9px] uppercase tracking-[0.2em] text-on-dark-3">
          Queue settled
        </span>
      </div>
    </div>
  );
}
