import { Check, Languages, Monitor, Moon, Palette, Sun, Thermometer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageProvider';
import type { Locale } from '@/i18n-config';
import MobilePageHeader from './mobile-page-header';
import type { MobileLabels } from './mobile-types';
import type { MeteoconStyle } from '@/lib/meteocons';

const iconStyles: MeteoconStyle[] = ['line', 'fill', 'monochrome'];

export default function MobileSettingsPage({
  labels,
  onBack,
}: {
  labels: MobileLabels;
  onBack: () => void;
}) {
  const t = useTranslations('TopBar');
  const { iconStyle, setIconStyle, setUnits, units } = useAppContext();
  const { locale, setLocale } = useLanguage();
  const { setTheme, theme } = useTheme();
  const themeOptions = [
    { value: 'light', label: locale === 'fr' ? 'Clair' : 'Light', icon: Sun },
    { value: 'dark', label: locale === 'fr' ? 'Sombre' : 'Dark', icon: Moon },
    { value: 'system', label: locale === 'fr' ? 'Système' : 'System', icon: Monitor },
  ] as const;

  return (
    <div className="mobile-page mobile-page--detail">
      <MobilePageHeader title={labels.settings} backLabel={labels.back} onBack={onBack} />
      <section className="mobile-settings-section">
        <div className="mobile-settings-section__title">
          <Thermometer aria-hidden="true" />
          <h2>{t('unitsLabel')}</h2>
        </div>
        <div className="mobile-settings-options" role="radiogroup" aria-label={t('unitsLabel')}>
          <button type="button" data-active={units === 'metric'} onClick={() => setUnits('metric')} role="radio" aria-checked={units === 'metric'}>
            {t('celsiusTooltip')}<Check aria-hidden="true" />
          </button>
          <button type="button" data-active={units === 'imperial'} onClick={() => setUnits('imperial')} role="radio" aria-checked={units === 'imperial'}>
            {t('fahrenheitTooltip')}<Check aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="mobile-settings-section">
        <div className="mobile-settings-section__title">
          <Sun aria-hidden="true" />
          <h2>{locale === 'fr' ? 'Thème' : 'Theme'}</h2>
        </div>
        <div className="mobile-settings-options" role="radiogroup" aria-label={locale === 'fr' ? 'Thème' : 'Theme'}>
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" data-active={theme === value} onClick={() => setTheme(value)} role="radio" aria-checked={theme === value}>
              <span className="mobile-settings-option__label"><Icon aria-hidden="true" />{label}</span><Check aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="mobile-settings-section">
        <div className="mobile-settings-section__title">
          <Languages aria-hidden="true" />
          <h2>{t('languageLabel')}</h2>
        </div>
        <div className="mobile-settings-options" role="radiogroup" aria-label={t('languageLabel')}>
          <button type="button" data-active={locale === 'en'} onClick={() => setLocale('en' as Locale)} role="radio" aria-checked={locale === 'en'}>
            {t('english')}<Check aria-hidden="true" />
          </button>
          <button type="button" data-active={locale === 'fr'} onClick={() => setLocale('fr' as Locale)} role="radio" aria-checked={locale === 'fr'}>
            {t('french')}<Check aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="mobile-settings-section">
        <div className="mobile-settings-section__title">
          <Palette aria-hidden="true" />
          <h2>{t('iconStyleLabel')}</h2>
        </div>
        <div className="mobile-settings-options" role="radiogroup" aria-label={t('iconStyleLabel')}>
          {iconStyles.map((style) => (
            <button key={style} type="button" data-active={iconStyle === style} onClick={() => setIconStyle(style)} role="radio" aria-checked={iconStyle === style}>
              {style === 'line' ? t('iconStyleLine') : style === 'fill' ? t('iconStyleFill') : t('iconStyleMonochrome')}<Check aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
