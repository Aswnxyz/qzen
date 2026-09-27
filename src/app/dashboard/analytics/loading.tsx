export default function AnalyticsLoading() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {/* Page Header */}
      <header>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-9 w-36 animate-pulse rounded-lg bg-white/[0.12]" />

            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/[0.08]" />
          </div>

          <div className="h-10 w-40 animate-pulse rounded-xl bg-white/[0.08]" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="h-7 w-14 animate-pulse rounded-full bg-white/[0.12]" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/[0.08]" />
        </div>

        <div className="mt-4 h-4 w-36 animate-pulse rounded bg-white/[0.08]" />
      </header>

      {/* Overview */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-qz-line bg-qz-surface p-5"
          >
            <div className="h-4 w-28 animate-pulse rounded bg-white/[0.08]" />

            <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/[0.12]" />

            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-white/[0.08]" />
          </div>
        ))}
      </section>

      {/* Activity + Service Time */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        {/* Activity */}
        <div className="rounded-2xl border border-qz-line bg-qz-surface p-5 sm:p-6">
          <div>
            <div className="h-6 w-40 animate-pulse rounded bg-white/[0.12]" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/[0.08]" />
          </div>

          <div className="mt-6 h-72 animate-pulse rounded-xl bg-qz-surface-2 sm:h-80" />
        </div>

        {/* Average Service Time */}
        <div className="rounded-2xl border border-qz-line bg-qz-surface p-6">
          <div className="h-4 w-36 animate-pulse rounded bg-white/[0.08]" />

          <div className="mt-3 h-11 w-24 animate-pulse rounded-lg bg-white/[0.12]" />

          <div className="mt-2 h-4 w-52 animate-pulse rounded bg-white/[0.08]" />

          <div className="mt-6 border-t border-qz-line pt-5">
            <div className="h-3 w-36 animate-pulse rounded bg-white/[0.08]" />
          </div>
        </div>
      </section>

      {/* Queue Performance */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-qz-line bg-qz-surface">
        <div className="border-b border-qz-line p-5 sm:p-6">
          <div className="h-6 w-40 animate-pulse rounded bg-white/[0.12]" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/[0.08]" />
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="border-b border-qz-line bg-white/[0.04] px-5 py-3">
            <div className="grid grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-3 w-16 animate-pulse rounded bg-white/[0.12]"
                />
              ))}
            </div>
          </div>

          <div className="divide-y divide-qz-line">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="px-5 py-4">
                <div className="grid grid-cols-6 items-center gap-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-white/[0.12]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/[0.08]" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.08]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="divide-y divide-qz-line md:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.12]" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/[0.08]" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, statIndex) => (
                  <div key={statIndex}>
                    <div className="h-3 w-16 animate-pulse rounded bg-white/[0.08]" />
                    <div className="mt-2 h-4 w-10 animate-pulse rounded bg-white/[0.12]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}