export default function QueueDashboardLoading() {
  return (
    <section className="flex-1 p-8">
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-2 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
          </div>

          <div className="mt-3 h-9 w-56 animate-pulse rounded-lg bg-zinc-200" />

          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-zinc-100" />

          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-100" />
      </header>

      {/* Stats */}
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />

            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-zinc-200" />

            <div className="mt-2 h-3 w-44 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </div>

      {/* Queue Operations */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Currently Serving */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="h-5 w-36 animate-pulse rounded bg-zinc-200" />
              <div className="mt-2 h-3 w-64 animate-pulse rounded bg-zinc-100" />
            </div>

            <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-100" />
          </div>

          <div className="mt-8">
            <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
            <div className="mt-2 h-14 w-28 animate-pulse rounded-lg bg-zinc-200" />
            <div className="mt-2 h-5 w-32 animate-pulse rounded bg-zinc-100" />
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-wrap gap-3">
            <div className="h-10 w-24 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 w-24 animate-pulse rounded-xl bg-zinc-100" />
          </div>
        </div>

        {/* Join Queue / QR */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div>
            <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="mt-6 flex justify-center rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <div className="h-56 w-56 animate-pulse rounded-lg bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Waiting Queue */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/60 px-5 py-4"
            >
              <div>
                <div className="h-5 w-12 animate-pulse rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded bg-zinc-100" />
              </div>

              <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Queue History */}
      <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div>
          <div className="h-7 w-36 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="h-5 w-28 animate-pulse rounded bg-zinc-200" />
                <div className="mt-2 h-4 w-56 animate-pulse rounded bg-zinc-100" />
              </div>

              <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}