export default function QueueHistoryLoading() {
  return (
    <section className="flex-1 p-8">
      {/* Back link */}
      <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />

      {/* Header */}
      <header className="mt-8">
        <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />

        <div className="mt-2 h-9 w-56 animate-pulse rounded-lg bg-zinc-200" />

        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-zinc-100" />
      </header>

      {/* Summary */}
      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-zinc-200 bg-white p-6"
          >
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />

            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-zinc-200" />
          </div>
        ))}
      </div>

      {/* Customer History */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />

          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl bg-zinc-50 px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-5 w-12 animate-pulse rounded bg-zinc-200" />

                  <div className="mt-2 h-4 w-28 animate-pulse rounded bg-zinc-100" />
                </div>

                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, timeIndex) => (
                  <div
                    key={timeIndex}
                    className="h-4 w-28 animate-pulse rounded bg-zinc-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session Information */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8">
        <div className="h-7 w-44 animate-pulse rounded bg-zinc-200" />

        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-4 w-64 animate-pulse rounded bg-zinc-100"
            />
          ))}
        </div>
      </div>
    </section>
  );
}