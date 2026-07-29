import type { ReactNode } from 'react';
import { Languages, Monitor, Moon, Palette, SlidersHorizontal, Sun, Thermometer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useAppContext } from '@/app/context/AppContext';
import { useLanguage } from '@/app/context/LanguageProvider';
import type { Locale } from '@/i18n-config';
import type { MeteoconStyle } from '@/lib/meteocons';
import MobilePageHeader from './mobile-page-header';
import type { MobileLabels } from './mobile-types';

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
    <div className="mobile-page mobile-page--detail mobile-page--settings">
      <MobilePageHeader title={labels.settings} backLabel={labels.back} onBack={onBack} />

      <div className="mobile-settings-intro">
        <span><SlidersHorizontal aria-hidden="true" /></span>
        <div>
          <h2>{locale === 'fr' ? 'Votre expérience météo' : 'Your weather experience'}</h2>
          <p>{locale === 'fr' ? 'Personnalisez rapidement l’affichage de l’application.' : 'Quickly tailor how the app looks and feels.'}</p>
        </div>
      </div>

      <div className="mobile-settings-list">
        <SettingGroup icon={Thermometer} title={t('unitsLabel')}>
          <div className="mobile-settings-options mobile-settings-options--two" role="radiogroup" aria-label={t('unitsLabel')}>
            <SettingOption active={units === 'metric'} label={t('celsiusTooltip')} onClick={() => setUnits('metric')} />
            <SettingOption active={units === 'imperial'} label={t('fahrenheitTooltip')} onClick={() => setUnits('imperial')} />
          </div>
        </SettingGroup>

        <SettingGroup icon={Sun} title={locale === 'fr' ? 'Thème' : 'Theme'}>
          <div className="mobile-settings-options" role="radiogroup" aria-label={locale === 'fr' ? 'Thème' : 'Theme'}>
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <SettingOption active={theme === value} icon={Icon} key={value} label={label} onClick={() => setTheme(value)} />
            ))}
          </div>
        </SettingGroup>

        <SettingGroup icon={Languages} title={t('languageLabel')}>
          <div className="mobile-settings-options mobile-settings-options--two" role="radiogroup" aria-label={t('languageLabel')}>
            <SettingOption active={locale === 'en'} label={t('english')} onClick={() => setLocale('en' as Locale)} />
            <SettingOption active={locale === 'fr'} label={t('french')} onClick={() => setLocale('fr' as Locale)} />
          </div>
        </SettingGroup>

        <SettingGroup icon={Palette} title={t('iconStyleLabel')}>
          <div className="mobile-settings-options" role="radiogroup" aria-label={t('iconStyleLabel')}>
            {iconStyles.map((style) => (
              <SettingOption
                active={iconStyle === style}
                key={style}
                label={style === 'line' ? t('iconStyleLine') : style === 'fill' ? t('iconStyleFill') : t('iconStyleMonochrome')}
                onClick={() => setIconStyle(style)}
              />
            ))}
          </div>
        </SettingGroup>
      </div>
    </div>
  );
}

function SettingGroup({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: typeof Thermometer;
  title: string;
}) {
  return (
    <section className="mobile-settings-row">
      <div className="mobile-settings-row__title">
        <Icon aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SettingOption({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon?: typeof Thermometer;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" data-active={active} onClick={onClick} role="radio" aria-checked={active}>
      {Icon && <Icon aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
