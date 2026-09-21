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
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
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
    cardClass: "border-emerald-100/80 bg-emerald-50/30",
    iconClass: "bg-emerald-100/70 text-emerald-600",
    getValue: (stats: DashboardStatsData) => stats.totalCustomers,
  },
  {
    label: "Currently Waiting",
    description: "Customers in line",
    icon: WaitingIcon,
    cardClass: "border-amber-100/80 bg-amber-50/30",
    iconClass: "bg-amber-100/70 text-amber-600",
    getValue: (stats: DashboardStatsData) => stats.currentlyWaiting,
  },
  {
    label: "Served Today",
    description: "Completed customers",
    icon: CheckCircleIcon,
    cardClass: "border-blue-100/80 bg-blue-50/30",
    iconClass: "bg-blue-100/70 text-blue-600",
    getValue: (stats: DashboardStatsData) => stats.servedToday,
  },
  {
    label: "No-Shows",
    description: "Skipped customers",
    icon: NoShowIcon,
    cardClass: "border-red-100/80 bg-red-50/30",
    iconClass: "bg-red-100/70 text-red-500",
    getValue: (stats: DashboardStatsData) => stats.noShows,
  },
];

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${card.cardClass}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconClass}`}
              >
                <Icon />
              </div>

              <p className="text-sm font-medium text-zinc-700">
                {card.label}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-semibold tracking-tight text-zinc-950">
                {card.getValue(stats)}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}