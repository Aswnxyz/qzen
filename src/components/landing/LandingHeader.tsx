"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import JoinQueueButton from "@/components/landing/JoinQueueButton";

interface LandingHeaderProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

const navItems = [
  { href: "#industries", label: "Industries" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#product", label: "Product" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingHeader({
  isAuthenticated,
  hasBusiness,
}: LandingHeaderProps) {
  const ownerDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  const loginDestination = !isAuthenticated
    ? "/login"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled
            ? "border-b border-line-dark bg-ink/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[72px] w-full max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8"
        >
          <Link
            href="/"
            className="group flex items-baseline gap-3"
            aria-label="Qzen home"
          >
            <span className="text-[26px] font-bold leading-none tracking-[-0.04em] text-white">
              Q<span className="text-qz-accent">z</span>en
            </span>
            <span className="hidden font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-on-dark-3 transition-colors group-hover:text-on-dark-2 lg:inline">
              Join. Relax. Get Served.
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-on-dark-2 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wrapper owns the breakpoint display: JoinQueueButton sets its own
                inline-flex, so a class on it alone can't reliably hide it. */}
            <span className="hidden sm:block">
              <JoinQueueButton variant="dark" />
            </span>

            <Link
              href={loginDestination}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-on-dark-2 transition hover:bg-white/5 hover:text-white sm:inline-flex"
            >
              {isAuthenticated ? "Dashboard" : "Log in"}
            </Link>

            <Link
              href={ownerDestination}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-qz-accent px-4 text-sm font-semibold text-qz-accent-ink shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] transition hover:bg-qz-accent-strong sm:px-5"
            >
              Get started
            </Link>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-on-dark-2 transition hover:bg-white/5 hover:text-white lg:hidden"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          <aside className="absolute inset-y-0 right-0 flex w-[min(86vw,340px)] flex-col border-l border-line-dark bg-ink shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-line-dark px-6 py-5">
              <div>
                <p className="text-[24px] font-bold leading-none tracking-[-0.04em] text-white">
                  Q<span className="text-qz-accent">z</span>en
                </p>
                <p className="mt-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-on-dark-3">
                  Join. Relax. Get Served.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-on-dark-2 transition hover:bg-white/5 hover:text-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12" />
                  <path d="m18 6-12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium text-on-dark-2 transition hover:bg-white/5 hover:text-white"
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-xs text-on-dark-3">→</span>
                  </Link>
                ))}
              </div>
            </nav>

            <div className="space-y-3 border-t border-line-dark px-4 py-5">
              <div className="flex flex-col gap-2.5">
                <Link
                  href={ownerDestination}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl bg-qz-accent text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong"
                >
                  Get started
                </Link>

                <Link
                  href={loginDestination}
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl border border-line-dark-strong text-sm font-semibold text-on-dark transition hover:bg-white/5"
                >
                  {isAuthenticated ? "Open dashboard" : "Log in"}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
