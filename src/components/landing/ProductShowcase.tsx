"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import DashboardMock from "@/components/landing/DashboardMock";
import Reveal from "@/components/landing/Reveal";
import ChapterMarker from "@/components/landing/ChapterMarker";

const callouts = [
  {
    number: "A",
    title: "Call next in one tap",
    description: "Counter staff move the queue without leaving the screen.",
  },
  {
    number: "B",
    title: "Every action in real time",
    description:
      "Calls, completions and skips push to every customer instantly.",
  },
  {
    number: "C",
    title: "History by day",
    description: "Each session is archived, so the day is a record — not a memory.",
  },
];

/**
 * Act III — the product, lit like a stage.
 * The console tilts flat as it scrolls into view; annotations parallax around it.
 */
export default function ProductShowcase() {
  const frameRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: frameRef,
    offset: ["start end", "center center"],
  });

  const rotateX = useTransform(scrollYProgress, [0, 1], [9, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [56, 0]);

  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-16">
      {/* Heading */}
      <div className="max-w-[760px]">
        <Reveal>
          <ChapterMarker number="04" label="Inside the product" onDark />
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 text-[clamp(2.1rem,5.2vw,3.6rem)] font-editorial leading-[1.02] tracking-[-0.02em] text-white">
            One screen your whole
            <br className="hidden sm:block" /> team can run.
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-5 max-w-[580px] text-[17px] leading-[1.65] text-on-dark-2">
            The staff console is built for a counter: large targets, obvious
            state, and every queue in one place. Below is the console as your
            team sees it.
          </p>
        </Reveal>
      </div>

      {/* ── Console frame with annotations ───────────────────── */}
      <div className="relative mt-14">
        {/* Ambient light behind the frame */}
        <div
          className="pointer-events-none absolute left-1/2 top-8 h-[360px] w-[70%] max-w-[760px] -translate-x-1/2 rounded-full bg-qz-accent/12 blur-[110px]"
          aria-hidden="true"
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-8">
          {/* Frame */}
          <motion.div
            ref={frameRef}
            style={{ rotateX, scale, y }}
            className="relative [perspective:1600px] [&>*]:[transform-style:preserve-3d]"
          >
            <DashboardMock />
          </motion.div>

          {/* Side annotations — desktop */}
          <div className="hidden lg:block">
            <ol className="space-y-7 pt-2">
              {callouts.map((callout, index) => (
                <Reveal key={callout.number} delay={0.15 + index * 0.1}>
                  <li className="relative border-l border-line-dark-strong pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-qz-accent shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                    <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-signal">
                      {callout.number}
                    </span>
                    <p className="mt-1.5 text-[14px] font-semibold text-white">
                      {callout.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-on-dark-2">
                      {callout.description}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>

        {/* Annotations — mobile / tablet list */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:hidden">
          {callouts.map((callout, index) => (
            <Reveal key={callout.number} delay={index * 0.08}>
              <div className="border-t border-line-dark-strong pt-3">
                <span className="font-mono text-[10px] font-medium tracking-[0.2em] text-signal">
                  {callout.number}
                </span>
                <p className="mt-1.5 text-[14px] font-semibold text-white">
                  {callout.title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] text-on-dark-2">
                  {callout.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Editorial aside */}
      <Reveal delay={0.1} className="mt-12 flex items-center gap-4">
        <span className="h-px flex-1 bg-line-dark" />
        <p className="font-editorial text-[22px] italic leading-tight text-on-dark-2 sm:text-[26px]">
          Built for the counter, not the keyboard.
        </p>
      </Reveal>
    </div>
  );
}
