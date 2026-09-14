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

export default function Features() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
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

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-qzen-lg border border-qzen-border bg-qzen-surface p-6 shadow-qzen-sm hover:-translate-y-0.5 hover:border-qzen-border-strong hover:shadow-qzen-md sm:p-8"
            >
              <span className="text-sm font-bold tracking-[0.14em] text-qzen-accent">
                {feature.number}
              </span>

              <h3 className="mt-8 text-qzen-title font-semibold tracking-[-0.025em] text-qzen-text">
                {feature.title}
              </h3>

              <p className="mt-3 max-w-sm leading-7 text-qzen-text-secondary">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
