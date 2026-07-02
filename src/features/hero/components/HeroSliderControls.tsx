import { ArrowRightIcon } from "@/components/brand/IconsSVG";
import { cn } from "@/lib/cn";
import { HeroMagicDots } from "./HeroMagicDots";

type HeroSliderControlsPlacement = "desktop-overlay" | "mobile-inline";

type HeroSliderControlsProps = {
  activeIndex: number;
  count: number;
  onNext: () => void;
  onPrevious: () => void;
  onSelect: (index: number) => void;
  placement?: HeroSliderControlsPlacement;
};

const arrowButtonClassName =
  "grid place-items-center rounded-full border border-soky-white/55 bg-soky-blue/45 text-soky-white shadow-[0_8px_20px_rgb(7_5_74_/_0.18)] transition-[background-color,border-color,transform,translate,scale] duration-200 hover:-translate-y-0.5 hover:border-soky-orange hover:bg-soky-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue active:scale-[0.98]";

function HeroSliderStaticDots({
  activeIndex,
  count,
  onSelect,
}: Pick<HeroSliderControlsProps, "activeIndex" | "count" | "onSelect">) {
  return (
    <nav
      aria-label="Slides del hero"
      className="inline-flex min-h-10 items-center gap-0 rounded-full border border-soky-white/35 bg-soky-navy/50 px-1 py-0.5 shadow-[0_8px_18px_rgb(7_5_74_/_0.18)]"
    >
      {Array.from({ length: count }, (_, index) => {
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            aria-current={isActive ? "page" : undefined}
            aria-label={
              isActive
                ? `Slide ${index + 1} de ${count} activo`
                : `Ver slide ${index + 1} de ${count}`
            }
            className={cn(
              "relative grid size-10 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soky-focus focus-visible:ring-offset-2 focus-visible:ring-offset-soky-blue",
              isActive ? "cursor-default" : "hover:bg-soky-white/12",
            )}
            onClick={() => onSelect(index)}
          >
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-2 top-1/2 h-5 -translate-y-1/2 rounded-full bg-soky-orange shadow-[0_4px_12px_rgb(239_91_36_/_0.35)]"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 block rounded-full border transition-[background-color,border-color,transform] duration-200",
                isActive
                  ? "size-2 border-soky-white bg-soky-white"
                  : "size-2 border-soky-white/75 bg-soky-white/30",
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}

export function HeroSliderControls({
  activeIndex,
  count,
  onNext,
  onPrevious,
  onSelect,
  placement = "desktop-overlay",
}: HeroSliderControlsProps) {
  if (placement === "mobile-inline") {
    return (
      <div className="flex justify-center md:hidden">
        <div className="inline-flex min-h-10 max-w-[calc(100vw-2rem)] items-center gap-1">
          <button
            type="button"
            aria-label="Ver slide anterior"
            className={cn(
              arrowButtonClassName,
              "size-10 border-soky-white/30 bg-soky-blue/30 shadow-[0_6px_14px_rgb(7_5_74_/_0.14)]",
            )}
            onClick={onPrevious}
          >
            <ArrowRightIcon aria-hidden="true" className="size-3.5 rotate-180" />
          </button>

          <HeroSliderStaticDots
            activeIndex={activeIndex}
            count={count}
            onSelect={onSelect}
          />

          <button
            type="button"
            aria-label="Ver slide siguiente"
            className={cn(
              arrowButtonClassName,
              "size-10 border-soky-white/30 bg-soky-blue/30 shadow-[0_6px_14px_rgb(7_5_74_/_0.14)]",
            )}
            onClick={onNext}
          >
            <ArrowRightIcon aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

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

      <div className="pointer-events-none absolute inset-x-0 z-30 hidden justify-center px-4 md:bottom-5 md:flex lg:bottom-10">
        <div className="pointer-events-auto inline-flex min-h-9 max-w-[calc(100vw-2rem)] items-center gap-1.5">
          <HeroMagicDots
            activeIndex={activeIndex}
            count={count}
            onSelect={onSelect}
          />
        </div>
      </div>
    </>
  );
}
