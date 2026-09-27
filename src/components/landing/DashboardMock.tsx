"use client";

import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

const kpis = [
  { label: "Total customers", value: "142", tone: "emerald" },
  { label: "Currently waiting", value: "9", tone: "amber" },
  { label: "Served today", value: "128", tone: "blue" },
  { label: "Skipped", value: "5", tone: "red" },
];

const toneClasses: Record<string, string> = {
  emerald: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/25",
  amber: "bg-amber-500/12 text-amber-400 ring-amber-500/25",
  blue: "bg-blue-500/12 text-blue-400 ring-blue-500/25",
  red: "bg-red-500/12 text-red-400 ring-red-500/25",
};

const bars = [22, 38, 30, 52, 44, 68, 58, 74, 50, 62, 80, 46];

const queueRows = [
  { token: "A-14", name: "Walk-in", state: "Serving" },
  { token: "A-15", name: "Appointment", state: "Next" },
  { token: "A-16", name: "Walk-in", state: "Waiting" },
  { token: "A-17", name: "Priority", state: "Waiting" },
];

/**
 * Static recreation of the Qzen staff console.
 * Authentic to the shipped dashboard's visual language, but illustrative —
 * nothing here is a live feed.
 */
export default function DashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-[18px] border border-line-dark-strong bg-[#0b1015] shadow-[0_60px_120px_-40px_rgba(0,0,0,0.95)]"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-line-dark px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        <div className="ml-2 hidden h-6 flex-1 items-center rounded-md border border-line-dark bg-white/[0.03] px-3 font-mono text-[10px] text-on-dark-3 sm:flex">
          app.qzen.io/dashboard
        </div>
        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-on-dark-3">
          Staff console
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-[168px] shrink-0 border-r border-line-dark p-3 md:block">
          <p className="px-2 pb-4 pt-1 text-[17px] font-bold tracking-[-0.04em] text-white">
            Q<span className="text-qz-accent">z</span>en
          </p>

          <nav className="space-y-1">
            {["Dashboard", "Queues", "Customers", "Analytics", "Settings"].map(
              (item, i) => (
                <div
                  key={item}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] ${
                    i === 0
                      ? "bg-qz-accent-soft font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/25"
                      : "text-on-dark-2"
                  }`}
                >
                  <span className="h-3.5 w-3.5 rounded-[3px] border border-current opacity-60" />
                  {item}
                </div>
              ),
            )}
          </nav>

          <div className="mt-6 rounded-xl border border-line-dark p-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-qz-accent text-[11px] font-bold text-qz-accent-ink">
                B
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-on-dark">
                  Business
                </p>
                <p className="text-[9px] text-on-dark-3">Owner</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-qz-accent-strong">
                Today
              </p>
              <p className="mt-1.5 text-[19px] font-semibold tracking-[-0.03em] text-white sm:text-[22px]">
                Your queues
              </p>
            </div>
            <span className="inline-flex h-8 items-center rounded-lg bg-qz-accent px-3 text-[11px] font-semibold text-qz-accent-ink">
              + Create queue
            </span>
          </div>

          {/* KPI tiles */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease }}
                className="relative overflow-hidden rounded-xl border border-line-dark bg-[#0f151c] p-3"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ${toneClasses[kpi.tone]}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                </span>
                <p className="mt-3 text-[24px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
                  {kpi.value}
                </p>
                <p className="mt-1.5 text-[10px] text-on-dark-3">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Chart + queue list */}
          <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Activity chart */}
            <div className="rounded-xl border border-line-dark bg-[#0f151c] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-on-dark">
                  Today&apos;s activity
                </p>
                <div className="flex gap-3 text-[9px] text-on-dark-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-qz-accent" />
                    Joined
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    Served
                  </span>
                </div>
              </div>

              <div className="mt-4 flex h-[110px] items-end gap-1.5 sm:h-[130px]">
                {bars.map((height, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3 + i * 0.05,
                      ease,
                    }}
                    className={`w-full rounded-t-[3px] ${
                      i % 3 === 0 ? "bg-qz-accent" : "bg-white/18"
                    }`}
                  />
                ))}
              </div>

              <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-[0.14em] text-on-dark-3">
                <span>9am</span>
                <span>12pm</span>
                <span>3pm</span>
                <span>6pm</span>
              </div>
            </div>

            {/* Queue list */}
            <div className="rounded-xl border border-line-dark bg-[#0f151c] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold text-on-dark">
                  Front desk
                </p>
                <span className="rounded-full bg-qz-accent-soft px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                  Active
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {queueRows.map((row, i) => (
                  <motion.div
                    key={row.token}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.45, delay: 0.35 + i * 0.08, ease }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[11px] ${
                      row.state === "Serving"
                        ? "bg-qz-accent-soft text-emerald-200 ring-1 ring-inset ring-emerald-500/30"
                        : "bg-white/[0.03] text-on-dark-2"
                    }`}
                  >
                    <span className="font-medium tabular-nums">{row.token}</span>
                    <span className="truncate px-2 text-on-dark-3">
                      {row.name}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em]">
                      {row.state}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <span className="flex-1 rounded-lg bg-qz-accent py-2 text-center text-[11px] font-semibold text-qz-accent-ink">
                  Call next
                </span>
                <span className="rounded-lg border border-line-dark px-3 py-2 text-[11px] text-on-dark-2">
                  Skip
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
