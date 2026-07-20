// components/features/forecast-view.tsx

'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useViewPreference } from '@/hooks/use-view-preference'; 
import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip as RechartsTooltip } from 'recharts';
import { BarChart, List, Thermometer, Wind, Droplets } from 'lucide-react';
import { formatTemperature, mapWmoToWeather, formatWindSpeed, cn } from '@/lib/utils';
import { WeatherData, DailyDataPoint, HourlyDataPoint } from '@/lib/types';
import CurrentWeatherIcon from '../icons/current-weather-icon';
import { Skeleton } from '../ui/skeleton';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTranslations, useLocale } from 'next-intl';

const DAILY_FORECAST_DAYS = 14;
const DAILY_LIST_PAGE_SIZE = 7;
const HOURLY_LIST_PAGE_SIZE = 4;
const LARGE_SCREEN_QUERY = '(min-width: 72rem)';

function DailyForecastItem({ day, units, chartId, itemIndex, locale }: { 
  day: DailyDataPoint; 
  units: string; 
  chartId: string;
  itemIndex: number;
  locale: string;
}) {
  const t = useTranslations('WMO');
  const [isHovered, setIsHovered] = useState(false);
  const [maxTemp, maxTempUnit] = formatTemperature(day.temperature_2m_max, units);
  const [minTemp] = formatTemperature(day.temperature_2m_min, units);
  const { icon, descriptionKey } = mapWmoToWeather(day.weather_code, 1);
  const description = t(descriptionKey);
  const date = new Date(day.time * 1000);
  const dayLabel = date.toLocaleDateString(locale, { weekday: 'long' });
  const capitalizedDayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

  return (
    <div 
      className="forecast-item flex h-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1 text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="forecast-item__label max-w-full truncate text-xs font-semibold">{capitalizedDayLabel}</p>
      <div className="forecast-item__icon relative flex items-center justify-center">
        <div className={cn("h-full w-full transition-opacity duration-300", { "opacity-0": isHovered })}>
          <div 
            key={`${chartId}-daily-${day.time}-${itemIndex}`} 
            className="weather-icon-container h-full w-full"
            style={{ isolation: 'isolate' }}
          >
            <CurrentWeatherIcon iconCode={icon} className="h-full w-full" />
          </div>
        </div>
        <div className={cn("absolute inset-0 flex items-center justify-center p-1 text-center transition-opacity duration-300", { "opacity-0": !isHovered, "pointer-events-none": !isHovered })}>
          <p className="text-xs capitalize">{description}</p>
        </div>
      </div>
      <div className="forecast-item__value text-xs">
        <span className="font-bold">{maxTemp}{maxTempUnit}</span>
        <span className="text-muted-foreground"> / {minTemp}{maxTempUnit}</span>
      </div>
    </div>
  );
}

function HourlyForecastItem({ 
  hour, 
  units, 
  timezone, 
  chartId, 
  itemIndex,
  locale
}: { 
  hour: HourlyDataPoint; 
  units: string; 
  timezone: string; 
  chartId: string;
  itemIndex: number;
  locale: string;
}) {
  const t = useTranslations('WMO');
  const [isHovered, setIsHovered] = useState(false);
  const [temp, tempUnit] = formatTemperature(hour.temperature_2m, units);
  const { icon, descriptionKey } = mapWmoToWeather(hour.weather_code, hour.is_day);
  const description = t(descriptionKey);
  const timeLabel = new Date(hour.time * 1000).toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: units === 'imperial', 
    timeZone: timezone 
  });

  return (
    <div 
      className="forecast-item flex h-full min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-md px-2 py-1 text-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="forecast-item__label text-xs font-semibold tabular-nums">{timeLabel}</p>
      <div className="forecast-item__icon relative flex items-center justify-center">
        <div className={cn("h-full w-full transition-opacity duration-300", { "opacity-0": isHovered })}>
          <div 
            key={`${chartId}-hourly-${hour.time}-${itemIndex}`} 
            className="weather-icon-container h-full w-full"
            style={{ isolation: 'isolate' }}
          >
            <CurrentWeatherIcon iconCode={icon} className="h-full w-full" />
          </div>
        </div>
        <div className={cn("absolute inset-0 flex items-center justify-center p-1 text-center transition-opacity duration-300", { "opacity-0": !isHovered, "pointer-events-none": !isHovered })}>
          <p className="text-xs capitalize">{description}</p>
        </div>
      </div>
      <p className="forecast-item__value text-sm font-bold">{temp}{tempUnit}</p>
    </div>
  );
}

