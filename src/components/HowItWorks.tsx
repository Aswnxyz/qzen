const steps = [
  {
    number: "01",
    title: "Scan",
    description:
      "Open the queue link by scanning the QR code at your business.",
  },
  {
    number: "02",
    title: "Join",
    description:
      "Enter your name and receive a digital token in seconds.",
  },
  {
    number: "03",
    title: "Relax",
    description:
      "Follow your live position and estimated wait from your phone.",
  },
  {
    number: "04",
    title: "Get served",
    description:
      "Return when your token is called—without the physical line.",
  },
];

export default function HowItWorks() {
  return (
    <section className="border-y border-qzen-border bg-qzen-surface-muted px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-qzen-brand">
            How it works
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.045em] text-qzen-text sm:text-4xl">
            A better wait starts with one scan.
          </h2>

          <p className="mt-4 text-lg leading-8 text-qzen-text-secondary">
            A straightforward digital experience for customers and staff.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <article
              key={step.number}
              className="rounded-qzen-lg border border-qzen-border bg-qzen-surface p-6 shadow-qzen-sm"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-qzen-md bg-qzen-brand-soft text-sm font-bold text-qzen-brand-strong">
                {step.number}
              </span>

              <h3 className="mt-6 text-qzen-title font-semibold tracking-[-0.02em] text-qzen-text">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-qzen-text-secondary">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
