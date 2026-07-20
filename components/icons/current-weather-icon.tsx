import { FC, useEffect, useRef } from 'react';
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
