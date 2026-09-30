import Link from "next/link";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Business from "@/models/Business";
import Queue from "@/models/Queue";
import QueueEntry from "@/models/QueueEntry";
import { getOrCreateQueueSession } from "@/lib/queueSession";
import QueueCard from "./QueueCard";

function QueueIcon() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-400">
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
    deletedAt: null,
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
    <section className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {/* Page Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
            Queues
          </h1>

          <p className="mt-2 text-sm text-qz-text-2">
            Manage and monitor all your queues.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-qz-text-2">
            <span>
              {queues.length} {queues.length === 1 ? "queue" : "queues"}
            </span>

            <span className="text-qz-text-3">·</span>

            <span className="text-emerald-400">{activeQueueCount} active</span>
          </div>
        </div>

        <Link
          href="/dashboard/queues/new"
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-qz-accent px-5 text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong"
        >
          <span className="text-base leading-none">+</span>
          Create Queue
        </Link>
      </header>

      {/* Queue List */}
      <div className="mt-8 space-y-4">
        {queues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-qz-line bg-qz-surface p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08]">
              <QueueIcon />
            </div>

            <h2 className="mt-4 text-base font-semibold text-qz-text">
              No queues yet
            </h2>

            <p className="mt-1 text-sm text-qz-text-2">
              Create your first queue to start serving customers.
            </p>

            <Link
              href="/dashboard/queues/new"
              className="mt-5 inline-flex rounded-xl bg-qz-accent px-4 py-2.5 text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong"
            >
              Create Queue
            </Link>
          </div>
        ) : (
          queuesWithSessions.map(
            ({ queue, queueSession, waiting, serving, servedToday }) => (
              <QueueCard
                key={queue._id.toString()}
                queueId={queue._id.toString()}
                name={queue.name}
                slug={queue.slug}
                status={queueSession?.status ?? "closed"}
                waiting={waiting}
                servingToken={serving ? serving.tokenNumber : null}
                servedToday={servedToday}
                currentToken={queueSession ? queueSession.currentToken : null}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}
