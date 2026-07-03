import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const WEATHER_DATA_CARD_COUNT = 6;
const HOURLY_PLACEHOLDERS = 4;
const DAILY_PLACEHOLDERS = 7;

export default function Loading() {
  return (
    <main className="min-h-0 overflow-hidden" aria-busy="true" aria-label="Loading weather data">
      <div className="weather-dashboard flex h-full min-h-0 flex-col gap-2.5 overflow-y-auto overscroll-contain pb-1 pr-1 min-[72rem]:overflow-hidden min-[72rem]:pr-0">
        <div className="weather-summary-grid grid min-h-0 shrink-0 grid-cols-1 gap-2.5 min-[50rem]:grid-cols-[minmax(18rem,0.86fr)_minmax(0,1.6fr)]">
          <div className="flex min-h-0 flex-col">
            <TodayWeatherCardSkeleton />
          </div>
          <div className="weather-right-column flex min-h-0 flex-col gap-2.5">
            <WeatherDataGridSkeleton />
            <ForecastViewSkeleton type="hourly" />
          </div>
        </div>
        <ForecastViewSkeleton type="daily" />
        <FooterSkeleton />
      </div>
    </main>
  );
}

function TodayWeatherCardSkeleton() {
  return (
    <Card className="today-weather-card weather-surface h-full shrink-0 overflow-hidden rounded-lg border-border/25 p-0 shadow-none">
      <div className="today-weather-card__body flex h-full min-h-[18.5rem] flex-col gap-3 p-3.5 min-[420px]:min-h-[16rem] sm:min-h-[16.25rem] sm:p-4 min-[72rem]:min-h-[15.5rem]">
        <div className="today-weather-card__header grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-7 w-[82%] max-w-56 rounded-md sm:h-8" />
            <Skeleton className="h-3 w-28 rounded-full sm:h-4" />
          </div>
          <div className="flex w-[5.8rem] shrink-0 flex-col items-end gap-1.5 rounded-lg border border-border/15 bg-background/10 p-2">
            <Skeleton className="h-2.5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-11 rounded-full" />
          </div>
        </div>
        <div className="today-weather-card__current flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5 px-2 py-1.5">
          <div className="flex min-h-0 justify-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 min-[72rem]:h-28 min-[72rem]:w-28">
              <Skeleton className="today-weather-card__icon h-full w-full rounded-full" />
              <Skeleton className="absolute bottom-3 left-1/2 h-4 w-14 -translate-x-1/2 rounded-full opacity-70" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-center gap-2 text-center">
            <Skeleton className="h-14 w-28 sm:h-16 sm:w-32" />
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function WeatherDataGridSkeleton() {
  return (
    <div className="weather-data-grid grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      {Array.from({ length: WEATHER_DATA_CARD_COUNT }, (_, index) => (
        <Card key={index} className="weather-data-card weather-surface flex min-h-[3.25rem] min-w-0 flex-row items-center gap-1.5 rounded-lg border-border/25 px-2 py-1.5 shadow-none sm:min-h-[3.5rem] sm:gap-2 sm:px-2.5 sm:py-1.5 min-[72rem]:min-h-[3.15rem] min-[72rem]:px-2.5 min-[72rem]:py-1.5">
          <Skeleton className="weather-data-card__icon h-8 w-8 shrink-0 rounded-md sm:h-9 sm:w-9 min-[72rem]:h-8 min-[72rem]:w-8" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <Skeleton className="h-2.5 w-1/2 rounded-full" />
            <Skeleton className="h-5 w-4/5 rounded-md sm:h-6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ForecastViewSkeleton({ type }: { type: 'hourly' | 'daily' }) {
  const placeholderCount = type === 'hourly' ? HOURLY_PLACEHOLDERS : DAILY_PLACEHOLDERS;

  return (
    <Card className={cn("forecast-card weather-surface shrink-0 overflow-hidden rounded-lg border-border/25 py-0 shadow-none", type === 'hourly' ? "forecast-card--hourly" : "forecast-card--daily")}>
      <div className="forecast-card__content flex h-full min-h-0 flex-col gap-2 px-3 py-3 sm:gap-2.5 sm:px-4 sm:py-3.5">
        <div className="forecast-card__header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-2.5 w-20 rounded-full sm:hidden" />
          </div>
          <div className="forecast-card__controls flex items-center gap-1.5 self-start sm:self-auto">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
        <div className="forecast-card__legend flex min-h-3 items-center gap-3 sm:min-h-4">
          <Skeleton className="h-2.5 w-20 rounded-full" />
          <Skeleton className="h-2.5 w-16 rounded-full" />
          <Skeleton className="hidden h-2.5 w-14 rounded-full sm:block" />
        </div>
        <div
          className={cn(
            "forecast-card__visual relative min-h-0 w-full flex-auto",
            type === 'hourly' && "h-[10rem] sm:h-[10.75rem] min-[72rem]:h-[7rem]",
            type === 'daily' && "h-[11.25rem] sm:h-[12.5rem] min-[72rem]:h-[8.25rem]"
          )}
        >
          <div className="grid h-full min-h-0 gap-1.5 overflow-hidden rounded-md border border-border/15 bg-background/10 p-1.5" style={{ gridTemplateColumns: `repeat(${placeholderCount}, minmax(0, 1fr))` }}>
            {Array.from({ length: placeholderCount }, (_, index) => (
              <div key={index} className="flex min-h-0 min-w-0 flex-col items-center justify-between gap-1 overflow-hidden rounded-md px-1 py-1.5">
                <Skeleton className="h-2.5 w-9 rounded-full" />
                <Skeleton className="h-[52%] w-full max-w-16 rounded-md" />
                <Skeleton className="h-3 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function FooterSkeleton() {
  return (
    <footer className="weather-footer w-full">
      <Card className="weather-footer-card weather-surface w-full rounded-lg border-border/25 px-3 py-2 shadow-none sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-2.5 w-24 rounded-full" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="hidden h-2.5 w-20 rounded-full md:block" />
            <Skeleton className="h-4 w-4 rounded-md" />
          </div>
        </div>
      </Card>
    </footer>
  );
}
