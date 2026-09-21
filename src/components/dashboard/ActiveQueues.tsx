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

function QueueStatusIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </div>
  );
}

export default function ActiveQueues({ queues }: ActiveQueuesProps) {
  const activeQueues = queues.filter(
    (item) => item.session.status === "active",
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Active Queues
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            What&apos;s happening right now.
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          {activeQueues.length} active
        </span>
      </div>

      {activeQueues.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
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
              className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4"
            >
              <div className="flex items-start gap-3">
                <QueueStatusIcon />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {item.queue.name}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                        <span className="text-xs font-medium text-emerald-700">
                          Open
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/queue/${item.queue._id}`}
                      className="shrink-0 text-xs font-medium text-zinc-600 transition hover:text-zinc-950"
                    >
                      Open Queue →
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 rounded-lg border border-zinc-200/80 bg-white">
                    <div className="px-3 py-2.5">
                      <p className="text-[11px] text-zinc-500">Waiting</p>

                      <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                        {item.waiting}
                      </p>
                    </div>

                    <div className="px-3 py-2.5">
                      <p className="text-[11px] text-zinc-500">Serving</p>

                      <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                        {item.serving
                          ? `#${item.serving.tokenNumber}`
                          : "—"}
                      </p>
                    </div>

                    <div className="px-3 py-2.5">
                      <p className="text-[11px] text-zinc-500">Served</p>

                      <p className="mt-0.5 text-sm font-semibold text-zinc-900">
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