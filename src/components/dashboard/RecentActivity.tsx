import type { ReactNode } from "react";

type ActivityType = "joined" | "called" | "completed" | "skipped";

type ActivityItem = {
  type: ActivityType;
  queueName: string;
  tokenNumber: number;
  customerName: string;
  timestamp: Date;
};

type RecentActivityProps = {
  recentActivity: ActivityItem[];
  getActivityIcon: (type: ActivityType) => ReactNode;
  getActivityText: (type: ActivityType) => string;
  formatActivityTime: (timestamp: Date) => string;
};

export default function RecentActivity({
  recentActivity,
  getActivityIcon,
  getActivityText,
  formatActivityTime,
}: RecentActivityProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">
          Recent Activity
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Latest queue events.
        </p>
      </div>

      {recentActivity.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No activity yet
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Queue activity will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-1">
          {recentActivity.map((item, index) => (
            <div
              key={`${item.type}-${item.tokenNumber}-${item.timestamp.getTime()}-${index}`}
              className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-zinc-50"
            >
              <div className="shrink-0">
                {getActivityIcon(item.type)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-zinc-700">
                  <span className="font-semibold text-zinc-950">
                    {item.customerName}
                  </span>{" "}
                  {getActivityText(item.type)}
                </p>

                <p className="mt-1 truncate text-xs text-zinc-400">
                  Token #{item.tokenNumber} · {item.queueName}
                </p>
              </div>

              <span className="shrink-0 pt-0.5 text-xs font-medium text-zinc-400">
                {formatActivityTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}