"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { faqs } from "@/lib/landing";
import Reveal from "@/components/landing/Reveal";

/**
 * Act IV close — objection handling in an editorial accordion.
 */
export default function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 pt-6 sm:px-8 sm:pb-28">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)] lg:gap-16">
        <div className="lg:sticky lg:top-[104px] lg:self-start">
          <Reveal>
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-ink-text-3">
              Questions
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h2 className="mt-5 text-[clamp(1.9rem,4vw,2.75rem)] font-editorial leading-[1.05] tracking-[-0.02em] text-ink-text">
              Before you ask.
            </h2>
          </Reveal>
        </div>

        <div className="border-t border-line-light">
          {faqs.map((faq, index) => {
            const isOpen = open === index;

            return (
              <Reveal key={faq.question} delay={Math.min(index, 4) * 0.05}>
                <div className="border-b border-line-light">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  >
                    <span
                      className={`text-[16.5px] font-semibold leading-snug tracking-[-0.01em] transition-colors ${
                        isOpen ? "text-qzen-brand-strong" : "text-ink-text"
                      }`}
                    >
                      {faq.question}
                    </span>

                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-45 border-qzen-brand text-qzen-brand"
                          : "border-line-light-strong text-ink-text-3"
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
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
                        <p className="max-w-[640px] pb-6 pr-10 text-[15.5px] leading-[1.7] text-ink-text-2">
                          {faq.answer}
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
