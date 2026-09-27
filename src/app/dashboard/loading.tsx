export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-qz-line bg-qz-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full max-w-2xl">
            <div className="h-3 w-32 animate-pulse rounded bg-white/[0.08]" />

            <div className="mt-4 h-10 w-96 max-w-full animate-pulse rounded-lg bg-white/[0.1]" />

            <div className="mt-3.5 h-4 w-72 max-w-full animate-pulse rounded bg-white/[0.06]" />
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden h-10 w-40 animate-pulse rounded-lg bg-white/[0.06] sm:block" />

            <div className="h-11 w-36 animate-pulse rounded-xl bg-white/[0.08]" />
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-3xl border border-qz-line bg-qz-surface p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            </div>

            <div className="mt-6 h-11 w-24 animate-pulse rounded-lg bg-white/[0.1]" />
            <div className="mt-3 h-3.5 w-32 animate-pulse rounded bg-white/[0.06]" />
          </div>
        ))}
      </section>

      {/* Main Content */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.9fr)]">
        {/* Activity */}
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

              <div>
                <div className="h-4 w-40 animate-pulse rounded bg-white/[0.1]" />
                <div className="mt-2.5 h-3.5 w-64 max-w-full animate-pulse rounded bg-white/[0.06]" />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>

          <div className="mt-5 h-[300px] animate-pulse rounded-2xl bg-white/[0.03] sm:h-[340px]" />
        </div>

        {/* Active Queues */}
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

              <div>
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.1]" />
                <div className="mt-2.5 h-3.5 w-48 animate-pulse rounded bg-white/[0.06]" />
              </div>
            </div>

            <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-qz-line bg-qz-surface-2/70 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-white/[0.2]" />

                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

                  <div className="h-4 flex-1 animate-pulse rounded bg-white/[0.1]" />

                  <div className="h-7 w-24 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                  {Array.from({ length: 3 }).map((_, statIndex) => (
                    <div key={statIndex}>
                      <div className="h-2.5 w-10 animate-pulse rounded bg-white/[0.06]" />

                      <div className="mt-1.5 h-3.5 w-6 animate-pulse rounded bg-white/[0.1]" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Content */}
      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
        {/* Your Queues */}
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

              <div>
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.1]" />
                <div className="mt-2.5 h-3.5 w-52 animate-pulse rounded bg-white/[0.06]" />
              </div>
            </div>

            <div className="h-4 w-16 shrink-0 animate-pulse rounded bg-white/[0.06]" />
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-qz-line bg-qz-surface-2/70 px-4 py-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-white/[0.1]" />

                        <div className="h-5 w-14 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />
                      </div>

                      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-qz-line pt-3 sm:grid-cols-3 sm:gap-8 sm:border-t-0 sm:pt-0 lg:min-w-[280px]">
                    {Array.from({ length: 3 }).map((_, statIndex) => (
                      <div key={statIndex}>
                        <div className="h-2.5 w-10 animate-pulse rounded bg-white/[0.06]" />

                        <div className="mt-1.5 h-3.5 w-6 animate-pulse rounded bg-white/[0.1]" />
                      </div>
                    ))}
                  </div>

                  <div className="h-7 w-24 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

            <div>
              <div className="h-4 w-36 animate-pulse rounded bg-white/[0.1]" />
              <div className="mt-2.5 h-3.5 w-48 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </div>

          <div className="mt-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative flex items-start gap-3 rounded-xl px-2 py-3"
              >
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/[0.08]" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-40 max-w-full animate-pulse rounded bg-white/[0.1]" />

                  <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
                </div>

                <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
