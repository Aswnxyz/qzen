"use client";

import Link from "next/link";
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

interface CustomerShellProps {
  children: ReactNode;
  /**
   * Replaces the default "Home" link in the brand bar. Lets a page keep its own
   * piece of chrome (onboarding's step indicator) on the same grid line as the
   * brand. Defaults to the "Home" link, so existing pages are unaffected.
   */
  headerRight?: ReactNode;
}

/**
 * Page chrome for every customer-facing surface (join flow + auth).
 *
 * A warm light canvas with a faint grid and paper grain, a quiet brand bar,
 * and an animated content well. The width of the header/footer columns is
 * aligned with the card so the whole composition sits on one grid.
 */
export default function CustomerShell({
  children,
  headerRight,
}: CustomerShellProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative isolate flex min-h-screen flex-col overflow-x-clip bg-paper text-ink-text">
        {/* Atmosphere */}
        <div
          className="qzc-grid pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
        />
        <div
          className="qzc-grain pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-40 -top-56 h-[520px] w-[520px] rounded-full bg-qz-accent/[0.09] blur-[130px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-36 top-1/3 h-[420px] w-[420px] rounded-full bg-qzen-brand/[0.06] blur-[120px]"
          aria-hidden="true"
        />

        {/* Brand bar */}
        <header className="relative z-10 border-b border-line-light">
          <nav className="mx-auto flex h-16 w-full max-w-[512px] items-center justify-between gap-4 px-5 sm:h-[72px] sm:px-8">
            <Link
              href="/"
              className="group flex items-baseline gap-3 py-2"
              aria-label="Qzen — go to the homepage"
            >
              <span className="text-[22px] font-bold leading-none tracking-[-0.04em] text-ink-text">
                Q<span className="text-qz-accent">z</span>en
              </span>
              <span className="hidden font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-ink-text-3 transition-colors group-hover:text-ink-text-2 sm:inline">
                Join. Relax. Get Served.
              </span>
            </Link>

            {headerRight ?? (
              <Link
                href="/"
                className="shrink-0 rounded-lg px-2.5 py-2 text-[13px] font-medium text-ink-text-2 transition hover:bg-white hover:text-ink-text sm:px-3"
              >
                Home
              </Link>
            )}
          </nav>
        </header>

        {/* Content — the card below owns the entrance animation, so this
            well stays static to avoid a second, competing fade. */}
        <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-14">
          {children}
        </main>

        <footer className="relative z-10 border-t border-line-light">
          <div className="mx-auto hidden h-14 w-full max-w-[512px] items-center justify-between px-5 sm:flex sm:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-text-3">
              Qzen
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-text-3">
              Join. Relax. Get Served.
            </p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
