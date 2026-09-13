const features = [
  {
    title: "No app required",
    description:
      "Customers scan a QR code and join the queue directly from their phone. No download or account required.",
  },
  {
    title: "Digital tokens",
    description:
      "Every customer receives a unique token and can see exactly where they are in the queue.",
  },
  {
    title: "Live updates",
    description:
      "Queue status updates automatically so customers always know when their turn is getting closer.",
  },
];

export default function Features() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Why Qzen
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            A better way to wait.
          </h2>

          <p className="mt-4 text-lg leading-8 text-zinc-600">
            Simple for customers. Powerful for businesses.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 p-8"
            >
              <h3 className="text-xl font-semibold text-zinc-900">
                {feature.title}
              </h3>

              <p className="mt-4 leading-7 text-zinc-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}