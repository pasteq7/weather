import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/top-bar';
import HomePage from '@/app/HomePage';

const ACTIVE_VIEW_STORAGE_KEY = 'weather-active-view';

export default function DesktopWeatherApp() {
  const [activeView, setActiveView] = useState<'weather' | 'radar'>(() => (
    window.localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY) === 'radar' ? 'radar' : 'weather'
  ));

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  return (
    <div className="desktop-weather-app">
      <div className="weather-shell mx-auto grid h-dvh max-h-dvh w-full max-w-[98rem] grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden p-2 sm:p-3">
        <TopBar activeView={activeView} onViewChange={setActiveView} />
        <HomePage activeView={activeView} />
      </div>
    </div>
  );
}
