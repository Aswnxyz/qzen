const features = [
  {
    number: "01",
    title: "Live queue position",
    description:
      "Customers see their token and exactly where they stand in the queue.",
  },
  {
    number: "02",
    title: "Estimated wait time",
    description:
      "A clear estimate helps people plan their time with confidence.",
  },
  {
    number: "03",
    title: "Real-time updates",
    description:
      "Every call, pause, and update is reflected as the queue moves.",
  },
  {
    number: "04",
    title: "Simple staff management",
    description:
      "Staff can call the next customer and keep service moving from one view.",
  },
];

function QueuePositionVisual() {
  return (
    <div className="absolute bottom-[-16px] right-3 h-32 w-24 rotate-[-7deg] rounded-[20px] border border-emerald-100 bg-white p-2.5 shadow-qzen-md sm:bottom-[-20px] sm:right-6 sm:h-36 sm:w-28 sm:p-3">
      <div className="rounded-xl bg-qzen-brand-soft p-2.5 sm:p-3">
        <p className="text-[6px] font-medium text-qzen-text-secondary sm:text-[7px]">
          Your token
        </p>

        <p className="mt-1 text-xl font-bold tracking-tight text-qzen-brand sm:text-2xl">
          #24
        </p>
      </div>

      <div className="mt-2.5 sm:mt-3">
        <p className="text-[6px] text-qzen-text-secondary sm:text-[7px]">
          People ahead
        </p>

        <div className="mt-1.5 flex gap-1 sm:mt-2">
          {[1, 2, 3].map((item) => (
            <span
              key={item}
              className="flex h-4 w-4 items-center justify-center rounded-full bg-qzen-brand-soft text-[6px] font-bold text-qzen-brand sm:h-5 sm:w-5 sm:text-[7px]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WaitTimeVisual() {
  return (
    <div className="absolute bottom-5 right-3 w-36 rounded-2xl border border-emerald-100 bg-white p-3 shadow-qzen-md sm:bottom-6 sm:right-6 sm:w-48 sm:p-3.5">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qzen-brand-soft sm:h-9 sm:w-9">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-qzen-brand sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>

        <div>
          <p className="text-[7px] text-qzen-text-secondary sm:text-[8px]">
            Estimated wait
          </p>

          <p className="mt-0.5 text-sm font-bold tracking-tight text-qzen-brand sm:text-base">
            ~12 min
          </p>
        </div>
      </div>
    </div>
  );
}

function RealtimeVisual() {
  return (
    <div className="absolute bottom-5 right-3 w-40 rounded-2xl border border-emerald-100 bg-white p-3 shadow-qzen-md sm:bottom-6 sm:right-6 sm:w-52 sm:p-3.5">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qzen-brand-soft sm:h-9 sm:w-9">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-qzen-brand sm:h-5 sm:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>

          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-qzen-brand sm:h-2.5 sm:w-2.5" />
        </div>

        <div>
          <p className="text-[7px] font-semibold text-qzen-text sm:text-[8px]">
            Queue updated
          </p>

          <p className="mt-1 text-[7px] text-qzen-text-secondary sm:text-[8px]">
            You&apos;re now #24
          </p>
        </div>
      </div>
    </div>
  );
}

function StaffManagementVisual() {
  return (
    <div className="absolute bottom-4 right-3 w-40 rounded-2xl border border-emerald-100 bg-white p-2 shadow-qzen-md sm:bottom-5 sm:right-6 sm:w-48 sm:p-2.5">
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex items-center justify-between rounded-lg bg-qzen-brand-soft px-2.5 py-1.5 sm:px-3">
          <span className="text-[7px] font-semibold text-qzen-text sm:text-[8px]">
            Call next
          </span>

          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-qzen-brand text-[6px] text-white sm:h-5 sm:w-5 sm:text-[7px]">
            ▶
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-qzen-border px-2.5 py-1.5 sm:px-3">
          <span className="text-[7px] font-medium text-qzen-text sm:text-[8px]">
            Complete
          </span>

          <span className="text-[9px] font-bold text-qzen-brand sm:text-[10px]">
            ✓
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-qzen-border px-2.5 py-1.5 sm:px-3">
          <span className="text-[7px] font-medium text-qzen-text sm:text-[8px]">
            Skip
          </span>

          <span className="text-[9px] font-bold text-qzen-text-secondary sm:text-[10px]">
            →
          </span>
        </div>
      </div>
    </div>
  );
}

function FeatureVisual({ number }: { number: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft corner glow */}
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-50 blur-2xl" />

      {/* Decorative line + dot */}
      <div className="absolute right-7 top-7 h-2 w-2 rounded-full bg-qzen-brand/40" />

      <div className="absolute right-10 top-11 h-px w-12 bg-emerald-100" />

      {number === "01" && <QueuePositionVisual />}
      {number === "02" && <WaitTimeVisual />}
      {number === "03" && <RealtimeVisual />}
      {number === "04" && <StaffManagementVisual />}
    </div>
  );
}

export default function Features() {
  return (
    <section className="border-t border-qzen-border bg-qzen-surface-muted px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-qzen-brand">
            Built for better service
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-qzen-text sm:text-4xl">
            Everything a modern queue needs.
          </h2>

          <p className="mt-4 text-lg leading-8 text-qzen-text-secondary">
            Less uncertainty for customers. Less friction for your team.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group relative min-h-72 overflow-hidden rounded-qzen-lg border border-qzen-border bg-qzen-surface p-5 shadow-qzen-sm transition duration-300 hover:-translate-y-1 hover:border-qzen-border-strong hover:shadow-qzen-md sm:min-h-64 sm:p-7"
            >
              {/* Number */}
              <span className="relative z-10 text-sm font-bold tracking-[0.14em] text-qzen-accent">
                {feature.number}
              </span>

              {/* Floating visual */}
              <FeatureVisual number={feature.number} />

              {/* Feature content */}
              <div className="absolute bottom-5 left-5 z-10 max-w-[48%] sm:bottom-7 sm:left-7 sm:max-w-[55%]">
                <h3 className="text-qzen-title font-semibold tracking-[-0.025em] text-qzen-text">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-qzen-text-secondary">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Built for what's next */}
        <div className="mt-10 flex justify-end pr-2 sm:mt-12 sm:pr-8">
          <div className="relative">
            <div className="absolute -left-20 top-1/2 hidden h-px w-16 -rotate-12 bg-emerald-500/60 sm:block" />

            <div className="absolute -left-24 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-qzen-brand sm:block" />

            <p className="font-serif text-xl italic leading-5 text-qzen-brand sm:text-2xl">
              Built for
              <br />
              what&apos;s next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}