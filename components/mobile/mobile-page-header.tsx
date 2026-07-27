import { ArrowLeft } from 'lucide-react';

export default function MobilePageHeader({
  title,
  backLabel,
  onBack,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <header className="mobile-page-header">
      <button type="button" onClick={onBack} aria-label={backLabel}>
        <ArrowLeft aria-hidden="true" />
      </button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  );
}
