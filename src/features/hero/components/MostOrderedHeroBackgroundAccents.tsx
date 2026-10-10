import Image from "next/image";

export function MostOrderedHeroBackgroundAccents() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-2 overflow-hidden"
      data-hero-most-ordered-accents
    >
      <Image
        src="/images/soky-purple-unified-arc.svg"
        alt=""
        width={566}
        height={1168}
        sizes="(orientation: portrait) 120vw, 34vw"
        unoptimized
        draggable={false}
        className={[
          "absolute h-auto w-auto max-w-none select-none",

          "max-md:portrait:left-[-8%]",
          "max-md:portrait:top-[-10%]",
          "max-md:portrait:h-[125%]",
          "max-md:portrait:w-auto",

          "md:portrait:left-[-5%]",
          "md:portrait:top-[-12%]",
          "md:portrait:h-[145%]",
          "md:portrait:w-auto",

          "landscape:left-[0%]",
          "landscape:top-[-12%]",
          "landscape:h-[125%]",
          "landscape:w-auto",

          "[@media(max-height:500px)_and_(orientation:landscape)]:left-[15%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:top-[-18%]",
          "[@media(max-height:500px)_and_(orientation:landscape)]:h-[136%]",
        ].join(" ")}
      />
    </div>
  );
}
