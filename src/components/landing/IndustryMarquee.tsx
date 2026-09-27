import { marqueeWords } from "@/lib/landing";

/**
 * Full-bleed industry marquee sitting flush under the hero.
 * Pure CSS animation — duplicated track for a seamless loop.
 */
export default function IndustryMarquee() {
  const track = [...marqueeWords, ...marqueeWords];

  return (
    <div className="relative overflow-hidden border-b border-line-dark bg-ink py-5">
      <div className="qzl-fade-x">
        <div className="qzl-marquee">
          <div className="qzl-marquee-track flex w-max shrink-0 items-center gap-8 whitespace-nowrap sm:gap-10">
            {track.map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="flex shrink-0 items-center gap-8 sm:gap-10"
              >
                <span className="font-editorial text-[19px] leading-none text-on-dark-2 sm:text-[22px]">
                  {word}
                </span>
                <span
                  className="h-1 w-1 shrink-0 rounded-full bg-qz-accent/70"
                  aria-hidden="true"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
