import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import { getQueueHistorySession } from "@/lib/queueHistory";

interface QueueHistoryPageProps {
  params: Promise<{
    queueId: string;
    dateKey: string;
  }>;
}

function formatTime(date: Date | null | undefined) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
  }).format(new Date(Number(year), Number(month) - 1, Number(day)));
}

function getStatusClasses(status: string) {
  if (status === "completed") {
    return "bg-qz-accent-soft text-emerald-300 ring-emerald-500/25";
  }

  if (status === "serving") {
    return "bg-blue-500/12 text-blue-400 ring-blue-500/25";
  }

  if (status === "waiting") {
    return "bg-amber-500/12 text-amber-400 ring-amber-500/25";
  }

  return "bg-red-500/12 text-red-400 ring-red-500/25";
}

export default async function QueueHistoryPage({
  params,
}: QueueHistoryPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { queueId, dateKey } = await params;

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    return <p>Business not found.</p>;
  }

  const queue = await Queue.findOne({
    _id: queueId,
    businessId: business._id,
  }).lean();

  if (!queue) {
    return <p>Queue not found.</p>;
  }

  const data = await getQueueHistorySession(
    queueId,
    dateKey,
  );

  if (!data) {
    return <p>Queue history not found.</p>;
  }

  const {
    session: queueSession,
    entries,
    summary,
  } = data;

  const averageServiceTime =
    summary.averageServiceTimeMs !== null
      ? `${(
          summary.averageServiceTimeMs /
          1000 /
          60
        ).toFixed(1)} min`
      : "—";

  return (
   

      <section className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <Link
          href={`/dashboard/queue/${queueId}`}
          className="text-sm text-qz-text-2 hover:text-qz-text"
        >
          ← Back to Queue Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-sm text-qz-text-2">
            {business.name}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-white">
            {queue.name}
          </h1>

          <p className="mt-2 text-qz-text-2">
            Queue History · {formatDate(dateKey)}
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6">
            <p className="text-sm text-qz-text-2">
              Total customers
            </p>

            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-white">
              {summary.totalCustomers}
            </p>
          </div>

          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6">
            <p className="text-sm text-qz-text-2">
              Completed
            </p>

            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-emerald-400">
              {summary.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6">
            <p className="text-sm text-qz-text-2">
              Skipped
            </p>

            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-red-400">
              {summary.skipped}
            </p>
          </div>

          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6">
            <p className="text-sm text-qz-text-2">
              Avg. service time
            </p>

            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-white">
              {averageServiceTime}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-qz-line bg-qz-surface p-8">
          <div>
            <h2 className="text-xl font-semibold text-qz-text">
              Customer History
            </h2>

            <p className="mt-2 text-sm text-qz-text-2">
              Every customer who joined this queue session.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {entries.length === 0 ? (
              <p className="text-sm text-qz-text-2">
                No customers joined this session.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry._id.toString()}
                  className="rounded-xl bg-qz-surface-2 px-5 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-qz-text">
                        #{entry.tokenNumber}
                      </p>

                      <p className="mt-1 text-sm text-qz-text-2">
                        {entry.customerName}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${getStatusClasses(
                        entry.status,
                      )}`}
                    >
                      {entry.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-qz-text-2 sm:grid-cols-3">
                    <p>
                      Joined:{" "}
                      {formatTime(entry.joinedAt)}
                    </p>

                    <p>
                      Called:{" "}
                      {formatTime(entry.calledAt)}
                    </p>

                    <p>
                      Finished:{" "}
                      {formatTime(
                        entry.completedAt ??
                          entry.skippedAt,
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-qz-line bg-qz-surface p-8">
          <h2 className="text-xl font-semibold text-qz-text">
            Session Information
          </h2>

          <div className="mt-4 space-y-2 text-sm text-qz-text-2">
            <p>
              Session status:{" "}
              <span className="font-medium capitalize">
                {queueSession.status}
              </span>
            </p>

            <p>
              Last token:{" "}
              <span className="font-medium">
                #{queueSession.currentToken}
              </span>
            </p>

            <p>
              Customers still waiting:{" "}
              <span className="font-medium">
                {summary.waiting}
              </span>
            </p>

            <p>
              Customers still serving:{" "}
              <span className="font-medium">
                {summary.serving}
              </span>
            </p>
          </div>
        </div>
      </section>
  );
}