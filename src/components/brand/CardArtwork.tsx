type CardArtworkProps = { className?: string };

export function CardFans({ className }: CardArtworkProps) {
  return (<svg
            className={className}
            viewBox="0 0 180 130"
            shapeRendering="geometricPrecision"
            aria-hidden="true"
            focusable="false"
          >
            <g>
              <path
                fill="var(--fan-fill, #081f58)"
                d="M7 111A48 48 0 0 1 103 111A48 48 0 0 1 7 111Z"
              />
              <path
                fill="none"
                stroke="var(--fan-line, #2454ad)"
                strokeWidth="1.25"
                d="M48.143 111A6.857 6.857 0 0 1 61.857 111A6.857 6.857 0 0 1 48.143 111ZM41.286 111A13.714 13.714 0 0 1 68.714 111A13.714 13.714 0 0 1 41.286 111ZM34.429 111A20.571 20.571 0 0 1 75.571 111A20.571 20.571 0 0 1 34.429 111ZM27.571 111A27.429 27.429 0 0 1 82.429 111A27.429 27.429 0 0 1 27.571 111ZM20.714 111A34.286 34.286 0 0 1 89.286 111A34.286 34.286 0 0 1 20.714 111ZM13.857 111A41.143 41.143 0 0 1 96.143 111A41.143 41.143 0 0 1 13.857 111Z"
              />
            </g>
            <g>
              <path
                fill="var(--fan-fill, #081f58)"
                d="M49 83A65 65 0 0 1 179 83A65 65 0 0 1 49 83Z"
              />
              <path
                fill="none"
                stroke="var(--fan-line, #2454ad)"
                strokeWidth="1.25"
                d="M104.714 83A9.286 9.286 0 0 1 123.286 83A9.286 9.286 0 0 1 104.714 83ZM95.429 83A18.571 18.571 0 0 1 132.571 83A18.571 18.571 0 0 1 95.429 83ZM86.143 83A27.857 27.857 0 0 1 141.857 83A27.857 27.857 0 0 1 86.143 83ZM76.857 83A37.143 37.143 0 0 1 151.143 83A37.143 37.143 0 0 1 76.857 83ZM67.571 83A46.429 46.429 0 0 1 160.429 83A46.429 46.429 0 0 1 67.571 83ZM58.286 83A55.714 55.714 0 0 1 169.714 83A55.714 55.714 0 0 1 58.286 83Z"
              />
            </g>
            <g>
              <path
                fill="var(--fan-fill, #081f58)"
                d="M110 126A56 56 0 0 1 222 126A56 56 0 0 1 110 126Z"
              />
              <path
                fill="none"
                stroke="var(--fan-line, #2454ad)"
                strokeWidth="1.25"
                d="M158 126A8 8 0 0 1 174 126A8 8 0 0 1 158 126ZM150 126A16 16 0 0 1 182 126A16 16 0 0 1 150 126ZM142 126A24 24 0 0 1 190 126A24 24 0 0 1 142 126ZM134 126A32 32 0 0 1 198 126A32 32 0 0 1 134 126ZM126 126A40 40 0 0 1 206 126A40 40 0 0 1 126 126ZM118 126A48 48 0 0 1 214 126A48 48 0 0 1 118 126Z"
              />
            </g>
          </svg>);
}

type CardWavesProps = CardArtworkProps & {
  orientation?: "horizontal" | "vertical";
};

export function CardWaves({
  className,
  orientation = "horizontal",
}: CardWavesProps) {
  const isVertical = orientation === "vertical";

  return (
    <svg
      className={className}
      viewBox={isVertical ? "0 0 120 400" : "0 0 400 120"}
      preserveAspectRatio="none"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      focusable="false"
    >
      <g transform={isVertical ? "translate(0 400) rotate(-90)" : undefined}>
        <path
          fill="var(--card-accent, #fe6402)"
          d="M0 43C34 13 60 17 94 33C128 49 152 67 190 67C228 67 260 42 302 42C344 42 372 55 400 60L400 120H0Z"
        />
        <path
          fill="var(--card-bg, #163a9a)"
          d="M0 67C36 44 72 45 112 60C152 75 218 92 270 92C322 92 365 81 400 81L400 120H0Z"
        />
      </g>
    </svg>
  );
}
