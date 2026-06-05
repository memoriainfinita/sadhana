import { Settings, SunMedium, Volume2 } from 'lucide-react';
import { ModeTabs } from './ModeTabs.jsx';

function NamasteMark() {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="Sadhana">
      <path d="M18.9 7.8c-3.1 3.1-5.3 7.6-6.2 12.7-.6 3.6.4 7.2 2.8 9.9l4.5 5" />
      <path d="M21.1 7.8c3.1 3.1 5.3 7.6 6.2 12.7.6 3.6-.4 7.2-2.8 9.9l-4.5 5" />
      <path d="M17.5 13.5 15 25.6" />
      <path d="m22.5 13.5 2.5 12.1" />
      <path d="M15.1 22.1c-2.6 2.3-2.8 5.5-.4 8.4" />
      <path d="M24.9 22.1c2.6 2.3 2.8 5.5.4 8.4" />
      <path d="M20 7.8v27.6" />
    </svg>
  );
}

export function AppShell({ activeMode, onModeChange, activePanel, onPanelChange, children }) {
  return (
    <div className="sadhana-shell">
      <header className="topbar">
        <div className="brand" aria-label="Sadhana">
          <div className="brand-mark" aria-hidden="true">
            <NamasteMark />
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
