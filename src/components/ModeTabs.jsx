import { BookOpen, CirclePlay, SlidersHorizontal } from 'lucide-react';
import { useT } from '../i18n/useT.js';

const MODES = [
  { id: 'practice', icon: CirclePlay },
  { id: 'design', icon: SlidersHorizontal },
  { id: 'remember', icon: BookOpen },
];

export function ModeTabs({ activeMode, onModeChange }) {
  const t = useT();
  return (
    <nav className="mode-tabs" aria-label={t('modes.navLabel')}>
      {MODES.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            className={activeMode === mode.id ? 'mode-tab active' : 'mode-tab'}
            type="button"
            aria-current={activeMode === mode.id ? 'page' : undefined}
            onClick={() => onModeChange(mode.id)}
          >
            <Icon size={18} />
            <span>{t('modes.' + mode.id)}</span>
          </button>
        );
      })}
    </nav>
  );
}
