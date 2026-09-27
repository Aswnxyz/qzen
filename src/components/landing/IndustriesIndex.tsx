"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { industries, hueClasses } from "@/lib/landing";
import type { Industry } from "@/lib/landing";
import IndustryVignette from "@/components/landing/IndustryVignette";
import Reveal from "@/components/landing/Reveal";
import ChapterMarker from "@/components/landing/ChapterMarker";

/**
 * Act II centerpiece — an editorial index of the verticals Qzen serves.
 *
 * Desktop: sticky vignette on the left, scrolling rows on the right.
 *          The active row follows the scroll position.
 * Mobile:  rows expand in place, vignette renders inline.
 */
export default function IndustriesIndex() {
  const [active, setActive] = useState(0);
  const [openMobile, setOpenMobile] = useState<number | null>(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, []);

  const current: Industry = industries[active];

  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-16">
      {/* Heading */}
      <div className="max-w-[760px]">
        <Reveal>
          <ChapterMarker number="01" label="Who it's for" />
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 text-[clamp(2.1rem,5.2vw,3.6rem)] font-editorial leading-[1.02] tracking-[-0.02em] text-ink-text">
            One platform. Every kind
            <br className="hidden sm:block" /> of waiting room.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-ink-text-2">
            Qzen is not built for one business. Clinics, salons, banks, retail
            counters, municipal offices and repair desks all queue differently —
            so the platform is configured around your service points, not a
            template.
          </p>
        </Reveal>
      </div>

      {/* ── Desktop: sticky vignette + scrolling index ─────────── */}
      <div className="mt-14 hidden gap-14 lg:grid lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
        {/* Grid item stretches to the row height so the inner panel can stick */}
        <div>
          <div className="sticky top-[104px]">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 -z-10">
                <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-qzen-brand-soft blur-3xl" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.number}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                >
                  <IndustryVignette industry={current} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Index rows */}
        <ol className="border-t border-line-light">
          {industries.map((industry, index) => {
            const isActive = index === active;

            return (
              <li
                key={industry.number}
                data-index={index}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                className="border-b border-line-light"
              >
                <div
                  className="group relative py-7"
                  onMouseEnter={() => setActive(index)}
                >
                  {/* Active marker */}
                  <span
                    className={`absolute -left-5 top-8 h-8 w-[3px] rounded-full bg-qzen-accent transition-opacity duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />

                  <div className="flex items-start gap-5">
                    <span
                      className={`mt-1 font-mono text-[11px] font-medium tracking-[0.18em] transition-colors ${
                        isActive ? "text-qzen-accent-strong" : "text-ink-text-3"
                      }`}
                    >
                      {industry.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3
                          className={`font-editorial text-[clamp(1.5rem,2.6vw,2.1rem)] leading-tight tracking-[-0.01em] transition-colors duration-300 ${
                            isActive ? "text-ink-text" : "text-ink-text-3"
                          }`}
                        >
                          {industry.name}
                        </h3>

                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ring-1 ring-inset transition-opacity duration-300 ${hueClasses[industry.hue]} ${
                            isActive ? "opacity-100" : "opacity-40"
                          }`}
                          aria-hidden="true"
                        />
                      </div>

                      <p
                        className={`mt-2 max-w-[520px] text-[15.5px] leading-[1.6] transition-colors duration-300 ${
                          isActive ? "text-ink-text-2" : "text-ink-text-3"
                        }`}
                      >
                        {industry.description}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Mobile / tablet: expandable rows ───────────────────── */}
      <div className="mt-10 border-t border-line-light lg:hidden">
        {industries.map((industry, index) => {
          const isOpen = openMobile === index;

          return (
            <div key={industry.number} className="border-b border-line-light">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenMobile(isOpen ? null : index)}
                className="flex w-full items-start gap-4 py-5 text-left"
              >
                <span className="mt-1.5 font-mono text-[11px] font-medium tracking-[0.18em] text-qzen-accent-strong">
                  {industry.number}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-editorial text-[22px] leading-tight text-ink-text">
                      {industry.name}
                    </span>
                    <span
                      className={`shrink-0 text-ink-text-3 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </span>
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className="overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="pb-6 pl-[2.1rem]">
                      <p className="text-[15px] leading-[1.6] text-ink-text-2">
                        {industry.description}
                      </p>

                      <div className="pt-4">
                        <IndustryVignette industry={industry} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
