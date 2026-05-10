import { BookOpen, Settings, SlidersHorizontal, SunMedium, Volume2 } from 'lucide-react';
import { ModeTabs } from './ModeTabs.jsx';

export function AppShell({ activeMode, onModeChange, activePanel, onPanelChange, children }) {
  return (
    <div className="sadhana-shell">
      <header className="topbar">
        <div className="brand" aria-label="Sadhana">
          <div className="brand-mark" aria-hidden="true">
            <BookOpen size={19} />
          </div>
          <span>Sadhana</span>
        </div>

        <ModeTabs activeMode={activeMode} onModeChange={onModeChange} />

        <div className="topbar-actions" aria-label="Controles globales">
          <button
            className={activePanel === 'practice' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Ajustes de practica"
            onClick={() => onPanelChange(activePanel === 'practice' ? null : 'practice')}
          >
            <SlidersHorizontal size={19} />
          </button>
          <button
            className={activePanel === 'theme' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Tema"
            onClick={() => onPanelChange(activePanel === 'theme' ? null : 'theme')}
          >
            <SunMedium size={19} />
          </button>
          <button
            className={activePanel === 'audio' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Audio"
            onClick={() => onPanelChange(activePanel === 'audio' ? null : 'audio')}
          >
            <Volume2 size={19} />
          </button>
          <button
            className={activePanel === 'settings' ? 'icon-button active' : 'icon-button'}
            type="button"
            aria-label="Configuracion"
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
