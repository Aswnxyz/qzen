"use client";

import { motion } from "motion/react";

/**
 * Layered product composition shown in the hero.
 * Illustrative product UI — not a live data feed.
 *
 * Three planes:
 *   1. Customer view (phone panel) — largest, back
 *   2. Staff console strip — middle
 *   3. QR access tile — front, lowest
 */
export default function ProductTableau() {
  const settle = (delay: number) => ({
    initial: { opacity: 0, y: 28, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] as const },
  });

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[620px] w-full max-w-[520px] sm:h-[540px] lg:h-[580px] lg:max-w-none"
    >
      {/* Radial light behind the composition */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-qz-accent/12 blur-[110px] sm:h-[520px] sm:w-[520px]" />

      {/* ── Plane 1: customer view ─────────────────────────────── */}
      <motion.div
        {...settle(0.55)}
        className="absolute left-0 top-0 w-[230px] -rotate-[3deg] overflow-hidden rounded-[22px] border border-line-dark-strong bg-ink-raise shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] sm:left-2 sm:top-4 sm:w-[256px] lg:left-0 lg:top-6 lg:w-[280px]"
      >
        <div className="flex items-center justify-between border-b border-line-dark px-4 py-3">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-on-dark-3">
            Your place
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-qz-accent-soft px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-qz-accent" />
            Live
          </span>
        </div>

        <div className="px-4 pb-4 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-dark-3">
                Token
              </p>
              <p className="mt-1 text-[54px] font-semibold leading-none tracking-[-0.05em] text-white tabular-nums">
                A-24
              </p>
            </div>
            <p className="pb-1.5 text-right text-[11px] leading-tight text-on-dark-2">
              Consultation
              <br />
              <span className="text-on-dark-3">Ground floor</span>
            </p>
          </div>

          {/* Position list */}
          <div className="mt-4 space-y-1.5">
            {[
              { label: "A-22", state: "now" },
              { label: "A-23", state: "next" },
              { label: "A-24", state: "you" },
              { label: "A-25", state: "wait" },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] ${
                  row.state === "you"
                    ? "bg-qz-accent-soft text-emerald-200 ring-1 ring-inset ring-emerald-500/30"
                    : "bg-white/[0.03] text-on-dark-2"
                }`}
              >
                <span className="font-medium tabular-nums">{row.label}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-on-dark-3">
                  {row.state === "now"
                    ? "Serving"
                    : row.state === "next"
                      ? "Next"
                      : row.state === "you"
                        ? "You"
                        : "Waiting"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-line-dark pt-3 text-[11px]">
            <span className="text-on-dark-3">Estimated wait</span>
            <span className="font-semibold text-white tabular-nums">
              ~14 min
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Plane 2: staff console strip ───────────────────────── */}
      <motion.div
        {...settle(0.7)}
        className="absolute right-0 top-[360px] w-[196px] rotate-[2.5deg] overflow-hidden rounded-[16px] border border-line-dark-strong bg-ink-2 shadow-[0_36px_70px_-28px_rgba(0,0,0,0.85)] sm:top-[50%] sm:w-[252px] lg:top-[30%] lg:w-[256px]"
      >
        <div className="flex items-center justify-between border-b border-line-dark px-3.5 py-2.5">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-on-dark-3">
            Staff console
          </span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </span>
        </div>

        <div className="p-3">
          <button
            type="button"
            tabIndex={-1}
            className="flex w-full items-center justify-between rounded-xl bg-qz-accent px-3 py-2.5 text-[12px] font-semibold text-qz-accent-ink shadow-[0_10px_24px_-10px_rgba(16,185,129,0.9)]"
          >
            Call next
            <span className="font-mono text-[10px]">→</span>
          </button>

          <div className="mt-2 space-y-1.5">
            {["Complete", "Skip"].map((action) => (
              <div
                key={action}
                className="flex items-center justify-between rounded-lg border border-line-dark px-3 py-2 text-[11px] text-on-dark-2"
              >
                <span>{action}</span>
                <span className="font-mono text-[10px] text-on-dark-3">
                  {action === "Complete" ? "✓" : "→"}
                </span>
              </div>
            ))}
          </div>

          {/* Mini bar row */}
          <div className="mt-3 flex items-end gap-1 border-t border-line-dark pt-3">
            {[38, 62, 45, 80, 55, 70, 48, 92].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 0.36}px` }}
                className={`w-full rounded-[2px] ${
                  i === 7 ? "bg-qz-accent" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-on-dark-3">
            Served today
          </p>
        </div>
      </motion.div>

      {/* ── Plane 3: QR access tile ────────────────────────────── */}
      <motion.div
        {...settle(0.85)}
        className="absolute bottom-0 left-0 w-[104px] rotate-[-4deg] rounded-[14px] border border-line-dark-strong bg-white p-2.5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)] sm:bottom-4 sm:left-[4%] sm:w-[124px] lg:bottom-4 lg:left-[26%] lg:w-[132px]"
      >
        <div className="flex aspect-square items-center justify-center rounded-[8px] bg-[#0b0f14]">
          {/* Stylised QR mark */}
          <svg viewBox="0 0 64 64" className="h-[74%] w-[74%]">
            <g fill="#eef2f0">
              <path d="M4 4h18v18H4V4Zm4 4v10h10V8H8Z" />
              <path d="M42 4h18v18H42V4Zm4 4v10h10V8H46Z" />
              <path d="M4 42h18v18H4V42Zm4 4v10h10V46H8Z" />
            </g>
            <g fill="#10b981">
              <rect x="28" y="4" width="6" height="6" />
              <rect x="28" y="16" width="6" height="6" />
              <rect x="4" y="28" width="6" height="6" />
              <rect x="16" y="28" width="6" height="6" />
              <rect x="28" y="28" width="6" height="6" />
              <rect x="40" y="28" width="6" height="6" />
              <rect x="52" y="28" width="6" height="6" />
              <rect x="28" y="40" width="6" height="6" />
              <rect x="40" y="40" width="6" height="6" />
              <rect x="52" y="40" width="6" height="6" />
              <rect x="28" y="52" width="6" height="6" />
              <rect x="46" y="52" width="6" height="6" />
            </g>
            <g fill="#eef2f0" opacity="0.55">
              <rect x="16" y="40" width="6" height="6" />
              <rect x="16" y="52" width="6" height="6" />
              <rect x="40" y="16" width="6" height="6" />
              <rect x="52" y="52" width="6" height="6" />
            </g>
          </svg>
        </div>

        <p className="mt-2 text-center font-mono text-[8px] font-medium uppercase tracking-[0.16em] text-[#52605a]">
          Scan to join
        </p>
      </motion.div>
    </div>
  );
}
