import type { ReactNode } from "react";

type Tone = "dark" | "paper" | "muted" | "white";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Background act */
  tone?: Tone;
  /** Show the top hairline chapter rule */
  rule?: boolean;
  /** Chapter label shown on the rule, e.g. "WHO IT'S FOR" */
  chapter?: string;
  number?: string;
  /** Section label used by the header's scroll-spy */
  label?: string;
};

const toneClasses: Record<Tone, string> = {
  dark: "bg-ink text-on-dark",
  paper: "bg-paper text-ink-text",
  muted: "bg-paper-2 text-ink-text",
  white: "bg-paper-3 text-ink-text",
};

/**
 * One act of the landing page. Owns background tone, vertical rhythm,
 * optional chapter rule and the anchor id used by the header.
 */
export default function Section({
  id,
  children,
  className = "",
  tone = "paper",
  rule = false,
  chapter,
  number,
  label,
}: SectionProps) {
  const onDark = tone === "dark";

  return (
    <section
      id={id}
      data-label={label}
      className={`landing-section relative ${toneClasses[tone]} ${className}`}
    >
      {rule && (
        <div className="relative mx-auto w-full max-w-[1320px] px-5 sm:px-8">
          <div
            className={`h-px w-full ${onDark ? "bg-line-dark" : "bg-line-light"}`}
          />
          {(chapter || number) && (
            <div className="flex items-center gap-3 py-3">
              {number && (
                <span
                  className={`font-mono text-[11px] font-medium tracking-[0.18em] ${
                    onDark ? "text-signal" : "text-qzen-accent-strong"
                  }`}
                >
                  {number}
                </span>
              )}
              {chapter && (
                <span
                  className={`font-mono text-[11px] font-medium uppercase tracking-[0.22em] ${
                    onDark ? "text-on-dark-3" : "text-ink-text-3"
                  }`}
                >
                  {chapter}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
