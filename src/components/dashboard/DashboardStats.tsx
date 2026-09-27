type DashboardStatsData = {
  totalCustomers: number;
  currentlyWaiting: number;
  servedToday: number;
  noShows: number;
};

type DashboardStatsProps = {
  stats: DashboardStatsData;
};

function CustomersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function WaitingIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function NoShowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

const cards = [
  {
    label: "Total Customers",
    description: "Customers today",
    icon: CustomersIcon,
    tile: "bg-emerald-500/12 text-emerald-400 ring-emerald-500/25",
    glow: "bg-emerald-500/25",
    line: "from-emerald-500/70",
    getValue: (stats: DashboardStatsData) => stats.totalCustomers,
  },
  {
    label: "Currently Waiting",
    description: "Customers in line",
    icon: WaitingIcon,
    tile: "bg-amber-500/12 text-amber-400 ring-amber-500/25",
    glow: "bg-amber-500/22",
    line: "from-amber-500/70",
    getValue: (stats: DashboardStatsData) => stats.currentlyWaiting,
  },
  {
    label: "Served Today",
    description: "Completed customers",
    icon: CheckCircleIcon,
    tile: "bg-blue-500/12 text-blue-400 ring-blue-500/25",
    glow: "bg-blue-500/22",
    line: "from-blue-500/70",
    getValue: (stats: DashboardStatsData) => stats.servedToday,
  },
  {
    label: "No-Shows",
    description: "Skipped customers",
    icon: NoShowIcon,
    tile: "bg-red-500/12 text-red-400 ring-red-500/25",
    glow: "bg-red-500/22",
    line: "from-red-500/70",
    getValue: (stats: DashboardStatsData) => stats.noShows,
  },
];

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-3xl border border-qz-line bg-qz-surface p-5"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full blur-3xl ${card.glow}`}
            />

            <div className="relative flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${card.tile}`}
              >
                <Icon />
              </span>

              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-qz-text-2">
                {card.label}
              </p>
            </div>

            <p className="relative mt-6 text-[2.75rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">
              {card.getValue(stats)}
            </p>

            <p className="relative mt-2.5 text-[13px] text-qz-text-3">
              {card.description}
            </p>

            <div
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r to-transparent ${card.line}`}
            />
          </article>
        );
      })}
    </section>
  );
}