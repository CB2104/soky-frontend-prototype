import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import { cn } from "@/lib/cn";
import { HeroMagicDots } from "./HeroMagicDots";

type HeroSliderControlsProps = {
  activeIndex: number;
  count: number;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
};

const arrowButtonClassName =
  "grid place-items-center rounded-full border border-soky-white/55 bg-soky-blue/45 text-soky-white shadow-[0_8px_20px_rgb(7_5_74_/_0.18)] transition-[background-color,border-color,transform,translate,scale] duration-200 hover:-translate-y-0.5 hover:border-soky-orange hover:bg-soky-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue active:scale-[0.98]";

export function HeroSliderControls({
  activeIndex,
  count,
  onNext,
  onPrevious,
  onSelect,
}: HeroSliderControlsProps) {
  return (
    <>
      <div className="pointer-events-auto absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:left-4">
        <button
          type="button"
          aria-label="Ver slide anterior"
          className={cn(arrowButtonClassName, "size-9")}
          onClick={onPrevious}
        >
          <ArrowRightIcon aria-hidden="true" className="size-4 rotate-180" />
        </button>
      </div>

      <div className="pointer-events-auto absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 md:block lg:right-4">
        <button
          type="button"
          aria-label="Ver slide siguiente"
          className={cn(arrowButtonClassName, "size-9")}
          onClick={onNext}
        >
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 flex justify-center px-4 md:bottom-5 lg:bottom-10">
        <div className="pointer-events-auto inline-flex min-h-10 max-w-[calc(100vw-2rem)] items-center gap-1 md:min-h-9 md:gap-1.5">
          <button
            type="button"
            aria-label="Ver slide anterior"
            className={cn(
              arrowButtonClassName,
              "size-10 border-soky-white/30 bg-soky-blue/30 shadow-[0_6px_14px_rgb(7_5_74_/_0.14)] md:hidden",
            )}
            onClick={onPrevious}
          >
            <ArrowRightIcon aria-hidden="true" className="size-3.5 rotate-180" />
          </button>

          <HeroMagicDots
            activeIndex={activeIndex}
            count={count}
            onSelect={onSelect}
          />

          <button
            type="button"
            aria-label="Ver slide siguiente"
            className={cn(
              arrowButtonClassName,
              "size-10 border-soky-white/30 bg-soky-blue/30 shadow-[0_6px_14px_rgb(7_5_74_/_0.14)] md:hidden",
            )}
            onClick={onNext}
          >
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
