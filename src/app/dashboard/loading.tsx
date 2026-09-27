const kpiCardClasses = [
  "border-emerald-100 bg-emerald-50/60",
  "border-amber-100 bg-amber-50/60",
  "border-blue-100 bg-blue-50/60",
  "border-red-100 bg-red-50/60",
];

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1600px] p-6 sm:p-8 lg:p-10">
      {/* Greeting */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="w-full max-w-2xl">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-zinc-200" />

          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-zinc-100" />
        </div>

        <div className="h-5 w-36 animate-pulse rounded bg-zinc-100" />
      </section>

      {/* KPI Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCardClasses.map((cardClass, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-5 shadow-sm ${cardClass}`}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/70" />

              <div className="h-3 w-24 animate-pulse rounded bg-zinc-200/70" />
            </div>

            <div className="mt-4 h-10 w-20 animate-pulse rounded-lg bg-zinc-200" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-zinc-100" />
          </div>
        ))}
      </section>

      {/* Main Content */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
        {/* Activity */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row">
            <div>
              <div className="h-6 w-40 animate-pulse rounded bg-zinc-200" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-100" />
            </div>

            <div className="flex gap-4">
              <div className="h-4 w-14 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-14 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>

          <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-50 sm:h-72" />
        </div>

        {/* Active Queues */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100" />

          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-zinc-100" />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />

                      <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-3 sm:gap-4">
                      {Array.from({ length: 3 }).map((_, statIndex) => (
                        <div key={statIndex}>
                          <div className="h-2.5 w-10 animate-pulse rounded bg-zinc-100" />

                          <div className="mt-1.5 h-3.5 w-6 animate-pulse rounded bg-zinc-200" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Content */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
        {/* Your Queues */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 p-5 sm:p-6">
            <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-52 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="h-5 w-36 animate-pulse rounded bg-zinc-200" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-100" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="h-12 animate-pulse rounded-lg bg-zinc-50" />
                  <div className="h-12 animate-pulse rounded-lg bg-zinc-50" />
                  <div className="h-12 animate-pulse rounded-lg bg-zinc-50" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 p-5 sm:p-6">
            <div className="h-6 w-36 animate-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-5">
                <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-100" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
                  <div className="mt-2 h-3 w-44 animate-pulse rounded bg-zinc-100" />
                </div>

                <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}