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
    <section className="rounded-3xl border border-qz-line bg-qz-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qz-accent-soft text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-qz-accent shadow-[0_0_8px_rgba(16,185,129,0.9)]"
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>

          <div>
            <h2 className="text-base font-semibold tracking-tight text-qz-text">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-qz-text-3">
              Latest queue events.
            </p>
          </div>
        </div>
      </div>

      {recentActivity.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-qz-line-strong bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-medium text-qz-text-2">
            No activity yet
          </p>

          <p className="mt-1 text-xs text-qz-text-3">
            Queue activity will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {recentActivity.map((item, index) => (
            <div
              key={`${item.type}-${item.tokenNumber}-${item.timestamp.getTime()}-${index}`}
              className="relative flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-white/[0.03]"
            >
              {/* Timeline rail */}
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[25.5px] top-0 h-3 w-px bg-qz-line"
                />
              )}

              {index < recentActivity.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-[25.5px] top-12 w-px bg-qz-line"
                />
              )}

              <div className="relative shrink-0">{getActivityIcon(item.type)}</div>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-qz-text-2">
                  <span className="font-semibold text-qz-text">
                    {item.customerName}
                  </span>{" "}
                  {getActivityText(item.type)}
                </p>

                <p className="mt-1 truncate text-xs text-qz-text-3">
                  Token #{item.tokenNumber} · {item.queueName}
                </p>
              </div>

              <span className="shrink-0 pt-0.5 text-xs font-medium tabular-nums text-qz-text-3">
                {formatActivityTime(item.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
