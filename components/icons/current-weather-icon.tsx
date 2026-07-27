import { FC, useEffect, useId, useLayoutEffect, useRef } from 'react';
import { useAppContext } from '@/app/context/AppContext';
import { cn } from '@/lib/utils';
import { currentWeatherIconNames, getMeteocon } from '@/lib/meteocons';

interface CurrentWeatherIconProps {
  iconCode: string;
  className?: string;
}

const CurrentWeatherIcon: FC<CurrentWeatherIconProps> = ({ iconCode, className }) => {
  const { iconStyle } = useAppContext();
  const iconName = currentWeatherIconNames[iconCode] ?? 'clear-day';
  const IconComponent = getMeteocon(iconStyle, iconName);
  const iconRef = useRef<HTMLDivElement>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useLayoutEffect(() => {
    const root = iconRef.current;
    if (!root) return;

    const idMap = new Map<string, string>();
    root.querySelectorAll<SVGElement>('[id]').forEach((element) => {
      const originalId = element.id;
      if (!originalId || originalId.startsWith(`${instanceId}-`)) return;

      const uniqueId = `${instanceId}-${originalId}`;
      idMap.set(originalId, uniqueId);
      element.id = uniqueId;
    });

    if (idMap.size === 0) return;

    root.querySelectorAll<SVGElement>('*').forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        let nextValue = attribute.value;
        idMap.forEach((uniqueId, originalId) => {
          nextValue = nextValue
            .replaceAll(`url(#${originalId})`, `url(#${uniqueId})`)
            .replaceAll(`#${originalId}`, `#${uniqueId}`)
            .replaceAll(`${originalId}.`, `${uniqueId}.`);
        });
        if (nextValue !== attribute.value) {
          element.setAttribute(attribute.name, nextValue);
        }
      });
    });
  }, [IconComponent, instanceId]);

  useEffect(() => {
    const timingElements = iconRef.current?.querySelectorAll('animate, animateTransform, animateMotion');

    timingElements?.forEach((element) => {
      ['dur', 'begin'].forEach((attribute) => {
        const originalAttribute = `data-original-${attribute}`;
        const originalValue = element.getAttribute(originalAttribute) ?? element.getAttribute(attribute);

        if (!originalValue) return;

        element.setAttribute(originalAttribute, originalValue);
        element.setAttribute(
          attribute,
          originalValue.replace(/([\d.]+)(ms|s)\b/g, (_match: string, value: string, unit: string) => `${Number(value) * 5}${unit}`)
        );
      });
    });
  }, [IconComponent]);

  return (
    <div ref={iconRef} className={cn('h-full w-full text-primary', className)}>
      <IconComponent className="h-full w-full" aria-hidden="true" focusable="false" />
    </div>
  );
};

export default CurrentWeatherIcon;
