import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import { getOrCreateQueueSession } from "@/lib/queueSession";

export default async function QueuesPage() {
  const session = await getSession();

  if (!session) {
    return <p>You are not logged in.</p>;
  }

  await connectDB();

  const business = await Business.findOne({
    ownerId: session.user.id,
  }).lean();

  if (!business) {
    return <p>Business not found.</p>;
  }

  const queues = await Queue.find({
    businessId: business._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const queuesWithSessions = await Promise.all(
    queues.map(async (queue) => {
      const queueSession = await getOrCreateQueueSession(queue._id.toString());

      return {
        queue,
        queueSession,
      };
    }),
  );

  return (
    <main className="flex min-h-screen bg-zinc-50">
      <DashboardSidebar />

      <section className="flex-1 p-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Queue Management</p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-900">
              Your queues
            </h1>

            <p className="mt-2 text-zinc-600">
              Manage the queues for {business.name}.
            </p>
          </div>

          <Link
            href="/dashboard/queues/new"
            className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Create Queue
          </Link>
        </header>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {queues.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8">
              <p className="text-zinc-500">You don&apos;t have any queues yet.</p>
            </div>
          ) : (
            queuesWithSessions.map(({ queue, queueSession }) => (
              <Link
                key={queue._id.toString()}
                href={`/dashboard/queue/${queue._id.toString()}`}
                className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900">
                      {queue.name}
                    </h2>

                    <p className="mt-2 text-sm text-zinc-500">/{queue.slug}</p>
                  </div>

                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                    {queueSession?.status}
                  </span>
                </div>

                <div className="mt-6 flex justify-between text-sm text-zinc-500">
                  <span>Current token</span>

                  <span className="font-semibold text-zinc-900">
                    #{queueSession?.currentToken}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
