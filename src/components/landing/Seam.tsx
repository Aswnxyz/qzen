/**
 * A short gradient bleed between two acts so dark and paper sections
 * read as one continuous experience.
 */
export default function Seam({
  from,
  className = "",
}: {
  from: "ink" | "paper" | "white";
  className?: string;
}) {
  const map = {
    ink: "qzl-seam-ink-to-paper",
    paper: "qzl-seam-paper-to-ink",
    white: "qzl-seam-white-to-ink",
  } as const;

  return (
    <div
      aria-hidden="true"
      className={`h-14 w-full sm:h-16 ${map[from]} ${className}`}
    />
  );
}
