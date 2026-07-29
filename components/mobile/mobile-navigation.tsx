import { CalendarDays, Clock3, House, Radar, Settings } from 'lucide-react';
import type { MobileLabels, MobileView } from './mobile-types';

const items = [
  { id: 'home', icon: House, label: 'home' },
  { id: 'hourly', icon: Clock3, label: 'hourly' },
  { id: 'daily', icon: CalendarDays, label: 'daily' },
  { id: 'radar', icon: Radar, label: 'radar' },
  { id: 'settings', icon: Settings, label: 'settings' },
] as const;

export default function MobileNavigation({
  activeView,
  labels,
  onChange,
}: {
  activeView: MobileView;
  labels: MobileLabels;
  onChange: (view: MobileView) => void;
}) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Weather sections">
      {items.map(({ id, icon: Icon, label }) => (
        <button
          className="mobile-bottom-nav__item"
          data-active={activeView === id}
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-current={activeView === id ? 'page' : undefined}
        >
          <span className="mobile-bottom-nav__icon"><Icon aria-hidden="true" /></span>
          <span>{labels[label]}</span>
        </button>
      ))}
    </nav>
  );
}
