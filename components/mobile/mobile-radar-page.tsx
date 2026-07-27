import type { MobileLabels } from './mobile-types';
import MobilePageHeader from './mobile-page-header';
import RadarMap from '@/components/features/radar-map';

export default function MobileRadarPage({
  labels,
  onBack,
}: {
  labels: MobileLabels;
  onBack: () => void;
}) {
  return (
    <div className="mobile-page mobile-page--radar">
      <MobilePageHeader title={labels.radar} backLabel={labels.back} onBack={onBack} />
      <RadarMap />
    </div>
  );
}
