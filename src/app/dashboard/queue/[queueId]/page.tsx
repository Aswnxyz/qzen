import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
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
    <main className="flex min-h-screen bg-zinc-50">
      <DashboardRealtime queueId={queueId} />

      <DashboardSidebar />

      <section className="flex-1 p-8">
        <header>
          <p className="text-sm text-zinc-500">{business.name}</p>

          <h1 className="mt-1 text-3xl font-bold text-zinc-900">
            {queueData.name}
          </h1>

          <p className="mt-2 text-zinc-600">Queue Dashboard</p>
        </header>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-zinc-900">
            Customer QR Code
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Customers can scan this code to join the queue.
          </p>

          <div className="mt-6">
            <QueueQRCode businessSlug={business.slug} queueSlug={queue.slug} />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">People waiting</p>

            <p className="mt-2 text-3xl font-bold">{waitingEntries.length}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">Now serving</p>

            <p className="mt-2 text-3xl font-bold">
              {servingEntry ? `#${servingEntry.tokenNumber}` : "#0"}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">Served today</p>

            <p className="mt-2 text-3xl font-bold">{servedToday}</p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <p className="text-sm text-zinc-500">Currently serving</p>

          {servingEntry ? (
            <>
              <h2 className="mt-2 text-5xl font-bold text-zinc-900">
                #{servingEntry.tokenNumber}
              </h2>

              <p className="mt-2 text-zinc-600">{servingEntry.customerName}</p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-3xl font-bold text-zinc-900">
                No customer
              </h2>

              <p className="mt-2 text-zinc-600">
                There is currently nobody being served.
              </p>
            </>
          )}

          <QueueControls queueId={queueId} queueStatus={queueSession.status} />
        </div>

        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <h2 className="text-xl font-semibold text-zinc-900">Waiting queue</h2>

          <div className="mt-6 space-y-3">
            {waitingEntries.length === 0 ? (
              <p className="text-sm text-zinc-500">No customers waiting.</p>
            ) : (
              waitingEntries.map((entry) => (
                <div
                  key={entry._id.toString()}
                  className="flex items-center justify-between rounded-xl bg-zinc-50 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold">#{entry.tokenNumber}</p>

                    <p className="text-sm text-zinc-500">
                      {entry.customerName}
                    </p>
                  </div>

                  <span className="text-sm text-zinc-500">Waiting</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Queue History
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Previous queue sessions.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No previous queue sessions yet.
              </p>
            ) : (
              history.map(({ session, summary }) => (
                <div
                  key={session._id.toString()}
                  className="flex items-center justify-between rounded-xl bg-zinc-50 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {session.dateKey}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {summary.totalCustomers} customers · {summary.completed}{" "}
                      completed · {summary.skipped} skipped
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/queue/${queueId}/history/${session.dateKey}`}
                    className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
                  >
                    View details →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
