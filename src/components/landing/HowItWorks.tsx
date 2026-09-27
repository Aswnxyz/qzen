"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { steps } from "@/lib/landing";
import Reveal from "@/components/landing/Reveal";
import ChapterMarker from "@/components/landing/ChapterMarker";

/** Micro-vignette rendered inside each step. Decorative, illustrative. */
function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    // Scan — QR with a sweeping line
    return (
      <div className="relative flex h-[128px] items-center justify-center overflow-hidden rounded-xl border border-line-light bg-paper-3">
        <svg viewBox="0 0 56 56" className="h-20 w-20 text-ink-text">
          <g fill="currentColor">
            <path d="M2 2h16v16H2V2Zm4 4v8h8V6H6Z" />
            <path d="M38 2h16v16H38V2Zm4 4v8h8V6h-8Z" />
            <path d="M2 38h16v16H2V38Zm4 4v8h8v-8H6Z" />
          </g>
          <g fill="#10b981">
            <rect x="24" y="4" width="5" height="5" />
            <rect x="24" y="14" width="5" height="5" />
            <rect x="2" y="24" width="5" height="5" />
            <rect x="13" y="24" width="5" height="5" />
            <rect x="24" y="24" width="5" height="5" />
            <rect x="35" y="24" width="5" height="5" />
            <rect x="46" y="24" width="5" height="5" />
            <rect x="24" y="35" width="5" height="5" />
            <rect x="35" y="35" width="5" height="5" />
            <rect x="46" y="46" width="5" height="5" />
            <rect x="24" y="46" width="5" height="5" />
          </g>
        </svg>

        <motion.span
          className="absolute inset-x-6 h-px bg-qz-accent shadow-[0_0_10px_rgba(16,185,129,0.9)]"
          initial={{ top: "20%" }}
          whileInView={{ top: ["20%", "80%", "20%"] }}
          viewport={{ once: false, amount: 0.6 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        />
      </div>
    );
  }

  if (index === 1) {
    // Join — token card sliding into a list
    return (
      <div className="flex h-[128px] flex-col justify-center gap-2 overflow-hidden rounded-xl border border-line-light bg-paper-3 px-4">
        {["A-23", "A-24", "A-25"].map((token, i) => (
          <motion.div
            key={token}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.15 * i, ease: [0.16, 1, 0.3, 1] }}
            className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-[12px] ${
              i === 1
                ? "bg-qzen-brand-soft text-qzen-brand ring-1 ring-inset ring-qzen-brand/20"
                : "bg-paper text-ink-text-2"
            }`}
          >
            <span className="font-medium tabular-nums">{token}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-text-3">
              {i === 1 ? "You" : "Waiting"}
            </span>
          </motion.div>
        ))}
      </div>
    );
  }

  // Serve — call next button pulse + row advancing
  return (
    <div className="flex h-[128px] flex-col justify-center gap-2 overflow-hidden rounded-xl border border-line-light bg-paper-3 px-4">
      <div className="flex items-center justify-between rounded-lg bg-qzen-brand px-3 py-2 text-[12px] font-semibold text-white">
        Call next
        <span className="font-mono text-[10px]">→</span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-line-light px-3 py-1.5 text-[12px] text-ink-text-2">
        <span>Served today</span>
        <span className="font-mono tabular-nums text-qzen-brand">38</span>
      </div>
      <div className="flex items-end gap-1">
        {[30, 55, 40, 70, 48, 84, 62].map((h, i) => (
          <motion.span
            key={i}
            initial={{ height: 2 }}
            whileInView={{ height: h * 0.34 }}
            viewport={{ once: false, amount: 0.6 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full rounded-[2px] ${i === 5 ? "bg-qz-accent" : "bg-line-light-strong"}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Act II — how Qzen works.
 * A single drawn rail with three stops instead of four equal cards.
 */
export default function HowItWorks() {
  const railRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 75%", "end 55%"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-16">
      {/* Heading */}
      <div className="max-w-[720px]">
        <Reveal>
          <ChapterMarker number="02" label="How it works" />
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 text-[clamp(2.1rem,5.2vw,3.6rem)] font-editorial leading-[1.02] tracking-[-0.02em] text-ink-text">
            A better wait starts
            <br className="hidden sm:block" /> with one scan.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-ink-text-2">
            Three steps for the customer, one screen for your team. No app, no
            account, no clipboard at the door.
          </p>
        </Reveal>
      </div>

      {/* Rail */}
      <div ref={railRef} className="relative mt-14">
        {/* Vertical rail — mobile & tablet */}
        <div
          className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-line-light sm:block lg:hidden"
          aria-hidden="true"
        >
          <motion.div
            style={{ height: lineHeight }}
            className="w-px bg-qzen-accent"
          />
        </div>

        {/* Horizontal rail — desktop */}
        <div
          className="absolute inset-x-0 top-[7px] hidden h-px bg-line-light lg:block"
          aria-hidden="true"
        >
          <motion.div
            style={{ width: lineHeight }}
            className="h-px bg-qzen-accent"
          />
        </div>

        <ol className="grid gap-10 sm:gap-12 sm:pl-9 lg:grid-cols-3 lg:gap-12 lg:pl-0">
          {steps.map((step, index) => (
            <li key={step.number} className="relative">
              {/* Stop marker */}
              <span
                className="absolute -left-9 top-1 hidden h-3.5 w-3.5 rounded-full border-2 border-paper bg-qzen-accent sm:block lg:left-0 lg:top-[1px]"
                aria-hidden="true"
              />

              <Reveal delay={index * 0.1}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-medium tracking-[0.2em] text-qzen-accent-strong">
                    {step.number}
                  </span>
                  <span className="h-px flex-1 bg-line-light lg:hidden" />
                </div>

                <h3 className="mt-4 font-editorial text-[clamp(1.75rem,3.2vw,2.4rem)] leading-none tracking-[-0.01em] text-ink-text">
                  {step.title}
                </h3>

                <p className="mt-3 max-w-[380px] text-[15.5px] leading-[1.6] text-ink-text-2">
                  {step.description}
                </p>

                <div className="mt-6">
                  <StepVisual index={index} />
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Editorial aside */}
      <Reveal delay={0.1} className="mt-12 flex justify-end">
        <div className="flex items-start gap-3">
          <span className="mt-3 hidden h-px w-16 rotate-[-8deg] bg-qzen-accent/60 sm:block" />
          <p className="font-editorial text-[22px] italic leading-tight text-qzen-brand sm:text-[26px]">
            Simple
            <br />
            as that.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
