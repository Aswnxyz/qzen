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
    <svg
      width="18"
      height="18"
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
  );
}

export default function ActiveQueues({ queues }: ActiveQueuesProps) {
  const activeQueues = queues.filter(
    (item) => item.session.status === "active",
  );

  return (
    <section className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
            <QueueIcon />
          </span>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-qz-text">
              Active Queues
            </h2>

            <p className="mt-1 text-sm text-qz-text-3">
              What&apos;s happening right now.
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-qz-accent-soft px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/25 tabular-nums">
          {activeQueues.length} active
        </span>
      </div>

      {activeQueues.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-qz-line-strong bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-medium text-qz-text-2">
            No active queues
          </p>

          <p className="mt-1 text-xs text-qz-text-3">
            Your active queues will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {activeQueues.map((item) => (
            <div
              key={item.queue._id}
              className="rounded-2xl border border-qz-line bg-qz-surface-2/70 px-4 py-4 transition hover:border-qz-line-strong hover:bg-qz-surface-2"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full bg-qz-accent shadow-[0_0_10px_rgba(16,185,129,0.9)]"
                />

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                  <QueueIcon />
                </span>

                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-qz-text">
                  {item.queue.name}
                </p>

                <Link
                  href={`/dashboard/queue/${item.queue._id}`}
                  className="shrink-0 cursor-pointer rounded-lg bg-qz-accent-soft px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/25 transition hover:bg-emerald-500/25"
                >
                  Open Queue →
                </Link>
              </div>

              <div className="mt-3.5 grid grid-cols-3 gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div>
                  <p className="text-[11px] text-qz-text-3">Waiting</p>

                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-qz-text">
                    {item.waiting}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-qz-text-3">Serving</p>

                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-qz-text">
                    {item.serving ? `#${item.serving.tokenNumber}` : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-qz-text-3">Served</p>

                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-qz-text">
                    {item.servedToday}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
