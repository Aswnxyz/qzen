export default function SettingsLoading() {
  return (
    <section className="p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <header>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-zinc-200" />

        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-zinc-100" />
      </header>

      <div className="mt-8 space-y-6">
        {/* Business Information */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-6 w-48 animate-pulse rounded bg-zinc-200" />

          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-zinc-100" />

          <div className="mt-6 space-y-5">
            {/* Business Name */}
            <div>
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
            </div>

            {/* Business Slug */}
            <div>
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
            </div>

            {/* Timezone */}
            <div>
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-6 w-44 animate-pulse rounded bg-zinc-200" />

          <div className="mt-2 h-4 w-60 animate-pulse rounded bg-zinc-100" />

          <div className="mt-6 space-y-5">
            {/* Email */}
            <div>
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
            </div>

            {/* Account Type */}
            <div>
              <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <div className="h-11 w-32 animate-pulse rounded-xl bg-zinc-200" />
        </div>
      </div>
    </section>
  );
}