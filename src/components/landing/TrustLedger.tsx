import { proofPoints, switchReasons } from "@/lib/landing";
import Reveal from "@/components/landing/Reveal";
import ChapterMarker from "@/components/landing/ChapterMarker";

/**
 * Act IV — credibility without fabricated logos or testimonials.
 * A spec sheet of product truths plus the reasons teams switch.
 */
export default function TrustLedger() {
  return (
    <div className="relative mx-auto w-full max-w-[1320px] px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-16">
      <div className="max-w-[720px]">
        <Reveal>
          <ChapterMarker number="05" label="Why teams switch" />
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-6 text-[clamp(2.1rem,5.2vw,3.4rem)] font-editorial leading-[1.02] tracking-[-0.02em] text-ink-text">
            The line leaves the doorway.
          </h2>
        </Reveal>
      </div>

      {/* Spec sheet */}
      <div className="mt-12 grid grid-cols-2 border-t border-l border-line-light lg:grid-cols-4">
        {proofPoints.map((point, index) => (
          <Reveal
            key={point.label}
            delay={index * 0.08}
            className="border-b border-r border-line-light"
          >
            <div className="px-5 py-7 sm:px-7 sm:py-9">
              <p className="font-editorial text-[clamp(2.5rem,6vw,3.75rem)] leading-none tracking-[-0.03em] text-ink-text">
                {point.value}
              </p>
              <p className="mt-3 font-mono text-[10.5px] uppercase leading-[1.5] tracking-[0.16em] text-ink-text-3">
                {point.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Reasons */}
      <div className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-3">
        {switchReasons.map((reason, index) => (
          <Reveal key={reason.title} delay={index * 0.1}>
            <div className="border-t-2 border-ink-text pt-5">
              <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-qzen-accent-strong">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink-text">
                {reason.title}
              </h3>

              <p className="mt-2.5 text-[15px] leading-[1.65] text-ink-text-2">
                {reason.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
