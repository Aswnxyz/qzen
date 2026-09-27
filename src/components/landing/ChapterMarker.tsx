"use client";

/**
 * Editorial chapter marker: a numbered mono label on a hairline.
 * Kept as a client component so sections can animate it in on scroll.
 */
export default function ChapterMarker({
  number,
  label,
  onDark = false,
}: {
  number: string;
  label: string;
  onDark?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${onDark ? "text-on-dark-3" : "text-ink-text-3"}`}
    >
      <span
        className={`font-mono text-[11px] font-medium tracking-[0.18em] ${
          onDark ? "text-signal" : "text-qzen-accent-strong"
        }`}
      >
        {number}
      </span>
      <span className="h-px w-8 bg-current opacity-40" />
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.22em]">
        {label}
      </span>
    </div>
  );
}
