import Link from "next/link";

type QueueItem = {
  queue: {
    _id: string;
    name: string;
    slug: string;
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

type YourQueuesProps = {
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

function getStatusClasses(status: string) {
  if (status === "active") {
    return "bg-qz-accent-soft text-emerald-300 ring-emerald-500/25";
  }

  if (status === "paused") {
    return "bg-amber-500/12 text-amber-400 ring-amber-500/25";
  }

  return "bg-white/[0.06] text-qz-text-2 ring-white/10";
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

export default function YourQueues({ queues }: YourQueuesProps) {
  return (
    <section className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
            <QueueIcon />
          </span>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-qz-text">
              Your Queues
            </h2>

            <p className="mt-1 text-sm text-qz-text-3">
              Overview of all your queues.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/queues"
          className="shrink-0 cursor-pointer text-sm font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          View all →
        </Link>
      </div>

      {queues.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-qz-line-strong bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-medium text-qz-text-2">No queues yet</p>

          <p className="mt-1 text-xs text-qz-text-3">
            Create your first queue to start serving customers.
          </p>

          <Link
            href="/dashboard/queues/new"
            className="mt-4 inline-flex cursor-pointer rounded-xl bg-qz-accent px-4 py-2.5 text-xs font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong"
          >
            Create Queue
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {queues.map((item) => (
            <div
              key={item.queue._id}
              className="rounded-2xl border border-qz-line bg-qz-surface-2/70 px-4 py-4 transition hover:border-qz-line-strong hover:bg-qz-surface-2"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Queue identity */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
                    <QueueIcon />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-qz-text">
                        {item.queue.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${getStatusClasses(
                          item.session.status,
                        )}`}
                      >
                        {getStatusLabel(item.session.status)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-qz-text-3">
                      /{item.queue.slug}
                    </p>
                  </div>
                </div>

                {/* Queue stats */}
                <div className="grid grid-cols-2 gap-4 border-t border-qz-line pt-3 sm:grid-cols-3 sm:gap-8 sm:border-t-0 sm:pt-0 lg:min-w-[280px]">
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

                {/* Action */}
                <Link
                  href={`/dashboard/queue/${item.queue._id}`}
                  className="shrink-0 cursor-pointer self-start rounded-lg bg-qz-accent-soft px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/25 transition hover:bg-emerald-500/25 lg:self-center"
                >
                  Open Queue →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
