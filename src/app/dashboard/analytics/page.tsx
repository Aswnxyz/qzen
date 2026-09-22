import { redirect } from "next/navigation";
import ActivityChart from "@/components/dashboard/ActivityChart";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import DateFilter from "@/components/dashboard/DateFilter";
import {
  getDateKey,
  getOrCreateQueueSession,
  getQueueSessionForDate,
} from "@/lib/queueSession";
function getHourLabel(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 || 12;

  return `${displayHour} ${suffix}`;
}

function getHourKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";

  return Number(hour);
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.round(milliseconds / 60000);

  if (totalMinutes < 1) {
    return "<1m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getStatusClasses(status: string) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "paused") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-600";
}

function getStatusLabel(status: string) {
  if (status === "active") {
    return "Open";
  }

  if (status === "paused") {
    return "Paused";
  }

  return "Closed";
}

interface AnalyticsPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    redirect("/onboarding");
  }

  const timezone = business.timezone || "Asia/Kolkata";

  const { date } = await searchParams;

  const todayDateKey = getDateKey(timezone);

  const isValidDateKey = (dateKey: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(dateKey);

  const selectedDate = date && isValidDateKey(date) ? date : todayDateKey;

  if (selectedDate > todayDateKey) {
    redirect(`/dashboard/analytics?date=${todayDateKey}`);
  }

  const isToday = selectedDate === todayDateKey;

  const [year, month, day] = selectedDate.split("-");

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));

  const yesterdayDate = new Date(`${todayDateKey}T12:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterdayDateKey = getDateKey(timezone, yesterdayDate);
  const queues = await Queue.find({
    businessId: business._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const queueAnalytics = await Promise.all(
    queues.map(async (queue) => {
      const queueSession =
        selectedDate === todayDateKey
          ? await getOrCreateQueueSession(queue._id.toString())
          : await getQueueSessionForDate(queue._id.toString(), selectedDate);
      if (!queueSession) {
        return {
          queue,
          entries: [],
          waiting: 0,
          completed: 0,
          skipped: 0,
          serviceTimes: [],
        };
      }

      const entries = await QueueEntry.find({
        queueId: queue._id,
        sessionId: queueSession._id,
      })
        .sort({ joinedAt: -1 })
        .lean();

      const waiting = entries.filter(
        (entry) => entry.status === "waiting",
      ).length;

      const completed = entries.filter(
        (entry) => entry.status === "completed",
      ).length;

      const skipped = entries.filter(
        (entry) => entry.status === "skipped",
      ).length;

      const serviceTimes = entries
        .filter(
          (entry) =>
            entry.calledAt &&
            entry.completedAt &&
            entry.completedAt.getTime() >= entry.calledAt.getTime(),
        )
        .map(
          (entry) => entry.completedAt!.getTime() - entry.calledAt!.getTime(),
        );

      return {
        queue,
        entries,
        waiting,
        completed,
        skipped,
        serviceTimes,
        sessionStatus: queueSession.status,
      };
    }),
  );

  const allEntries = queueAnalytics.flatMap((item) => item.entries);

  const activity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: getHourLabel(hour),
    joined: 0,
    served: 0,
  }));

  for (const entry of allEntries) {
    if (entry.joinedAt) {
      const hour = getHourKey(new Date(entry.joinedAt), timezone);
      activity[hour].joined += 1;
    }

    if (entry.completedAt) {
      const hour = getHourKey(new Date(entry.completedAt), timezone);
      activity[hour].served += 1;
    }
  }

  const completedEntries = allEntries.filter(
    (entry) =>
      entry.status === "completed" && entry.calledAt && entry.completedAt,
  );

  const totalServiceTime = completedEntries.reduce((total, entry) => {
    return total + (entry.completedAt!.getTime() - entry.calledAt!.getTime());
  }, 0);

  const averageServiceTime =
    completedEntries.length > 0
      ? totalServiceTime / completedEntries.length
      : 0;

  const totalCustomers = allEntries.length;

  const completedCustomers = allEntries.filter(
    (entry) => entry.status === "completed",
  ).length;

  const skippedCustomers = allEntries.filter(
    (entry) => entry.status === "skipped",
  ).length;

  const waitingCustomers = allEntries.filter(
    (entry) => entry.status === "waiting",
  ).length;

  return (
    <section className="p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              Analytics
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Understand how your queues are performing.
            </p>
          </div>

          <DateFilter
            selectedDate={selectedDate}
            todayDateKey={todayDateKey}
            basePath="/dashboard/analytics"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a
            href="/dashboard/analytics"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              isToday
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Today
          </a>

          <a
            href={`/dashboard/analytics?date=${yesterdayDateKey}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !isToday && selectedDate === yesterdayDateKey
                ? "bg-zinc-950 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Yesterday
          </a>

          <span className="text-xs text-zinc-400">Showing {formattedDate}</span>
        </div>

        <p className="mt-4 text-xs font-medium text-zinc-400">
          {isToday
            ? "Today&apos;s queue activity"
            : `Queue activity from ${formattedDate}`}
        </p>
      </header>

      {/* Overview */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Total Customers</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {totalCustomers}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {isToday ? "Customers who joined today" : "Customers who joined"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Completed</p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-600">
            {completedCustomers}
          </p>

          <p className="mt-1 text-xs text-zinc-400">Successfully served</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">Skipped</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-red-600">
            {skippedCustomers}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            {isToday ? "Customers skipped today" : "Customers skipped"}
          </p>{" "}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-zinc-500">
            {isToday ? "Currently Waiting" : "Waiting"}
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-600">
            {waitingCustomers}
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {isToday ? "Customers waiting now" : "Customers who were waiting"}
          </p>
        </div>
      </section>

      {/* Activity + Service Time */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Customer Activity
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {isToday
                ? "Customers joined and served throughout the day."
                : "Customers joined and served on this date."}
            </p>
          </div>

          <div className="mt-6">
            <ActivityChart data={activity} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Average Service Time
          </p>

          <p className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">
            {averageServiceTime > 0 ? formatDuration(averageServiceTime) : "—"}
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Based on completed customers with recorded call and completion
            times.
          </p>

          <div className="mt-6 border-t border-zinc-100 pt-5">
            <p className="text-xs text-zinc-400">
              {completedEntries.length} completed{" "}
              {completedEntries.length === 1 ? "customer" : "customers"}{" "}
              included
            </p>
          </div>
        </div>
      </section>

      {/* Queue Performance */}
      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-zinc-950">
            Queue Performance
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {isToday
              ? "Compare customer activity across your queues today."
              : "Compare customer activity across your queues on this date."}
          </p>
        </div>

        {queueAnalytics.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-sm font-semibold text-zinc-900">
              No queues yet
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Create a queue to start collecting analytics.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="border-b border-zinc-100 bg-zinc-50/70">
                  <tr className="text-xs font-medium text-zinc-500">
                    <th className="px-5 py-3">Queue</th>
                    <th className="px-5 py-3">Customers</th>
                    <th className="px-5 py-3">Completed</th>
                    <th className="px-5 py-3">Skipped</th>
                    <th className="px-5 py-3">Waiting</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {queueAnalytics.map(
                    ({
                      queue,
                      entries,
                      completed,
                      skipped,
                      waiting,
                      sessionStatus,
                    }) => (
                      <tr key={queue._id.toString()} className="text-sm">
                        <td className="px-5 py-4 font-medium text-zinc-900">
                          {queue.name}
                        </td>

                        <td className="px-5 py-4 text-zinc-700">
                          {entries.length}
                        </td>

                        <td className="px-5 py-4 text-emerald-600">
                          {completed}
                        </td>

                        <td className="px-5 py-4 text-red-600">{skipped}</td>

                        <td className="px-5 py-4 text-amber-600">{waiting}</td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              sessionStatus,
                            )}`}
                          >
                            {getStatusLabel(sessionStatus)}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-zinc-100 md:hidden">
              {queueAnalytics.map(
                ({
                  queue,
                  entries,
                  completed,
                  skipped,
                  waiting,
                  sessionStatus,
                }) => (
                  <div key={queue._id.toString()} className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium text-zinc-900">
                        {queue.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                          sessionStatus,
                        )}`}
                      >
                        {getStatusLabel(sessionStatus)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                      <div>
                        <p className="text-zinc-400">Customers</p>
                        <p className="mt-1 font-medium text-zinc-700">
                          {entries.length}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Completed</p>
                        <p className="mt-1 font-medium text-emerald-600">
                          {completed}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Skipped</p>
                        <p className="mt-1 font-medium text-red-600">
                          {skipped}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-400">Waiting</p>
                        <p className="mt-1 font-medium text-amber-600">
                          {waiting}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </section>
    </section>
  );
}
