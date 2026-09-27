import { redirect } from "next/navigation";
import DashboardRealtime from "@/components/DashboardRealtime";
import QueueControls from "@/components/QueueControls";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import { getQueueDashboard } from "@/lib/queue";
import QueueQRCode from "@/components/QueueQRCode";
import { getQueueHistory } from "@/lib/queueHistory";
import Link from "next/link";

interface QueueDashboardPageProps {
  params: Promise<{
    queueId: string;
  }>;
}

function getStatusClasses(status: string) {
  if (status === "active") {
    return "bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25";
  }

  if (status === "paused") {
    return "bg-amber-500/12 text-amber-400 ring-1 ring-inset ring-amber-500/25";
  }

  return "bg-white/[0.08] text-qz-text-2 ring-1 ring-inset ring-white/10";
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

export default async function QueueDashboardPage({
  params,
}: QueueDashboardPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { queueId } = await params;

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

  const data = await getQueueDashboard(queueId);

  if (!data) {
    return <p>Queue data not found.</p>;
  }

  const history = await getQueueHistory(queueId);

  if (!history) {
    return <p>Queue history not found.</p>;
  }

  const {
    queue: queueData,
    queueSession,
    waitingEntries,
    servingEntry,
    servedToday,
  } = data;

  return (
    <>
      <DashboardRealtime queueId={queueId} />

      <section className="mx-auto w-full max-w-[1500px] flex-1 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-qz-text-2">
                Queue Management
              </p>

              <span className="text-qz-text-3">·</span>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                  queueSession.status,
                )}`}
              >
                {getStatusLabel(queueSession.status)}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              {queueData.name}
            </h1>

            <p className="mt-1 text-sm text-qz-text-2">
              /{queueData.slug}
            </p>

            <p className="mt-3 text-sm text-qz-text-2">
              Manage customers and control your queue.
            </p>
          </div>

          <Link
            href="/dashboard/queues"
            className="inline-flex w-fit items-center rounded-xl border border-qz-line bg-qz-surface px-4 py-2.5 text-sm font-medium text-qz-text-2 transition hover:border-qz-line-strong hover:text-qz-text"
          >
            ← All Queues
          </Link>
        </header>

        {/* Stats */}
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-qz-line bg-qz-surface p-5">
            <p className="text-xs font-medium text-qz-text-2">
              People Waiting
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              {waitingEntries.length}
            </p>

            <p className="mt-1 text-xs text-qz-text-3">
              Customers currently in the queue
            </p>
          </div>

          <div className="rounded-2xl border border-qz-line bg-qz-surface p-5">
            <p className="text-xs font-medium text-qz-text-2">
              Now Serving
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              {servingEntry ? `#${servingEntry.tokenNumber}` : "#0"}
            </p>

            <p className="mt-1 text-xs text-qz-text-3">
              Current customer being served
            </p>
          </div>

          <div className="rounded-2xl border border-qz-line bg-qz-surface p-5">
            <p className="text-xs font-medium text-qz-text-2">
              Served Today
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              {servedToday}
            </p>

            <p className="mt-1 text-xs text-qz-text-3">
              Customers completed today
            </p>
          </div>
        </div>

        {/* Queue Operations */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Currently Serving */}
          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-qz-text-2">
                  Currently Serving
                </p>

                <p className="mt-1 text-xs text-qz-text-3">
                  Manage the customer currently being served.
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                  queueSession.status,
                )}`}
              >
                {getStatusLabel(queueSession.status)}
              </span>
            </div>

            {servingEntry ? (
              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-wide text-qz-text-3">
                  Token
                </p>

                <h2 className="mt-2 text-5xl font-semibold tracking-tight text-qz-text">
                  #{servingEntry.tokenNumber}
                </h2>

                <p className="mt-2 text-base font-medium text-qz-text-2">
                  {servingEntry.customerName}
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold tracking-tight text-qz-text">
                  No customer
                </h2>

                <p className="mt-2 text-sm text-qz-text-2">
                  There is currently nobody being served.
                </p>
              </div>
            )}

            <QueueControls
              queueId={queueId}
              queueStatus={queueSession.status}
            />
          </div>

          {/* Join Queue */}
          <div className="rounded-2xl border border-qz-line bg-qz-surface p-6 sm:p-7">
            <div>
              <p className="text-sm font-medium text-qz-text">
                Join Queue
              </p>

              <p className="mt-1 text-xs text-qz-text-2">
                Customers can scan this QR code to join.
              </p>
            </div>

            <div className="mt-6 flex justify-center rounded-xl border border-qz-line bg-qz-surface-2 p-3">
              <QueueQRCode
                businessSlug={business.slug}
                queueSlug={queue.slug}
              />
            </div>
          </div>
        </div>

        {/* Waiting Queue */}
        <div className="mt-10 rounded-2xl border border-qz-line bg-qz-surface p-8">
          <div>
            <h2 className="text-xl font-semibold text-qz-text">
              Waiting Queue
            </h2>

            <p className="mt-1 text-sm text-qz-text-2">
              Customers currently waiting to be served.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {waitingEntries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-qz-line bg-qz-surface-2 p-6 text-center">
                <p className="text-sm font-medium text-qz-text-2">
                  No customers waiting
                </p>

                <p className="mt-1 text-xs text-qz-text-2">
                  New customers will appear here when they join the queue.
                </p>
              </div>
            ) : (
              waitingEntries.map((entry) => (
                <div
                  key={entry._id.toString()}
                  className="flex items-center justify-between rounded-xl border border-qz-line bg-white/[0.04] px-5 py-4 transition hover:border-qz-line hover:bg-white/5"
                >
                  <div>
                    <p className="font-semibold text-qz-text">
                      #{entry.tokenNumber}
                    </p>

                    <p className="mt-1 text-sm text-qz-text-2">
                      {entry.customerName}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-500/12 px-2.5 py-1 text-[11px] font-medium text-amber-400">
                    Waiting
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Queue History */}
        <div className="mt-10 rounded-2xl border border-qz-line bg-qz-surface p-8">
          <div>
            <h2 className="text-xl font-semibold text-qz-text">
              Queue History
            </h2>

            <p className="mt-1 text-sm text-qz-text-2">
              Previous queue sessions.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-qz-line bg-qz-surface-2 p-6 text-center">
                <p className="text-sm font-medium text-qz-text-2">
                  No previous queue sessions yet
                </p>

                <p className="mt-1 text-xs text-qz-text-2">
                  Completed sessions will appear here.
                </p>
              </div>
            ) : (
              history.map(({ session, summary }) => (
                <div
                  key={session._id.toString()}
                  className="flex flex-col gap-4 rounded-xl border border-qz-line bg-white/[0.04] px-5 py-4 transition hover:border-qz-line hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-qz-text">
                      {session.dateKey}
                    </p>

                    <p className="mt-1 text-sm text-qz-text-2">
                      {summary.totalCustomers} customers ·{" "}
                      {summary.completed} completed · {summary.skipped} skipped
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/queue/${queueId}/history/${session.dateKey}`}
                    className="w-fit text-sm font-medium text-qz-text-2 transition hover:text-qz-text"
                  >
                    View details →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}