import { Settings, SunMedium, Volume2 } from 'lucide-react';
import { ModeTabs } from './ModeTabs.jsx';
import { useT } from '../i18n/useT.js';

function BrandMark({ label }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label={label}>
      <text
        x="20"
        y="21"
        fontFamily="Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="28"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
        textAnchor="middle"
        dominantBaseline="central"
      >
        S
      </text>
    </svg>
  );
}

export function AppShell({ activeMode, onModeChange, activePanel, onPanelChange, children }) {
  const t = useT();
  return (
    <div className="sadhana-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <BrandMark label={t('shell.brand')} />
          </div>
          <h1 className="brand-title">{t('shell.brand')}</h1>
        </div>

        <ModeTabs activeMode={activeMode} onModeChange={onModeChange} />

        <div className="topbar-actions" aria-label={t('shell.globalControls')}>
          <button
            className={activePanel === 'theme' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label={t('shell.theme')}
            title={t('shell.themeTitle')}
            aria-expanded={activePanel === 'theme'}
            onClick={(e) => onPanelChange(activePanel === 'theme' ? null : 'theme', e.currentTarget)}
          >
            <SunMedium size={19} />
          </button>
          <button
            className={activePanel === 'audio' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label={t('shell.audio')}
            title={t('shell.audioTitle')}
            aria-expanded={activePanel === 'audio'}
            onClick={(e) => onPanelChange(activePanel === 'audio' ? null : 'audio', e.currentTarget)}
          >
            <Volume2 size={19} />
          </button>
          <button
            className={activePanel === 'settings' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label={t('shell.settings')}
            title={t('shell.settingsTitle')}
            aria-expanded={activePanel === 'settings'}
            onClick={(e) => onPanelChange(activePanel === 'settings' ? null : 'settings', e.currentTarget)}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
