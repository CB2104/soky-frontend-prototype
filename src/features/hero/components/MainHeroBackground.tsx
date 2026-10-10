import { cn } from "@/lib/cn";

type MainHeroBackgroundProps = {
  mirrored?: boolean;
  polished?: boolean;
  patternIdPrefix: string;
};

const MainHeroBackground = ({
  mirrored = false,
  polished = false,
  patternIdPrefix,
}: MainHeroBackgroundProps) => {
  const portraitPatternId = `${patternIdPrefix}-cloud-pattern-portrait`;

  const landscapePatternId = `${patternIdPrefix}-cloud-pattern-landscape`;
  const portraitToneId = `${patternIdPrefix}-blue-tone-portrait`;
  const landscapeToneId = `${patternIdPrefix}-blue-tone-landscape`;

  const TOP_BLUE_SHAPE =
    "M0 0H1808V445C1648 288 1493 168 1240 132C1027 102 821 111 635 153C416 203 205 219 0 178V0Z";
  const PATTERN_BLUE_SHAPE =
    "M0 165C230 151 412 104 650 72C1005 25 1321 92 1557 275C1704 390 1787 520 1808 606C1821 716 1707 789 1526 824C1303 867 1091 807 890 808C653 809 489 858 295 832C155 813 60 765 0 710V165Z";
  const ORANGE_BOTTOM_SHAPE =
    "M0 657C326 729 586 788 843 793C1237 800 1536 589 1808 208V869H0V657Z";
  const PORTRAIT_TOP_BLUE_SHAPE =
    "M0 0H968V610C820 530 710 315 515 295C330 276 205 418 0 345V0Z";
  const PORTRAIT_PATTERN_BLUE_SHAPE =
    "M0 315C185 405 315 225 515 270C730 320 838 548 910 835C970 1075 930 1380 790 1645C650 1915 330 1975 95 1750C18 1675 0 1585 0 1500V315Z";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-soky-paper"
      data-hero-main-background
    >
      <div className={cn("absolute inset-0", mirrored && "-scale-x-100")}>
        <svg
          className="absolute inset-0 hidden h-full w-full portrait:block"
          viewBox="0 0 968 2097"
          preserveAspectRatio="none"
          focusable="false"
          role="presentation"
        >
          <defs>
            {polished ? (
              <linearGradient id={portraitToneId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#084db4" />
                <stop offset="0.58" stopColor="#0e60c8" />
                <stop offset="1" stopColor="#0753b8" />
              </linearGradient>
            ) : null}
            <pattern
              id={portraitPatternId}
              width="224"
              height="112"
              patternUnits="userSpaceOnUse"
            >
              <image
                href="/images/patterns/endless-clouds-light.svg"
                width="224"
                height="112"
              />
            </pattern>
          </defs>

          <rect width="968" height="2097" className="fill-soky-orange" />

          <path
            d={PORTRAIT_PATTERN_BLUE_SHAPE}
            className={polished ? undefined : "fill-soky-blue-bright"}
            fill={polished ? `url(#${portraitToneId})` : undefined}
          />

          <path
            d={PORTRAIT_PATTERN_BLUE_SHAPE}
            fill={`url(#${portraitPatternId})`}
            opacity={polished ? 0.19 : 0.3}
          />

          <path d={PORTRAIT_TOP_BLUE_SHAPE} className="fill-soky-blue" />
        </svg>
        <svg
          className="absolute inset-0 block h-full w-full portrait:hidden"
          viewBox="0 0 1808 869"
          preserveAspectRatio="none"
          focusable="false"
          role="presentation"
        >
          <defs>
            {polished ? (
              <linearGradient id={landscapeToneId} x1="0" y1="0" x2="1" y2="0.8">
                <stop offset="0" stopColor="#084db4" />
                <stop offset="0.6" stopColor="#0e60c8" />
                <stop offset="1" stopColor="#0753b8" />
              </linearGradient>
            ) : null}
            <pattern
              id={landscapePatternId}
              width="112"
              height="56"
              patternUnits="userSpaceOnUse"
            >
              <image
                href="/images/patterns/endless-clouds-light.svg"
                width="112"
                height="56"
              />
            </pattern>
          </defs>

          <path
            d={PATTERN_BLUE_SHAPE}
            className={polished ? undefined : "fill-soky-blue-bright"}
            fill={polished ? `url(#${landscapeToneId})` : undefined}
          />

          <path
            d={PATTERN_BLUE_SHAPE}
            fill={`url(#${landscapePatternId})`}
            opacity={polished ? 0.21 : 0.35}
          />

          <path d={TOP_BLUE_SHAPE} className="fill-soky-blue" />

          <path d={ORANGE_BOTTOM_SHAPE} className="fill-soky-orange" />
        </svg>
      </div>
    </div>
  );
};

export default MainHeroBackground;
