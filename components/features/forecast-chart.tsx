import { Area, ComposedChart, ReferenceLine, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatTemperature, formatWindSpeed } from '@/lib/utils';

export interface ForecastChartPoint {
  time: number;
  temperature: number;
  rain: number;
  wind: number;
}

interface ForecastChartProps {
  chartConfig: ChartConfig;
  chartId: string;
  data: ForecastChartPoint[];
  daySeparators: number[];
  displayModes: string[];
  locale: string;
  tempDomain: number[];
  tempTicks: number[];
  tickFormatter: (tick: number) => string;
  ticks?: number[];
  units: string;
}

export default function ForecastChart({
  chartConfig,
  chartId,
  data,
  daySeparators,
  displayModes,
  locale,
  tempDomain,
  tempTicks,
  tickFormatter,
  ticks,
  units,
}: ForecastChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: -4, bottom: 0 }} id={`${chartId}-chart`}>
        <defs>
          <linearGradient id={`${chartId}-temperature-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-temperature)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-temperature)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${chartId}-rain-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-rain)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-rain)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${chartId}-wind-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-wind)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-wind)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          type="number"
          domain={['dataMin', 'dataMax']}
          ticks={ticks}
          tickFormatter={tickFormatter}
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          tick={{ fill: 'var(--muted-foreground)', opacity: 0.8 }}
          fontSize={12}
        />
        <YAxis
          yAxisId="temp"
          tickLine={false}
          axisLine={false}
          stroke="var(--muted-foreground)"
          tick={{ fill: 'var(--muted-foreground)', opacity: 0.8 }}
          tickFormatter={(value) => `${value}\u00B0`}
          domain={tempDomain}
          ticks={tempTicks}
          fontSize={12}
        />
        <YAxis yAxisId="rain" hide domain={[0, 105]} />
        <YAxis yAxisId="wind" hide domain={[0, 'dataMax + 10']} />

        <RechartsTooltip
          cursor
          content={
            <ChartTooltipContent
              labelFormatter={(label) => new Date(Number(label) * 1000).toLocaleString(locale, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: units === 'imperial',
              })}
              formatter={(value, name, item) => {
                let displayValue: string;

                if (name === 'temperature') {
                  const [formattedValue, unit] = formatTemperature(value as number, units);
                  displayValue = `${formattedValue}${unit}`;
                } else if (name === 'wind') {
                  const [formattedValue, unit] = formatWindSpeed(value as number, units);
                  displayValue = `${formattedValue} ${unit}`;
                } else if (name === 'rain') {
                  displayValue = `${Math.round(value as number)}%`;
                } else {
                  return null;
                }

                const itemConfig = chartConfig[name as keyof typeof chartConfig];
                return (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    <div className="flex flex-1 justify-between gap-2">
                      <span className="font-medium text-muted-foreground">{itemConfig.label}</span>
                      <span className="font-bold">{displayValue}</span>
                    </div>
                  </div>
                );
              }}
            />
          }
        />

        {daySeparators.map((time) => (
          <ReferenceLine key={`${chartId}-day-separator-${time}`} x={time} yAxisId="temp" stroke="var(--border)" strokeWidth={1} strokeOpacity={0.24} />
        ))}
        {displayModes.includes('temperature') && (
          <Area yAxisId="temp" type="monotone" dataKey="temperature" stroke="var(--color-temperature)" strokeLinecap="round" strokeWidth={2} fill={`url(#${chartId}-temperature-fill)`} dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: 'var(--color-temperature)', stroke: 'var(--background)', strokeWidth: 2 }} />
        )}
        {displayModes.includes('rain') && (
          <Area yAxisId="rain" type="monotone" dataKey="rain" stroke="var(--color-rain)" strokeLinecap="round" strokeWidth={2} fill={`url(#${chartId}-rain-fill)`} dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: 'var(--color-rain)', stroke: 'var(--background)', strokeWidth: 2 }} />
        )}
        {displayModes.includes('wind') && (
          <Area yAxisId="wind" type="monotone" dataKey="wind" stroke="var(--color-wind)" strokeLinecap="round" strokeWidth={2} fill={`url(#${chartId}-wind-fill)`} dot={false} isAnimationActive={false} activeDot={{ r: 5, fill: 'var(--color-wind)', stroke: 'var(--background)', strokeWidth: 2 }} />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}
