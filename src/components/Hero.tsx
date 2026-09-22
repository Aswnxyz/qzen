import Link from "next/link";
import JoinQueueButton from "@/components/landing/JoinQueueButton";

interface HeroProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

export default function Hero({ isAuthenticated, hasBusiness }: HeroProps) {
  const createQueueDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  return (
    <section className="px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-qzen-border bg-qzen-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-qzen-brand-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-qzen-accent" />
            Smarter queue management
          </p>

          <h1 className="mt-6 text-5xl font-bold tracking-[-0.055em] text-qzen-text sm:text-6xl lg:text-7xl">
            Stop waiting.
            <span className="block text-qzen-brand">Know your turn.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-qzen-text-secondary sm:text-xl">
            Qzen lets customers join digitally, track their position, and get on
            with their day instead of waiting in line.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={createQueueDestination}
              className="inline-flex items-center justify-center rounded-qzen-md bg-qzen-brand px-6 py-3.5 text-sm font-semibold text-white shadow-qzen-md hover:bg-qzen-brand-strong"
            >
              Create a queue
            </Link>

            <JoinQueueButton />
          </div>

          <p className="mt-5 text-sm text-qzen-text-subtle">
            No app download required for your customers.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-qzen-xl border border-qzen-border bg-qzen-surface p-3 shadow-qzen-lg sm:p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-5 hidden h-14 w-14 sm:block"
            >
              <span className="absolute right-8 top-1 h-8 w-0.5 rotate-[25deg] rounded-full bg-qzen-brand" />

              <span className="absolute right-2 top-5 h-10 w-0.5 rotate-[55deg] rounded-full bg-qzen-brand" />

              <span className="absolute right-0 top-10 h-6 w-0.5 rotate-[75deg] rounded-full bg-qzen-brand" />
            </div>
            <div className="rounded-qzen-lg bg-qzen-brand-strong px-5 py-5 text-white sm:px-6">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-white/80">Qzen queue</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live
                </span>
              </div>

              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="text-sm text-white/70">Your token</p>
                  <p className="mt-1 text-6xl font-bold tracking-[-0.06em] sm:text-7xl">
                    #24
                  </p>
                </div>
                <p className="mb-2 text-right text-sm font-medium text-white/80">
                  General
                  <br />
                  consultation
                </p>
              </div>
            </div>

            <div className="grid gap-3 pt-3 sm:grid-cols-2 sm:pt-5">
              <div className="rounded-qzen-md bg-qzen-surface-muted p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-qzen-text-subtle">
                  Now serving
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-qzen-text">
                  #21
                </p>
              </div>
              <div className="rounded-qzen-md bg-qzen-brand-soft p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-qzen-brand-strong">
                  People ahead
                </p>
                <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-qzen-brand-strong">
                  3 people
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-qzen-md border border-qzen-border px-4 py-3.5 text-sm sm:mt-5">
              <span className="text-qzen-text-secondary">Estimated wait</span>
              <span className="font-semibold text-qzen-text">~12 min</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
