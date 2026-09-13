const steps = [
  {
    number: "01",
    title: "Business creates a queue",
    description:
      "Set up a queue for your clinic, salon, service center, or any walk-in service.",
  },
  {
    number: "02",
    title: "Customer scans the QR",
    description:
      "Customers scan the displayed QR code using their phone. No app or account required.",
  },
  {
    number: "03",
    title: "Customer gets a token",
    description:
      "Qzen instantly assigns a token and shows the customer's position in the queue.",
  },
  {
    number: "04",
    title: "Relax until your turn",
    description:
      "Customers can leave the waiting area and keep track of the queue from their phone.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-zinc-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Waiting doesn't have to feel like waiting.
          </h2>

          <p className="mt-4 text-lg leading-8 text-zinc-600">
            Qzen turns a traditional paper-token queue into a simple digital
            experience for both businesses and customers.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number}>
              <span className="text-sm font-semibold text-zinc-400">
                {step.number}
              </span>

              <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}