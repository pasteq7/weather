import { useId } from 'react';

export interface MobileChartSeries {
  color: string;
  fill?: boolean;
  key: string;
  values: (number | null)[];
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
        const paths = buildPaths(item.values);
        return (
          <g key={item.key}>
            {item.fill && paths[0] && <path className="mobile-chart-fill" fill={`url(#${gradientId})`} d={`${paths[0]} L320 150 L0 150 Z`} />}
            {paths.map((path, index) => <path key={index} className="mobile-chart-line" d={path} style={{ stroke: item.color }} />)}
          </g>
        );
      })}
    </svg>
  );
}

function buildPaths(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null);
  if (!available.length) return [];
  const min = Math.min(...available);
  const max = Math.max(...available);
  const range = Math.max(1, max - min);

  const paths: string[] = [];
  let points: string[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (points.length) paths.push(points.join(' '));
      points = [];
      return;
    }
    const x = (index / Math.max(1, values.length - 1)) * 320;
    const y = 130 - ((value - min) / range) * 100;
    points.push(`${points.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
  });
  if (points.length) paths.push(points.join(' '));
  return paths;
}
