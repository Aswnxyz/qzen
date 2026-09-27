"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { capabilities } from "@/lib/landing";
import Reveal from "@/components/landing/Reveal";
import ChapterMarker from "@/components/landing/ChapterMarker";

/**
 * Act II close — a hairline ledger of capabilities.
 * Rows expand on hover/focus (desktop) or are open by default (touch).
 */
export default function CapabilityLedger() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
        {/* Sticky intro */}
        <div className="lg:sticky lg:top-[104px] lg:self-start">
          <Reveal>
            <ChapterMarker number="03" label="Capabilities" />
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-6 text-[clamp(2.1rem,5.2vw,3.4rem)] font-editorial leading-[1.02] tracking-[-0.02em] text-ink-text">
              Everything a modern queue needs.
            </h2>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-5 max-w-[420px] text-[16.5px] leading-[1.65] text-ink-text-2">
              Less uncertainty for customers. Less friction for your team. Every
              capability below ships with the platform — no tiers, no add-ons.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 hidden items-center gap-3 lg:flex">
              <span className="h-px w-10 bg-line-light-strong" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-text-3">
                {capabilities.length} capabilities
              </span>
            </div>
          </Reveal>
        </div>

        {/* Ledger rows */}
        <div className="border-t border-line-light">
          {capabilities.map((capability, index) => {
            const isOpen = open === index;

            return (
              <Reveal key={capability.number} delay={Math.min(index, 5) * 0.05}>
                <div
                  className={`group border-b border-line-light transition-colors duration-300 ${
                    isOpen ? "bg-paper" : "hover:bg-paper"
                  }`}
                  onMouseEnter={() => setOpen(index)}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onFocus={() => setOpen(index)}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center gap-4 py-5 text-left sm:gap-6 sm:py-6"
                  >
                    <span
                      className={`font-mono text-[11px] font-medium tracking-[0.18em] transition-colors ${
                        isOpen ? "text-qzen-accent-strong" : "text-ink-text-3"
                      }`}
                    >
                      {capability.number}
                    </span>

                    <span
                      className={`flex-1 font-editorial text-[clamp(1.3rem,2.4vw,1.85rem)] leading-tight tracking-[-0.01em] transition-colors duration-300 ${
                        isOpen ? "text-ink-text" : "text-ink-text-2"
                      }`}
                    >
                      {capability.title}
                    </span>

                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "border-qzen-accent bg-qzen-accent text-white"
                          : "border-line-light-strong text-ink-text-3"
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M5 12h14" />
                        <path
                          className={isOpen ? "opacity-0" : "opacity-100"}
                          d="M12 5v14"
                        />
                      </svg>
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p className="max-w-[560px] pb-6 pl-[1.9rem] text-[15.5px] leading-[1.65] text-ink-text-2 sm:pl-[2.4rem]">
                          {capability.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
