import { Settings, SunMedium, Volume2 } from 'lucide-react';
import { ModeTabs } from './ModeTabs.jsx';

function BrandMark() {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="Sadhana">
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
  return (
    <div className="sadhana-shell">
      <header className="topbar">
        <div className="brand" aria-label="Sadhana">
          <div className="brand-mark" aria-hidden="true">
            <BrandMark />
          </div>
          <span>Sadhana</span>
        </div>

        <ModeTabs activeMode={activeMode} onModeChange={onModeChange} />

        <div className="topbar-actions" aria-label="Controles globales">
          <button
            className={activePanel === 'theme' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Tema"
            title="Tema y color de acento"
            onClick={() => onPanelChange(activePanel === 'theme' ? null : 'theme')}
          >
            <SunMedium size={19} />
          </button>
          <button
            className={activePanel === 'audio' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Audio"
            title="Volumen y silencio"
            onClick={() => onPanelChange(activePanel === 'audio' ? null : 'audio')}
          >
            <Volume2 size={19} />
          </button>
          <button
            className={activePanel === 'settings' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Configuracion"
            title="Exportar / importar datos"
            onClick={() => onPanelChange(activePanel === 'settings' ? null : 'settings')}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>

      {children}
    </div>
  );
}
