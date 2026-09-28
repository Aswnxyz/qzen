"use client";

import { motion } from "motion/react";
import { EASE } from "./styles";

export type TicketStatus = "waiting" | "serving" | "completed" | "skipped";

interface QueueTicketProps {
  businessName: string;
  queueName: string;
  tokenNumber: number;
  currentToken: number | null;
  peopleAhead: number | null;
  estimatedWait: number | null;
  status: TicketStatus;
}

const statusMeta: Record<
  TicketStatus,
  { label: string; pill: string; dot: string }
> = {
  waiting: {
    label: "In line",
    pill: "border-qzc-rule-strong bg-white/70 text-qzc-ink-2",
    dot: "bg-qz-accent animate-[qzl-rail-pulse_2.6s_ease-in-out_infinite]",
  },
  serving: {
    label: "Your turn",
    pill: "border-qz-accent/45 bg-qz-accent/15 text-qzen-brand-strong",
    dot: "bg-qz-accent",
  },
  skipped: {
    label: "Skipped",
    pill: "border-amber-300/80 bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    pill: "border-qzen-brand/25 bg-qzen-brand-soft text-qzen-brand-strong",
    dot: "bg-qzen-success",
  },
};

const messageMeta: Record<
  TicketStatus,
  { title: string; body: string; panel: string; dot: string }
> = {
  waiting: {
    title: "You\u2019re in line",
    body: "Relax \u2014 we\u2019ll keep your place. This ticket updates on its own.",
    panel: "bg-qzc-stock-2 text-qzc-ink-2",
    dot: "bg-qz-accent",
  },
  serving: {
    title: "It\u2019s your turn",
    body: "Please make your way to the counter now.",
    panel: "bg-qz-accent/12 text-qzen-brand-strong",
    dot: "bg-qz-accent",
  },
  skipped: {
    title: "Your turn was skipped",
    body: "Please speak with the staff if you believe this was a mistake.",
    panel: "bg-amber-100/80 text-amber-900",
    dot: "bg-amber-500",
  },
  completed: {
    title: "Your visit is complete",
    body: "Thank you for waiting \u2014 that\u2019s everything for this ticket.",
    panel: "bg-qzen-brand-soft text-qzen-brand",
    dot: "bg-qzen-success",
  },
};

function Stat({
  label,
  value,
  bordered = false,
}: {
  label: string;
  value: string;
  /** Draws the hairline that separates this column from the one before it. */
  bordered?: boolean;
}) {
  return (
    <div
      className={`min-w-0 py-5 ${
        bordered ? "border-l border-qzc-rule pl-3 sm:pl-4" : ""
      }`}
    >
      <p className="font-mono text-[9px] uppercase leading-[1.5] tracking-[0.14em] text-qzc-ink-3">
        {label}
      </p>
      <p className="mt-1.5 truncate text-[21px] font-semibold tabular-nums leading-none text-qzc-ink">
        {value}
      </p>
    </div>
  );
}

/**
 * Silhouette of the ticket shown while a saved ticket is being revalidated.
 * Same shape and surface as the real ticket so nothing jumps when it lands.
 */
export function QueueTicketSkeleton() {
  const bar = "animate-pulse rounded-full bg-qzc-rule";

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="qzc-ticket relative w-full max-w-md overflow-hidden rounded-[26px] shadow-[0_1px_2px_rgba(28,26,20,0.05),0_36px_64px_-36px_rgba(28,26,20,0.45)]"
    >
      <div
        className="qzc-grain pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-4 px-6 pt-6 sm:px-7">
        <div className="min-w-0 space-y-2.5">
          <div className={`${bar} h-2.5 w-28`} />
          <div className={`${bar} h-4 w-40`} />
          <div className={`${bar} h-3 w-32`} />
        </div>
        <div className={`${bar} h-7 w-24 shrink-0`} />
      </div>

      <div className="px-6 pb-7 pt-9 text-center sm:px-7">
        <div className={`${bar} mx-auto h-3 w-24`} />
        <div className="mx-auto mt-5 h-28 w-40 max-w-full rounded-2xl bg-qzc-rule/70" />
      </div>

      <div className="relative h-6">
        <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-qzc-rule-strong" />
        <span
          className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
          aria-hidden="true"
        />
        <span
          className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
          aria-hidden="true"
        />
      </div>

      <div className="relative grid grid-cols-3 px-6 sm:px-7">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`py-5 ${
              index > 0 ? "border-l border-qzc-rule pl-3 sm:pl-4" : ""
            }`}
          >
            <div className={`${bar} h-2.5 w-16`} />
            <div className={`${bar} mt-3 h-5 w-12`} />
          </div>
        ))}
      </div>

      <div className="sr-only">Restoring your ticket&hellip;</div>
    </div>
  );
}

