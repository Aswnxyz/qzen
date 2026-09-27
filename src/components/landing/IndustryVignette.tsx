import type { Industry } from "@/lib/landing";
import { hueClasses } from "@/lib/landing";

/**
 * Configuration vignette for one industry.
 * Shows how a business would *set up* Qzen — illustrative product UI,
 * never a live queue feed.
 */
export default function IndustryVignette({
  industry,
  onDark = false,
}: {
  industry: Industry;
  onDark?: boolean;
}) {
  const shell = onDark
    ? "border-line-dark-strong bg-ink-raise"
    : "border-line-light-strong bg-paper-3";
  const headText = onDark ? "text-on-dark" : "text-ink-text";
  const subText = onDark ? "text-on-dark-3" : "text-ink-text-3";
  const rowBg = onDark ? "bg-white/[0.03]" : "bg-paper";
  const border = onDark ? "border-line-dark" : "border-line-light";

  return (
    <div
      className={`overflow-hidden rounded-[18px] border shadow-[0_30px_70px_-40px_rgba(23,33,27,0.45)] ${shell}`}
    >
      {/* Window chrome */}
      <div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-qz-accent" />
          <span className={`font-mono text-[10px] font-medium uppercase tracking-[0.18em] ${subText}`}>
            Queue setup
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ring-1 ring-inset ${hueClasses[industry.hue]}`}
        >
          {industry.name.split(" ")[0]}
        </span>
      </div>

      <div className="px-4 pb-4 pt-4">
        <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${subText}`}>
          Active queues
        </p>

        <div className="mt-3 space-y-2">
          {industry.queues.map((queue, index) => (
            <div
              key={queue.name}
              className={`rounded-xl border px-3.5 py-3 ${border} ${rowBg}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className={`truncate text-[13.5px] font-semibold ${headText}`}>
                    {queue.name}
                  </p>
                  <p className={`mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${subText}`}>
                    {queue.point}
                  </p>
                </div>

                <span className="shrink-0 text-right">
                  <span
                    className={`block font-mono text-[11px] font-medium tabular-nums ${onDark ? "text-emerald-300" : "text-qzen-brand"}`}
                  >
                    {queue.pace.split(" / ")[0]}
                  </span>
                  <span className={`block font-mono text-[9px] uppercase tracking-[0.12em] ${subText}`}>
                    per {queue.pace.split(" / ")[1]}
                  </span>
                </span>
              </div>

              {/* progress hairline */}
              <div className={`mt-2.5 h-1 w-full overflow-hidden rounded-full ${onDark ? "bg-white/8" : "bg-line-light"}`}>
                <span
                  className={`block h-full rounded-full ${onDark ? "bg-qz-accent" : "bg-qzen-accent"}`}
                  style={{ width: `${[64, 41, 78][index] ?? 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p
          className={`mt-4 border-t pt-3 font-editorial text-[15px] italic leading-snug ${border} ${onDark ? "text-on-dark-2" : "text-ink-text-2"}`}
        >
          {industry.note}
        </p>
      </div>
    </div>
  );
}
