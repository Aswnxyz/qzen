import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
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
    <main className="flex min-h-screen bg-zinc-50">
      <DashboardSidebar />

      <section className="flex-1 p-8">
        <Link
          href={`/dashboard/queue/${queueId}`}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Back to Queue Dashboard
        </Link>

        <header className="mt-8">
          <p className="text-sm text-zinc-500">
            {business.name}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-zinc-900">
            {queue.name}
          </h1>

          <p className="mt-2 text-zinc-600">
            Queue History · {formatDate(dateKey)}
          </p>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">
              Total customers
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.totalCustomers}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">
              Skipped
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.skipped}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">
              Avg. service time
            </p>

            <p className="mt-2 text-3xl font-bold">
              {averageServiceTime}
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Customer History
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Every customer who joined this queue session.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {entries.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No customers joined this session.
              </p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry._id.toString()}
                  className="rounded-xl bg-zinc-50 px-5 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        #{entry.tokenNumber}
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        {entry.customerName}
                      </p>
                    </div>

                    <span className="text-sm font-medium capitalize text-zinc-500">
                      {entry.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-zinc-500 sm:grid-cols-3">
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

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-zinc-900">
            Session Information
          </h2>

          <div className="mt-4 space-y-2 text-sm text-zinc-600">
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
    </main>
  );
}