interface ForecastViewProps {
  type: 'hourly' | 'daily';
  weatherData: WeatherData;
  units: string;
}

export default function ForecastView({ type, weatherData, units }: ForecastViewProps) {
  const t = useTranslations('Forecast');
  const locale = useLocale();
  const chartConfig = useMemo(() => ({
    temperature: {
      label: t('temperature'),
      color: "var(--muted-foreground)",
    },
    rain: {
      label: t('rain'),
      color: "var(--chart-2)",
    },
    wind: {
      label: t('wind'),
      color: "var(--chart-4)",
    },
  }), [t]);

  const { preferences, setPreferences } = useViewPreference(
    `${type}-compact`, 
    { 
      view: type === 'hourly' ? 'chart' : 'list', 
      displayModes: type === 'hourly' ? ['temperature', 'rain'] : ['temperature'] 
    }
  );
  const { view, displayModes } = preferences;
  const [isMounted, setIsMounted] = useState(false);
  const [listPageIndex, setListPageIndex] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY);
    const handleChange = () => setIsLargeScreen(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const updateCurrentTimestamp = () => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    };

    updateCurrentTimestamp();
    const intervalId = window.setInterval(updateCurrentTimestamp, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const chartId = useMemo(() => 
    `forecast-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 12)}`, 
    [type]
  );

  const handleViewChange = useCallback((value: string) => {
    if (value && (value === 'chart' || value === 'list')) {
      setPreferences({ view: value as 'chart' | 'list' });
    }
  }, [setPreferences]);

  const handleDisplayModesChange = useCallback((value: string[]) => {
    const newModes = ['temperature', ...value.filter(v => v !== 'temperature')];
    setPreferences({ displayModes: newModes });
  }, [setPreferences]);

  const config = useMemo(() => ({
    hourly: {
      title: t('hourlyTitle'),
      tickFormatter: (tick: number) => new Date(tick * 1000).toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: units === 'imperial'
      }),
    },
    daily: {
      title: t('dailyTitle'),
      tickFormatter: (tick: number) => new Date(tick * 1000).toLocaleDateString(locale, { 
        month: 'short', 
        day: 'numeric' 
      }),
    },
  }), [units, t, locale]);

  const chartData = useMemo(() => {
    if (!weatherData?.hourly?.time || !weatherData?.daily?.time?.[0]) return [];
    const { time, temperature_2m, precipitation_probability, wind_speed_10m } = weatherData.hourly;

    let startIndex;
    if (type === 'hourly') {
      startIndex = time.findIndex(t => t >= currentTimestamp);
    } else {
      const firstDayTimestamp = weatherData.daily.time[0];
      const startTimestamp = Math.max(currentTimestamp, firstDayTimestamp);
      startIndex = time.findIndex(t => t >= startTimestamp);
    }

    if (startIndex === -1) return [];

    const dataSlice = type === 'hourly' ? 24 : DAILY_FORECAST_DAYS * 24;

    return time.slice(startIndex, startIndex + dataSlice).map((t, i) => ({
      time: t,
      temperature: temperature_2m[startIndex + i],
      rain: precipitation_probability[startIndex + i],
      wind: wind_speed_10m[startIndex + i],
    }));
  }, [weatherData, type, currentTimestamp]);

  const hourlyTicks = useMemo(() => {
    if (type !== 'hourly' || !chartData.length) return undefined;
    const ticks = [];
    for (let i = 0; i < chartData.length; i += 6) {
      ticks.push(chartData[i].time);
    }
    return ticks;
  }, [chartData, type]);

  const listData = useMemo(() => {
    if (type === 'daily') {
      return weatherData.daily.time.slice(0, DAILY_FORECAST_DAYS).map((t, i) => ({
        time: t,
        temperature_2m_max: weatherData.daily.temperature_2m_max[i],
        temperature_2m_min: weatherData.daily.temperature_2m_min[i],
        weather_code: weatherData.daily.weather_code[i],
      }));
    } else {
      const { hourly, daily } = weatherData;

      if (
        !hourly?.time?.length ||
        !daily?.time?.length ||
        !daily?.sunrise?.length ||
        !daily?.sunset?.length ||
        !hourly?.temperature_2m?.length ||
        !hourly?.weather_code?.length
      ) {
        return [];
      }
      
      const { wind_speed_10m } = hourly;
      
      const startIndex = hourly.time.findIndex(t => t >= currentTimestamp);

      if (startIndex === -1) {
        return [];
      }

      const result: HourlyDataPoint[] = [];
      for (let i = 0; i < 8; i++) {
        const hourlyIndex = startIndex + (i * 3);

        if (hourlyIndex >= hourly.time.length) {
          break;
        }
        
        const hourTimestamp = hourly.time[hourlyIndex];
        const dayIndex = daily.time.findLastIndex(dayStart => hourTimestamp >= dayStart);

        if (dayIndex === -1) {
          continue;
        }

        const sunrise = daily.sunrise[dayIndex];
        const sunset = daily.sunset[dayIndex];
        const temperature = hourly.temperature_2m[hourlyIndex];
        const weather_code = hourly.weather_code[hourlyIndex];
        const precipitation_probability = hourly.precipitation_probability[hourlyIndex];
        const current_wind_speed = wind_speed_10m[hourlyIndex];
        const visibility = hourly.visibility[hourlyIndex];

        if (sunrise === undefined || sunset === undefined || temperature === undefined || weather_code === undefined || precipitation_probability === undefined || current_wind_speed === undefined || visibility === undefined) {
          continue;
        }

        const calculatedIsDay = (hourTimestamp >= sunrise && hourTimestamp < sunset) ? 1 : 0;

        result.push({
          time: hourTimestamp,
          temperature_2m: temperature,
          weather_code: weather_code,
          is_day: calculatedIsDay,
          precipitation_probability: precipitation_probability,
          wind_speed_10m: current_wind_speed,
          visibility: visibility,
        });
      }
      return result;
    }
  }, [weatherData, type, currentTimestamp]);

  const isDailyList = type === 'daily';
  const listPageSize = isDailyList
    ? DAILY_LIST_PAGE_SIZE
    : isLargeScreen
      ? Math.max(1, listData.length)
      : HOURLY_LIST_PAGE_SIZE;
  const listPageCount = Math.max(1, Math.ceil(listData.length / listPageSize));
  const visibleListData = useMemo(
    () => listData.slice(
      listPageIndex * listPageSize,
      (listPageIndex + 1) * listPageSize
    ),
    [listData, listPageIndex, listPageSize]
  );
  const visibleListColumns = Math.max(1, Math.min(visibleListData.length, listPageSize));

  useEffect(() => {
    setListPageIndex(0);
  }, [type, view]);

  useEffect(() => {
    setListPageIndex((currentPage) => Math.min(currentPage, listPageCount - 1));
  }, [listPageCount]);

  const tempMetrics = useMemo(() => {
    if (!chartData.length) return { domain: [0, 0], min: 0, max: 0, ticks: [0] };
    const temps = chartData.map(d => d.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const padding = (max - min) * 0.2 || 5;
    const domainMin = Math.floor(min - padding);
    const domainMax = Math.ceil(max + padding);
    
    return {
      domain: [domainMin, domainMax],
      min: Math.round(min),
      max: Math.round(max),
      ticks: [Math.round(min), Math.round(max)]
    };
  }, [chartData]);
  
  const midnightTimestamps = useMemo(() => weatherData.daily.time || [], [weatherData.daily.time]);
  const daySeparators = useMemo(() => {
    if (!chartData.length) return [];

    const chartStart = chartData[0].time;
    const chartEnd = chartData[chartData.length - 1].time;

    return midnightTimestamps.filter((time) => time > chartStart && time < chartEnd);
  }, [chartData, midnightTimestamps]);

  const dailyTicks = useMemo(() => {
    if (type !== 'daily') return undefined;
    return midnightTimestamps
      .slice(1, DAILY_FORECAST_DAYS)
      .filter((_, index) => index % 2 === 0);
  }, [midnightTimestamps, type]);

  const visibleLegendItems = useMemo(() => (
    displayModes
      .filter((mode): mode is keyof typeof chartConfig => mode in chartConfig)
      .map((mode) => chartConfig[mode])
  ), [chartConfig, displayModes]);

  return (
    <Card className={cn("forecast-card weather-surface shrink-0 overflow-hidden rounded-lg border-border/25 py-0 shadow-none", type === 'hourly' ? "forecast-card--hourly" : "forecast-card--daily")}>
      <CardContent className="forecast-card__content flex h-full min-h-0 flex-col gap-2 px-3 py-3 sm:gap-2.5 sm:px-4 sm:py-3.5">
        <div className="forecast-card__header flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="forecast-card__title text-base font-bold text-card-foreground/85">{config[type].title}</h3>
          <div className="forecast-card__controls flex w-full flex-wrap items-center justify-between gap-1.5 sm:w-auto sm:justify-end sm:gap-2">
            {view === 'chart' && (
              <TooltipProvider>
                <ToggleGroup 
                  type="multiple" 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0"
                  value={displayModes} 
                  onValueChange={handleDisplayModesChange}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <ToggleGroupItem 
                          value="temperature" 
                          aria-label="Temperature" 
                          disabled 
                          data-chart="temperature"
                        >
                          <Thermometer className="h-4 w-4" />
                        </ToggleGroupItem>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('tempAlwaysShown')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="rain" aria-label="Rain" data-chart="rain">
                        <Droplets className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('toggleRain')}</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem value="wind" aria-label="Wind" data-chart="wind">
                        <Wind className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('toggleWind')}</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <ToggleGroup 
                type="single" 
                variant="outline" 
                size="sm" 
                className="shrink-0"
                value={view} 
                onValueChange={handleViewChange}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="chart" aria-label="Chart view">
                      <BarChart className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('chartView')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value="list" aria-label="List view">
                      <List className="h-4 w-4" />
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('listView')}</p>
                  </TooltipContent>
                </Tooltip>
              </ToggleGroup>
            </TooltipProvider>
          </div>
        </div>
        <div
          className={cn(
            "forecast-card__legend flex min-h-3 flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground/85 transition-opacity duration-300 sm:min-h-4",
            view === 'chart' ? "opacity-100" : "forecast-card__legend--inactive opacity-0"
          )}
          aria-hidden={view !== 'chart'}
        >
          {visibleLegendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div
          className={cn(
            "forecast-card__visual relative min-h-0 w-full flex-auto",
            type === 'hourly' && "h-[10rem] sm:h-[10.75rem] min-[72rem]:h-[7rem]",
            type === 'daily' && "h-[11.25rem] sm:h-[12.5rem] min-[72rem]:h-[8.25rem]"
          )}
        >
          {!isMounted ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              {/* Chart View */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full transition-opacity duration-300",
                  view === 'chart'
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                )}
              >
                {!chartData.length ? <Skeleton className="w-full h-full" /> : (
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 12, left: -4, bottom: 0 }}
                      id={`${chartId}-chart`}
                    >
                      <XAxis
                        dataKey="time"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        ticks={type === 'daily' ? dailyTicks : hourlyTicks}
                        tickFormatter={config[type].tickFormatter}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                        tick={{ fill: "var(--muted-foreground)", opacity: 0.8 }}
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="temp"
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--muted-foreground)"
                        tick={{ fill: "var(--muted-foreground)", opacity: 0.8 }}
                        tickFormatter={(value) => `${value}\u00B0`}
                        domain={tempMetrics.domain}
                        ticks={tempMetrics.ticks}
                        fontSize={12}
                      />
                      <YAxis yAxisId="rain" hide domain={[0, 105]} />
                      <YAxis yAxisId="wind" hide domain={[0, 'dataMax + 10']} />
                      
                      <RechartsTooltip
                        cursor={true}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(label) => new Date(Number(label) * 1000).toLocaleString(locale, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: units === 'imperial'
                            })}
                            formatter={(value, name, item) => {
                              let displayValue;

                              if (name === 'temperature') {
                                const [val, unit] = formatTemperature(value as number, units);
                                displayValue = `${val}${unit}`;
                              } else if (name === 'wind') {
                                const [val, unit] = formatWindSpeed(value as number, units);
                                displayValue = `${val} ${unit}`;
                              } else if (name === 'rain') {
                                const val = Math.round(value as number);
                                displayValue = `${val}%`;
                              } else {
                                return null;
                              }

                              const itemConfig = chartConfig[name as keyof typeof chartConfig];

                              return (
                                <div className="flex items-center gap-2 text-xs">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ background: item.color }}
                                  />
                                  <div className="flex flex-1 justify-between gap-2">
                                    <span className="font-medium text-muted-foreground">{itemConfig.label}</span>
                                    <span className="font-bold">{displayValue}</span>
                                  </div>
                                </div>
                              )
                            }}
                          />
                        }
                      />

                      {daySeparators.map((time, index) => (
                        <ReferenceLine
                          key={`${chartId}-day-separator-${index}`}
                          x={time}
                          yAxisId="temp"
                          stroke="var(--border)"
                          strokeWidth={1}
                          strokeOpacity={0.24}
                        />
                      ))}
                      {displayModes.includes('temperature') && (
                        <Line
                          yAxisId="temp"
                          type="monotone"
                          dataKey="temperature"
                          stroke="var(--color-temperature)"
                          dot={false}
                          isAnimationActive={false}
                          activeDot={{ r: 5, fill: "var(--color-temperature)", stroke: "var(--background)", strokeWidth: 2 }}
                          strokeWidth={2}
                        />
                      )}
                      {displayModes.includes('rain') && (
                        <Line
                          yAxisId="rain"
                          type="monotone"
                          dataKey="rain"
                          stroke="var(--color-rain)"
                          dot={false}
                          isAnimationActive={false}
                          activeDot={{ r: 5, fill: "var(--color-rain)", stroke: "var(--background)", strokeWidth: 2 }}
                          strokeWidth={2}
                        />
                      )}
                      {displayModes.includes('wind') && (
                        <Line
                          yAxisId="wind"
                          type="monotone"
                          dataKey="wind"
                          stroke="var(--color-wind)"
                          dot={false}
                          isAnimationActive={false}
                          activeDot={{ r: 5, fill: "var(--color-wind)", stroke: "var(--background)", strokeWidth: 2 }}
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ChartContainer>
                )}
              </div>

              {/* List View */}
              <div
                className={cn(
                  "absolute inset-0 flex h-full flex-col gap-1 overflow-hidden transition-opacity duration-300",
                  view === 'list'
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                )}
              >
                <div
                  className="grid min-h-0 flex-1 gap-1 overflow-hidden"
                  style={{ gridTemplateColumns: `repeat(${visibleListColumns}, minmax(0, 1fr))` }}
                >
                  {type === 'daily'
                    ? (visibleListData as DailyDataPoint[]).map((day, index) => (
                        <DailyForecastItem
                          key={`${day.time}-${index}`}
                          day={day}
                          units={units}
                          chartId={chartId}
                          itemIndex={(listPageIndex * listPageSize) + index}
                          locale={locale}
                        />
                      ))
                    : (visibleListData as HourlyDataPoint[]).map((hour, index) => (
                        <HourlyForecastItem
                          key={`${hour.time}-${index}`}
                          hour={hour}
                          units={units}
                          timezone={weatherData.timezone}
                          chartId={chartId}
                          itemIndex={(listPageIndex * listPageSize) + index}
                          locale={locale}
                        />
                      ))
                  }
                </div>
                {listPageCount > 1 && (
                  <div className="flex h-4 shrink-0 items-center justify-center gap-1.5" aria-label={t('forecastPagination')}>
                    {Array.from({ length: listPageCount }, (_, pageIndex) => (
                      <button
                        key={pageIndex}
                        type="button"
                        className="group flex h-4 w-4 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                        aria-current={pageIndex === listPageIndex ? 'page' : undefined}
                        aria-label={t('forecastPage', { page: pageIndex + 1, total: listPageCount })}
                        onClick={() => setListPageIndex(pageIndex)}
                      >
                        <span
                          className={cn(
                            "block h-1.5 rounded-full transition-all",
                            pageIndex === listPageIndex
                              ? "w-4 bg-primary"
                              : "w-1.5 bg-muted-foreground/35 group-hover:bg-muted-foreground/55"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
    );
}
