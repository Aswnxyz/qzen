import { redirect } from "next/navigation";
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
  if (type === "joined") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <span className="text-sm">+</span>
      </div>
    );
  }

  if (type === "called") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
        <span className="text-sm">→</span>
      </div>
    );
  }

  if (type === "completed") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <span className="text-sm">✓</span>
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
      <span className="text-sm">×</span>
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">
            Business not found
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
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
    <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
      {/* Greeting */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {greeting}, {business.name} 👋
          </h1>

          <p className="mt-2 text-sm text-zinc-500 sm:text-base">
            Here&apos;s what&apos;s happening with your queues today.
          </p>
        </div>

        <p className="text-sm font-medium text-zinc-400">{currentDate}</p>
      </section>

      {/* KPI Cards */}
      <DashboardStats stats={stats} />

      {/* Main Content */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
        {/* Today's Activity */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Today&apos;s Activity
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Customers joined and served throughout the day.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Joined
              </span>

              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                Served
              </span>
            </div>
          </div>

          <div className="mt-6">
            <ActivityChart data={activity} />
          </div>
        </div>

        {/* Active Queues */}
        <ActiveQueues queues={queues} />
      </section>

      {/* Bottom Content */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
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
