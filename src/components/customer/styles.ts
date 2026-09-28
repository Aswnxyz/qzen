/**
 * Shared class strings for the Qzen V2 customer surfaces (join flow + auth).
 *
 * Kept in a plain (server-safe) module so server components such as the join
 * route can reuse them without crossing a client boundary.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;

/** The single card shell used by every customer-facing form. */
export const cardClass =
  "w-full max-w-md rounded-3xl border border-line-light bg-white px-6 py-7 shadow-[0_1px_2px_rgba(23,33,27,0.04),0_30px_60px_-36px_rgba(23,33,27,0.4)] sm:px-8 sm:py-9";

/** Small mono kicker above a heading. */
export const eyebrowClass =
  "font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-ink-text-3";

/** Editorial display heading — carries the landing typography into the app. */
export const headingClass =
  "font-editorial text-[clamp(2rem,6.5vw,2.55rem)] leading-[1.04] text-ink-text";

export const labelClass = "block text-[13px] font-medium text-ink-text-2";

export const inputClass =
  "w-full rounded-xl border border-line-light-strong bg-white px-4 py-3 text-[15px] text-ink-text outline-none transition placeholder:text-ink-text-3 focus:border-qz-accent focus:ring-4 focus:ring-qz-accent/15";

export const primaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-qz-accent px-6 text-[15px] font-semibold text-qz-accent-ink shadow-[0_12px_26px_-16px_rgba(16,185,129,0.85)] transition hover:bg-qz-accent-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

export const quietButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-light-strong bg-white px-6 text-[15px] font-semibold text-ink-text transition hover:border-ink-text-3 hover:bg-paper-2 disabled:cursor-not-allowed disabled:opacity-50";

export const linkClass =
  "font-semibold text-qzen-brand transition hover:text-qzen-brand-strong";

export const errorClass =
  "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700";

/**
 * Entrance motion shared by customer cards and forms.
 *
 * Deliberately short: these are task surfaces, not a marketing page, so the
 * fields must be typeable almost immediately.
 */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: EASE },
  };
}
