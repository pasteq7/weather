import type { CSSProperties } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface DataCardProps {
  iconType: string;
  title: string;
  data?: string | number;
  unit?: string;
}

const dataIconPaths: Record<string, string> = {
  humidity: "/data/humidity.svg",
  wind: "/data/wind.svg",
  pressure: "/data/pressure.svg",
  visibility: "/data/visibility.svg",
  sunrise: "/data/sunrise.svg",
  sunset: "/data/sunset.svg",
};

const coloredIconTypes = new Set(["humidity"]);

function SunTimeIcon({ isSunset }: { isSunset: boolean }) {
  const accentColor = isSunset ? "#fb923c" : "#fbbf24";

  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full" aria-hidden="true">
      <g stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 42A12 12 0 0 1 44 42" />
        <path d="M32 24V18" />
        <path d="M22 28L17 23" />
        <path d="M42 28L47 23" />
      </g>
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 42H56" />
        {isSunset ? (
          <>
            <path d="M32 48V56" />
            <path d="M28 52L32 56L36 52" />
          </>
        ) : (
          <>
            <path d="M32 56V48" />
            <path d="M28 52L32 48L36 52" />
          </>
        )}
      </g>
    </svg>
  );
}

export default function DataCard({ iconType, title, data, unit }: DataCardProps) {
  const iconPath = dataIconPaths[iconType] ?? dataIconPaths.mist;
  const iconStyle = {
    WebkitMaskImage: `url(${iconPath})`,
    maskImage: `url(${iconPath})`,
  } satisfies CSSProperties;
  const hasColorAccent = coloredIconTypes.has(iconType);
  const isSunTimeIcon = iconType === "sunrise" || iconType === "sunset";

  return (
    <div className="weather-data-card min-h-16 min-w-0 bg-card/20 px-2 py-1.5 sm:min-h-[4.25rem] sm:px-2.5 sm:py-1.5 min-[72rem]:min-h-16 min-[72rem]:px-2.5 min-[72rem]:py-1.5">
      <div className="flex h-full min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="weather-data-card__icon h-11 w-11 shrink-0 text-card-foreground opacity-90 sm:h-12 sm:w-12 min-[72rem]:h-11 min-[72rem]:w-11">
          {isSunTimeIcon ? (
            <SunTimeIcon isSunset={iconType === "sunset"} />
          ) : hasColorAccent ? (
            <img aria-hidden="true" src={iconPath} className="block h-full w-full" />
          ) : (
            <span
              aria-hidden="true"
              className="block h-full w-full bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]"
              style={iconStyle}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="weather-data-card__title truncate text-[0.78rem] font-medium leading-[1.05] text-muted-foreground/85">{title}</p>
          {data === undefined || data === null ? (
            <Skeleton className="mt-1 h-6 w-3/4" />
          ) : (
            <div className="flex min-w-0 items-baseline gap-0.5 sm:gap-1">
              <p className="weather-data-card__value whitespace-nowrap text-lg font-medium leading-none text-card-foreground sm:text-xl min-[72rem]:text-lg">{data}</p>
              {unit && <p className="weather-data-card__unit whitespace-nowrap text-[0.72rem] font-medium leading-none text-muted-foreground/85 sm:text-xs">{unit}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
