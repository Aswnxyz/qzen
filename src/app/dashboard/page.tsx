import { redirect } from "next/navigation";
import Link from "next/link";
import ActivityChart from "@/components/dashboard/ActivityChart";
import { getSession } from "@/lib/auth";
import { getBusinessDashboard } from "@/lib/dashboard";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ActiveQueues from "@/components/dashboard/ActiveQueues";
import YourQueues from "@/components/dashboard/YourQueues";
import RecentActivity from "@/components/dashboard/RecentActivity";

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}


function getActivityIcon(type: string) {
  const baseClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

  if (type === "joined") {
    return (
      <div className={`${baseClass} bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M22 11h-6" />
        </svg>
      </div>
    );
  }

  if (type === "called") {
    return (
      <div className={`${baseClass} bg-white/10 text-qz-text-2 ring-1 ring-inset ring-white/10`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </div>
    );
  }

  if (type === "completed") {
    return (
      <div className={`${baseClass} bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${baseClass} bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/25`}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </div>
  );
}

function getActivityText(type: string) {
  if (type === "joined") {
    return "joined the queue";
  }

  if (type === "called") {
    return "was called";
  }

  if (type === "completed") {
    return "was completed";
  }

  return "was skipped";
}

function formatActivityTime(timestamp: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const data = await getBusinessDashboard(session.user.id);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-qz-bg px-6">
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-qz-text">
            Business not found
          </h1>

          <p className="mt-2 text-sm text-qz-text-2">
            We could not find a business associated with your account.
          </p>
        </div>
      </main>
    );
  }

  const { business, queues, stats, activity, recentActivity } = data;

  const greeting = getGreeting();
  const currentDate = formatDate();

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-qz-line bg-qz-surface">
        <div className="qz-glow pointer-events-none absolute inset-0" />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-qz-accent-strong">
              {greeting}
            </p>

            <h1 className="mt-3 break-words text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Welcome back, {business.name} 👋
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-qz-text-2 sm:text-base">
              Here&apos;s what&apos;s happening with your queues today.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-qz-text-3">
                Today
              </p>

              <p className="mt-1 text-sm font-medium tabular-nums text-qz-text">
                {currentDate}
              </p>
            </div>

            <Link
              href="/dashboard/queues/new"
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-qz-accent px-5 text-sm font-semibold text-qz-accent-ink shadow-[0_10px_30px_-10px_rgba(16,185,129,0.7)] transition hover:bg-qz-accent-strong"
            >
              <span className="text-base leading-none">+</span>
              Create Queue
            </Link>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <DashboardStats stats={stats} />

      {/* Main Content */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
        {/* Today's Activity */}
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 19V5" />
                  <path d="M4 19h16" />
                  <path d="m7 15 3-4 3 2 5-7" />
                </svg>
              </span>

              <div>
                <h2 className="text-base font-semibold tracking-tight text-qz-text">
                  Today&apos;s Activity
                </h2>

                <p className="mt-1 text-sm text-qz-text-3">
                  Customers joined and served throughout the day.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-qz-text-2">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-qz-accent shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                Joined
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                Served
              </span>
            </div>
          </div>

          <div className="mt-5">
            <ActivityChart data={activity} />
          </div>
        </div>

        {/* Active Queues */}
        <ActiveQueues queues={queues} />
      </section>

      {/* Bottom Content */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
        {/* Your Queues */}
        <YourQueues queues={queues} />

        {/* Recent Activity */}
        <RecentActivity
          recentActivity={recentActivity}
          getActivityIcon={getActivityIcon}
          getActivityText={getActivityText}
          formatActivityTime={formatActivityTime}
        />
      </section>
    </div>
  );
}
