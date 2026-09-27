import Link from "next/link";

type QueueItem = {
  queue: {
    _id: string;
    name: string;
  };
  session: {
    status: string;
  };
  waiting: number;
  serving: {
    tokenNumber: number;
  } | null;
  servedToday: number;
};

type ActiveQueuesProps = {
  queues: QueueItem[];
};

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
        <path d="M8 6h6a4 4 0 0 1 4 4v0" />
        <path d="M6 8v8" />
        <path d="M8 18h6a4 4 0 0 0 4-4v0" />
      </svg>
    </div>
  );
}

export default function ActiveQueues({ queues }: ActiveQueuesProps) {
  const activeQueues = queues.filter(
    (item) => item.session.status === "active",
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">
            Active Queues
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            What&apos;s happening right now.
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {activeQueues.length} active
        </span>
      </div>

      {activeQueues.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No active queues
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Your active queues will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {activeQueues.map((item) => (
            <div
              key={item.queue._id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <QueueIcon />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.queue.name}
                    </p>

                    <Link
                      href={`/dashboard/queue/${item.queue._id}`}
                      className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
                    >
                      Open Queue →
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-3 sm:gap-4">
                    <div>
                      <p className="text-[11px] text-zinc-500">Waiting</p>

                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900">
                        {item.waiting}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-zinc-500">Serving</p>

                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900">
                        {item.serving
                          ? `#${item.serving.tokenNumber}`
                          : "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-zinc-500">Served</p>

                      <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900">
                        {item.servedToday}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}