const steps = [
  {
    number: "01",
    title: "Scan",
    description:
      "Open the queue link by scanning the QR code at your business.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <path d="M4 9V5a1 1 0 0 1 1-1h4" />
        <path d="M15 4h4a1 1 0 0 1 1 1v4" />
        <path d="M20 15v4a1 1 0 0 1-1 1h-4" />
        <path d="M9 20H5a1 1 0 0 1-1-1v-4" />
        <path d="M8 8h2v2H8z" />
        <path d="M14 8h2v2h-2z" />
        <path d="M8 14h2v2H8z" />
        <path d="M14 14h2v2h-2z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Join",
    description: "Enter your name and receive a digital token in seconds.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Relax",
    description:
      "Follow your live position and estimated wait from your phone.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Get served",
    description: "Return when your token is called—without the physical line.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.5 12 2.3 2.3 4.7-5" />
      </svg>
    ),
  },
];

function StepConnector() {
  return (
    <div
      className="pointer-events-none absolute -right-20 top-1/2 z-0 hidden h-16 w-24 -translate-y-1/2 lg:block"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 64"
        className="h-full w-full overflow-visible"
        fill="none"
      >
        <path
          d="M2 50 C25 50 28 14 52 14 C70 14 75 30 98 30"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="4 7"
          className="text-qzen-brand/45"
        />

        <circle cx="52" cy="14" r="5" className="fill-qzen-brand" />
      </svg>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-y border-qzen-border bg-qzen-surface-muted px-5 py-24 sm:px-8 sm:py-32">
      {/* Organic background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Main organic mint shape */}
        <svg
          viewBox="0 0 1440 700"
          preserveAspectRatio="none"
          className="absolute left-0 top-[18%] h-[78%] w-full"
          fill="none"
        >
          <path
            d="M-80 390
         C180 280 360 310 560 365
         C760 420 930 470 1120 425
         C1280 387 1380 315 1520 270
         L1520 760
         L-80 760
         Z"
            fill="currentColor"
            className="text-emerald-50"
          />
        </svg>

        {/* Soft white sweep over the upper part */}
        <svg
          viewBox="0 0 1440 700"
          preserveAspectRatio="none"
          className="absolute left-0 top-[23%] h-[60%] w-full"
          fill="none"
        >
          <path
            d="M-80 350
         C180 235 380 275 575 330
         C775 385 930 430 1120 390
         C1290 355 1390 280 1520 225
         L1520 0
         L-80 0
         Z"
            fill="currentColor"
            className="text-qzen-surface-muted"
          />
        </svg>

        {/* Very soft center light */}
        <div className="absolute left-1/2 top-[28%] h-[24rem] w-[42rem] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-qzen-brand">
            How it works
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-qzen-text sm:text-4xl lg:text-5xl">
            A better wait starts with one scan.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-qzen-text-secondary sm:text-lg sm:leading-8">
            A straightforward digital experience for customers and staff.
          </p>
        </div>

        {/* Simple as that */}
        <div
          className="pointer-events-none absolute right-0 top-0 hidden lg:block"
          aria-hidden="true"
        >
          <div className="flex items-start gap-1">
            <svg
              viewBox="0 0 100 90"
              className="mt-12 h-20 w-24 text-qzen-brand/60"
              fill="none"
            >
              <path
                d="M4 78 C18 48 45 25 90 8"
                stroke="currentColor"
                strokeWidth="1.4"
              />

              <path
                d="M79 10 L90 8 L85 19"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>

            <p className="-rotate-3 pt-1 font-serif text-xl italic leading-5 text-qzen-brand-strong">
              Simple
              <br />
              as that.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          <div className="mx-auto grid max-w-[1200px] gap-20 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-20">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <article className="group relative z-10 flex min-h-[300px] flex-col items-center rounded-[1.75rem] border border-qzen-border bg-qzen-surface px-6 py-7 text-center shadow-qzen-sm transition duration-300 hover:-translate-y-1 hover:shadow-qzen-md">
                  {/* Number */}
                  <span className="text-sm font-bold tracking-wide text-qzen-brand">
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className="mt-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-qzen-brand-soft text-qzen-brand-strong ring-8 ring-qzen-brand-soft/25 transition duration-300 group-hover:scale-105">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="mt-7 text-xl font-semibold tracking-[-0.025em] text-qzen-text">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-3 max-w-[15rem] text-sm leading-6 text-qzen-text-secondary">
                    {step.description}
                  </p>
                </article>

                {index < steps.length - 1 && <StepConnector />}
              </div>
            ))}
          </div>
        </div>

        {/* Less waiting. more living. */}
        <div
          className="pointer-events-none relative mx-auto mt-8 hidden max-w-[1200px] lg:block"
          aria-hidden="true"
        >
          <div className="absolute left-0 top-0 flex items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-qzen-brand" />

            <svg
              viewBox="0 0 150 24"
              className="h-6 w-36 text-qzen-brand/60"
              fill="none"
            >
              <path
                d="M3 12 C35 3 82 22 147 7"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>

            <p className="-rotate-2 font-serif text-lg italic leading-5 text-qzen-brand-strong">
              Less waiting.
              <br />
              more living.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
