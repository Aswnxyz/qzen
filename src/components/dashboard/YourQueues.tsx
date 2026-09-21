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

export default function YourQueues({ queues }: YourQueuesProps) {
  return (
    <section className=" rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Your Queues
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Overview of all your queues.
          </p>
        </div>

        <Link
          href="/dashboard/queues"
          className="shrink-0 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          View all →
        </Link>
      </div>

      {queues.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No queues yet
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Create your first queue to start serving customers.
          </p>

          <Link
            href="/dashboard/queues/new"
            className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            Create Queue
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {queues.map((item) => (
            <div
              key={item.queue._id}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Queue identity */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <QueueIcon />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-900">
                        {item.queue.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                          item.session.status,
                        )}`}
                      >
                        {getStatusLabel(item.session.status)}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      /{item.queue.slug}
                    </p>
                  </div>
                </div>

                {/* Queue stats */}
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-3 sm:grid-cols-3 sm:gap-8 sm:border-t-0 sm:pt-0 lg:min-w-[280px]">
                  <div>
                    <p className="text-[11px] text-zinc-500">
                      Waiting
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                      {item.waiting}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-zinc-500">
                      Serving
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                      {item.serving
                        ? `#${item.serving.tokenNumber}`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-zinc-500">
                      Served
                    </p>

                    <p className="mt-0.5 text-sm font-semibold text-zinc-900">
                      {item.servedToday}
                    </p>
                  </div>
                </div>

                {/* Action */}
                <Link
                  href={`/dashboard/queue/${item.queue._id}`}
                  className="shrink-0 text-sm font-medium text-zinc-700 transition hover:text-zinc-950"
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