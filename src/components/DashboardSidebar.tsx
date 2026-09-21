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
  return `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
    active
      ? "bg-emerald-50 text-emerald-800"
      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
  }`;
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
    <aside className="hidden w-[264px] shrink-0 border-r border-zinc-200 bg-white lg:flex lg:min-h-screen lg:flex-col">
      {/* Brand */}
      <div className="px-8 pt-7">
        <Link
          href="/dashboard"
          className="text-3xl font-bold tracking-tight text-zinc-950"
        >
          Q<span className="text-emerald-600">z</span>en
        </Link>

        <p className="mt-1 text-xs text-zinc-400">
          Join. Relax. Get Served.
        </p>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
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
      <div className="mt-auto space-y-5 px-5 pb-6">
        {/* Business Account */}
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-semibold text-amber-700">
              {businessName.charAt(0).toUpperCase()}
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

        {/* Help */}
        <Link
          href="#"
          className="flex items-center gap-3 px-3 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
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