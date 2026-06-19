import { cn } from "@/lib/cn";

type WaveTone = "blue" | "orange" | "paper" | "navy" | "white";

const toneClass: Record<WaveTone, string> = {
  blue: "fill-soky-blue",
  orange: "fill-soky-orange-deep",
  paper: "fill-soky-paper",
  navy: "fill-soky-navy",
  white: "fill-soky-white",
};

type WaveDividerProps = {
  className?: string;
  flip?: boolean;
  tone?: WaveTone;
};

export function WaveDivider({ className, flip = false, tone = "paper" }: WaveDividerProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none overflow-hidden leading-none", flip && "rotate-180", className)}
    >
      <svg
        className={cn("block h-10 w-[140%] -translate-x-[15%]", toneClass[tone])}
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
      >
        <path d="M0 50L60 58.7C120 67 240 85 360 78.7C480 73 600 43 720 34.7C840 27 960 39 1080 48C1200 57 1320 63 1380 66.7L1440 70V96H0V50Z" />
      </svg>
    </div>
  );
}
