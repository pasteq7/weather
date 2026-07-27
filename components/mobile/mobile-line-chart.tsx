import { useId } from 'react';

export interface MobileChartSeries {
  color: string;
  fill?: boolean;
  key: string;
  values: number[];
}

export default function MobileLineChart({
  ariaLabel,
  series,
}: {
  ariaLabel: string;
  series: MobileChartSeries[];
}) {
  const gradientId = `mobile-chart-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mobile-accent)" stopOpacity=".22" />
          <stop offset="100%" stopColor="var(--mobile-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {series.map((item) => {
        const path = buildPath(item.values);
        return (
          <g key={item.key}>
            {item.fill && <path className="mobile-chart-fill" fill={`url(#${gradientId})`} d={`${path} L320 150 L0 150 Z`} />}
            <path className="mobile-chart-line" d={path} style={{ stroke: item.color }} />
          </g>
        );
      })}
    </svg>
  );
}

function buildPath(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  return values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 320;
    const y = 130 - ((value - min) / range) * 100;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}
