"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/dashboard/SignOutButton";

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronDownIcon({ open = false }: { open?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      className={`transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
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
  );
}

function CloseIcon() {
  return (
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
  );
}

function DashboardIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
      <circle cx="3" cy="6" r="0.5" fill="currentColor" />
      <circle cx="3" cy="12" r="0.5" fill="currentColor" />
      <circle cx="3" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M18 14a5 5 0 0 1 3 4.5" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 5-7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10.3a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.3V14h-.3a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.3 2.3 0 1 1 3.9 1.7c-.9.8-1.7 1.2-1.7 2.8" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function getNavigationItemClasses(active: boolean) {
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
  }`;
}

export default function DashboardHeader({
  businessName,
}: {
  businessName: string;
}) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const initial = businessName.trim().charAt(0).toUpperCase();

  const isDashboardActive = pathname === "/dashboard";

  const isQueuesActive =
    pathname === "/dashboard/queues" ||
    pathname.startsWith("/dashboard/queues/") ||
    pathname.startsWith("/dashboard/queue/");

  const isCustomersActive =
    pathname === "/dashboard/customers" ||
    pathname.startsWith("/dashboard/customers/");

  const isAnalyticsActive =
    pathname === "/dashboard/analytics" ||
    pathname.startsWith("/dashboard/analytics/");

  const isSettingsActive =
    pathname === "/dashboard/settings" ||
    pathname.startsWith("/dashboard/settings/");

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [profileOpen]);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="flex min-h-[72px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          {/* Desktop Search */}
          <div className="hidden w-full max-w-[620px] sm:block">
            <div className="flex h-10 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3.5 text-zinc-400 transition focus-within:border-zinc-300 focus-within:bg-white">
              <SearchIcon />

              <span className="text-sm text-zinc-400">Search anything...</span>

              <span className="ml-auto rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium tracking-wide text-zinc-400">
                Ctrl K
              </span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950 sm:hidden"
          >
            <MenuIcon />
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <BellIcon />

              <span
                aria-hidden="true"
                className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full bg-red-500"
              />
            </button>

            <div className="hidden h-8 w-px bg-zinc-200 sm:block" />

            {/* Business Profile */}
            <div ref={profileRef} className="relative">
              <button
                type="button"
                aria-label={`${businessName} business profile`}
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
                className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-zinc-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                  {initial}
                </div>

                <div className="hidden min-w-0 text-left md:block">
                  <p className="max-w-[180px] truncate text-sm font-semibold text-zinc-900">
                    {businessName}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">Business Owner</p>
                </div>

                <ChevronDownIcon open={profileOpen} />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg shadow-zinc-950/10">
                  <div className="border-b border-zinc-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                        {initial}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-950">
                          {businessName}
                        </p>

                        <p className="mt-0.5 text-xs text-zinc-500">
                          Business Owner
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setProfileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isSettingsActive
                          ? "bg-emerald-50 text-emerald-800"
                          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                      }`}
                    >
                      <SettingsIcon />
                      <span>Business settings</span>
                    </Link>
                  </div>

                  <div className="border-t border-zinc-100 p-2">
                    <SignOutButton />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-[min(82vw,320px)] flex-col bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
              <div>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-bold tracking-tight text-zinc-950"
                >
                  Q<span className="text-emerald-600">z</span>en
                </Link>

                <p className="mt-1 text-xs text-zinc-400">
                  Join. Relax. Get Served.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={getNavigationItemClasses(isDashboardActive)}
                >
                  <DashboardIcon />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/dashboard/queues"
                  onClick={() => setMenuOpen(false)}
                  className={getNavigationItemClasses(isQueuesActive)}
                >
                  <QueueIcon />
                  <span>Queues</span>
                </Link>

                <Link
                  href="/dashboard/customers"
                  onClick={() => setMenuOpen(false)}
                  className={getNavigationItemClasses(isCustomersActive)}
                >
                  <CustomersIcon />
                  <span>Customers</span>
                </Link>

                <Link
                  href="/dashboard/analytics"
                  onClick={() => setMenuOpen(false)}
                  className={getNavigationItemClasses(isAnalyticsActive)}
                >
                  <AnalyticsIcon />
                  <span>Analytics</span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className={getNavigationItemClasses(isSettingsActive)}
                >
                  <SettingsIcon />
                  <span>Settings</span>
                </Link>
              </div>
            </nav>

            {/* Account */}
            <div className="space-y-5 border-t border-zinc-100 px-5 py-5">
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-700">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {businessName}
                    </p>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      Business Account
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="#"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                <HelpIcon />
                <span>Help &amp; Support</span>
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