/**
 * The digital queue token.
 *
 * A warm paper stock with a printed feel: mono header, a single dominant
 * token number, a real perforation separating the stub, and a three-field
 * data strip. Live values transition gently as the queue advances.
 */
export default function QueueTicket({
  businessName,
  queueName,
  tokenNumber,
  currentToken,
  peopleAhead,
  estimatedWait,
  status,
}: QueueTicketProps) {
  const meta = statusMeta[status] ?? statusMeta.waiting;
  const message = messageMeta[status] ?? messageMeta.waiting;
  const showStats = status === "waiting" || status === "serving";

  const servingToken = currentToken ?? 0;
  // `0` means nobody has been called yet — there is no token #0.
  const hasServed = servingToken > 0;
  const showProgress = showStats && tokenNumber > 1;
  const progress = hasServed
    ? Math.max(0, Math.min(100, (servingToken / tokenNumber) * 100))
    : 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, scale: 0.97, rotate: -0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      transition={{ duration: 0.7, ease: EASE }}
      aria-live="polite"
      className={`qzc-ticket relative w-full max-w-md overflow-hidden rounded-[26px] ${
        status === "serving"
          ? "shadow-[0_0_0_1.5px_rgba(16,185,129,0.45),0_36px_70px_-34px_rgba(16,185,129,0.55)]"
          : "shadow-[0_1px_2px_rgba(28,26,20,0.05),0_36px_64px_-36px_rgba(28,26,20,0.45)]"
      }`}
    >
      {/* Paper fibre */}
      <div
        className="qzc-grain pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />

      {/* Issuer head */}
      <div className="relative px-6 pt-6 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.26em] text-qzc-ink-3">
              Qzen queue ticket
            </p>
            <p className="mt-2.5 truncate text-[15px] font-semibold text-qzc-ink">
              {businessName}
            </p>
            <p className="truncate text-[13px] text-qzc-ink-2">{queueName}</p>
          </div>

          <motion.span
            key={meta.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${meta.pill}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
              aria-hidden="true"
            />
            {meta.label}
          </motion.span>
        </div>
      </div>

      {/* Token identity */}
      <div className="relative px-6 pb-7 pt-8 text-center sm:px-7">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.3em] text-qzc-ink-3">
          Your token
        </p>

        <p className="mt-3 font-editorial leading-[0.84] text-qzc-ink [font-size:clamp(4.25rem,17vw,6.5rem)]">
          <span
            className="mr-[0.02em] align-[0.44em] text-[0.32em] text-qzc-ink-3"
            aria-hidden="true"
          >
            #
          </span>
          <motion.span
            key={tokenNumber}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {tokenNumber}
          </motion.span>
        </p>
      </div>

      {/* Perforation */}
      <div className="relative h-6">
        <div className="absolute inset-x-6 top-1/2 border-t border-dashed border-qzc-rule-strong" />
        <span
          className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
          aria-hidden="true"
        />
        <span
          className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
          aria-hidden="true"
        />
      </div>

      {/* Stub — the three fields that matter */}
      {showStats ? (
        <>
          <div className="relative grid grid-cols-3 px-6 sm:px-7">
            <Stat
              label="Now serving"
              value={hasServed ? `#${currentToken}` : "\u2014"}
            />
            <Stat
              label="People ahead"
              value={peopleAhead === null ? "\u2014" : `${peopleAhead}`}
              bordered
            />
            <Stat
              label="Est. wait"
              value={
                estimatedWait === null ? "\u2014" : `${estimatedWait} min`
              }
              bordered
            />
          </div>

          {showProgress ? (
            <div className="relative px-6 pb-6 sm:px-7">
              <div className="relative h-[3px] w-full rounded-full bg-qzc-rule">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-qz-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-qz-accent shadow-[0_1px_3px_rgba(28,26,20,0.3)]"
                  style={{ left: `calc(${progress}% - 5px)` }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-qzc-ink-3">
                <span>#1</span>
                <span>#{tokenNumber}</span>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* State message */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={`relative mx-4 mb-4 flex items-start gap-3 rounded-2xl px-4 py-4 sm:mx-5 ${message.panel}`}
      >
        <span
          className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${message.dot}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight">
            {message.title}
          </p>
          <p className="mt-1 text-[13px] leading-[1.6] opacity-85">
            {message.body}
          </p>
        </div>
      </motion.div>

      {/* Printed footer */}
      <div className="relative flex items-center justify-between gap-3 border-t border-qzc-rule px-6 py-3.5 sm:px-7">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-qzc-ink-3">
          Qzen
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-qzc-ink-3">
          Saved on this device
        </p>
      </div>
    </motion.article>
  );
}
