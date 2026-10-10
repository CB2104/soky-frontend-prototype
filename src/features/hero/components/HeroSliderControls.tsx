import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import { HeroProgressDots } from "./HeroProgressDots";

type HeroSliderControlsProps = {
  activeIndex: number;
  autoplayDurationMs: number;
  autoplayResetKey: number;
  count: number;
  isAutoplayRunning: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
};

const MAX_VISIBLE_PROGRESS_DOTS = 7;

const fractionArrowClassName = `
  grid size-11 place-items-center rounded-full
  text-soky-white/80
  transition-colors duration-200
  hover:bg-soky-white/10
  hover:text-soky-white
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-soky-focus
  focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue
`;

export function HeroSliderControls({
  activeIndex,
  autoplayDurationMs,
  autoplayResetKey,
  count,
  isAutoplayRunning,
  onNext,
  onPrevious,
  onSelect,
}: HeroSliderControlsProps) {
  const shouldUseFraction = count > MAX_VISIBLE_PROGRESS_DOTS;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 flex justify-center px-4 md:bottom-2 xl:bottom-10 [@media(max-height:500px)_and_(orientation:landscape)]:bottom-[calc(env(safe-area-inset-bottom)+0.25rem)]"
      data-hero-controls
    >
      <div className="pointer-events-auto">
        {shouldUseFraction ? (
          <div
            role="group"
            aria-label="Controles del carrusel"
            className="
              inline-flex items-center gap-1 rounded-full
              border border-soky-white/15
              bg-soky-navy/15
              p-1 backdrop-blur-sm
            "
          >
            <button
              type="button"
              aria-label="Ver slide anterior"
              className={fractionArrowClassName}
              onClick={onPrevious}
            >
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4 rotate-180"
              />
            </button>

            <span
              aria-label={`Slide ${activeIndex + 1} de ${count}`}
              className="
                min-w-16 text-center text-sm font-bold
                tabular-nums text-soky-white
              "
            >
              <span aria-hidden="true">
                <span className="text-soky-orange">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>

                <span className="mx-1 text-soky-white/35">/</span>

                <span className="text-soky-white/75">
                  {String(count).padStart(2, "0")}
                </span>
              </span>
            </span>

            <button
              type="button"
              aria-label="Ver slide siguiente"
              className={fractionArrowClassName}
              onClick={onNext}
            >
              <ArrowRightIcon aria-hidden="true" className="size-4" />
            </button>
          </div>
        ) : (
          <HeroProgressDots
            activeIndex={activeIndex}
            autoplayDurationMs={autoplayDurationMs}
            autoplayResetKey={autoplayResetKey}
            count={count}
            isAutoplayRunning={isAutoplayRunning}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
