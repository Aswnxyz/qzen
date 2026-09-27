export default function QueuesLoading() {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      {/* Page Header */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-white/[0.12]" />

          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-white/[0.08]" />

          <div className="mt-4 flex items-center gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-4 w-2 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-4 w-20 animate-pulse rounded bg-white/[0.08]" />
          </div>
        </div>

        <div className="h-11 w-32 animate-pulse rounded-xl bg-white/[0.12]" />
      </header>

      {/* Queue List */}
      <div className="mt-8 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-qz-line bg-qz-surface p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Queue Identity */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-xl bg-white/[0.08]" />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-white/[0.12]" />
                    <div className="h-5 w-14 animate-pulse rounded-full bg-white/[0.08]" />
                  </div>

                  <div className="mt-2 h-3 w-40 animate-pulse rounded bg-white/[0.08]" />
                </div>
              </div>

              {/* Queue Stats */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-qz-line pt-4 sm:grid-cols-4 sm:gap-x-10 sm:border-t-0 sm:pt-0 lg:min-w-[430px]">
                {Array.from({ length: 4 }).map((_, statIndex) => (
                  <div key={statIndex}>
                    <div className="h-3 w-16 animate-pulse rounded bg-white/[0.08]" />
                    <div className="mt-2 h-4 w-8 animate-pulse rounded bg-white/[0.12]" />
                  </div>
                ))}
              </div>

              {/* Action */}
              <div className="flex justify-end border-t border-qz-line pt-3 lg:min-w-[120px] lg:border-t-0 lg:pt-0">
                <div className="h-4 w-24 animate-pulse rounded bg-white/[0.08]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}