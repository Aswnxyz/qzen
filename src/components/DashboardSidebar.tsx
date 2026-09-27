"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/dashboard/SignOutButton";

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

function navigationItemClasses(active = false) {
  if (active) {
    return "flex items-center gap-3 rounded-xl bg-qz-accent-soft px-4 py-2.5 text-sm font-semibold text-emerald-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-inset ring-emerald-500/25 transition";
  }

  return "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-qz-text-2 transition hover:bg-white/5 hover:text-qz-text";
}

export default function DashboardSidebar({
  businessName,
}: {
  businessName: string;
}) {
  const pathname = usePathname();

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

  return (
    <aside className="hidden w-[268px] shrink-0 flex-col border-r border-qz-line bg-qz-raise lg:flex lg:min-h-screen">
      {/* Brand */}
      <div className="px-6 pb-6 pt-7">
        <Link
          href="/dashboard"
          className="inline-flex items-baseline text-[26px] font-bold tracking-[-0.04em] text-white"
        >
          Q<span className="text-qz-accent">z</span>en
        </Link>

        <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-qz-text-3">
          Join. Relax. Get Served.
        </p>
      </div>

      {/* Navigation */}
      <nav className="px-4">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={navigationItemClasses(isDashboardActive)}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/dashboard/queues"
            className={navigationItemClasses(isQueuesActive)}
          >
            <QueueIcon />
            <span>Queues</span>
          </Link>

          <Link
            href="/dashboard/customers"
            className={navigationItemClasses(isCustomersActive)}
          >
            <CustomersIcon />
            <span>Customers</span>
          </Link>

          <Link
            href="/dashboard/analytics"
            className={navigationItemClasses(isAnalyticsActive)}
          >
            <AnalyticsIcon />
            <span>Analytics</span>
          </Link>

          <Link
            href="/dashboard/settings"
            className={navigationItemClasses(isSettingsActive)}
          >
            <SettingsIcon />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div className="mt-auto space-y-3 border-t border-qz-line px-4 pb-5 pt-4">
        {/* Business Account */}
        <div className="rounded-2xl border border-qz-line bg-qz-surface p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-qz-accent text-sm font-bold text-qz-accent-ink">
              {businessName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-qz-text">
                {businessName}
              </p>

              <p className="mt-0.5 text-[11px] text-qz-text-3">
                Business Account
              </p>
            </div>
          </div>
        </div>

        {/* Help */}
        <Link
          href="#"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-qz-text-2 transition hover:bg-white/5 hover:text-qz-text"
        >
          <HelpIcon />
          <span>Help &amp; Support</span>
        </Link>

        {/* Sign out */}
        <SignOutButton />

        {/* Upgrade */}
        {/* <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-sm">
              👑
            </span>

            <p className="text-sm font-semibold text-zinc-900">
              Upgrade your experience
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Get advanced analytics, custom branding and more.
          </p>

          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-xl bg-emerald-100 px-4 py-2.5 text-xs font-semibold text-emerald-800"
          >
            Coming soon
          </button>
        </div> */}
      </div>
    </aside>
  );
}