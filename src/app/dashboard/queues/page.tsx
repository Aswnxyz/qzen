import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";

function QueueIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="M8 6h6a4 4 0 0 1 4 4" />
        <path d="M6 8v8" />
        <path d="M8 18h6a4 4 0 0 0 4-4" />
      </svg>
    </div>
  );
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

      if (!queueSession) {
        return {
          queue,
          queueSession: null,
          waiting: 0,
          serving: null,
          servedToday: 0,
        };
      }

      const entries = await QueueEntry.find({
        queueId: queue._id,
        sessionId: queueSession._id,
      }).lean();

      const waiting = entries.filter(
        (entry) => entry.status === "waiting",
      ).length;

      const serving =
        entries.find((entry) => entry.status === "serving") ?? null;

      const servedToday = entries.filter(
        (entry) => entry.status === "completed",
      ).length;

      return {
        queue,
        queueSession,
        waiting,
        serving,
        servedToday,
      };
    }),
  );

  const activeQueueCount = queuesWithSessions.filter(
    ({ queueSession }) => queueSession?.status === "active",
  ).length;

  return (
    <section className="p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            Queues
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Manage and monitor all your queues.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500">
            <span>
              {queues.length} {queues.length === 1 ? "queue" : "queues"}
            </span>

            <span className="text-zinc-300">·</span>

            <span className="text-emerald-600">{activeQueueCount} active</span>
          </div>
        </div>

        <Link
          href="/dashboard/queues/new"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
        >
          <span className="text-base leading-none">+</span>
          Create Queue
        </Link>
      </header>

      {/* Queue List */}
      <div className="mt-8 space-y-4">
        {queues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <QueueIcon />
            </div>

            <h2 className="mt-4 text-base font-semibold text-zinc-900">
              No queues yet
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Create your first queue to start serving customers.
            </p>

            <Link
              href="/dashboard/queues/new"
              className="mt-5 inline-flex rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Create Queue
            </Link>
          </div>
        ) : (
          queuesWithSessions.map(
            ({ queue, queueSession, waiting, serving, servedToday }) => {
              const status = queueSession?.status ?? "closed";

              return (
                <div
                  key={queue._id.toString()}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    {/* Queue Identity */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <QueueIcon />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-sm font-semibold text-zinc-950">
                            {queue.name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          /{queue.slug}
                        </p>
                      </div>
                    </div>

                    {/* Queue Stats */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-zinc-100 pt-4 sm:grid-cols-4 sm:gap-x-10 sm:border-t-0 sm:pt-0 lg:min-w-[430px]">
                      <div>
                        <p className="text-[11px] text-zinc-500">Waiting</p>

                        <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                          {waiting}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-zinc-500">Serving</p>

                        <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                          {serving ? `#${serving.tokenNumber}` : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-zinc-500">
                          Served Today
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                          {servedToday}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] text-zinc-500">
                          Current Token
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                          {queueSession ? `#${queueSession.currentToken}` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end border-t border-zinc-100 pt-3 lg:min-w-[120px] lg:border-t-0 lg:pt-0">
                      <Link
                        href={`/dashboard/queue/${queue._id.toString()}`}
                        className="text-sm font-medium text-zinc-700 transition hover:text-zinc-950"
                      >
                        Open Queue →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            },
          )
        )}
      </div>
    </section>
  );
}
