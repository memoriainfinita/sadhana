import { BookOpen, CirclePlay, SlidersHorizontal } from 'lucide-react';

const MODES = [
  { id: 'practice', label: 'Practicar', icon: CirclePlay },
  { id: 'design', label: 'Diseñar', icon: SlidersHorizontal },
  { id: 'remember', label: 'Recordar', icon: BookOpen },
];

export function ModeTabs({ activeMode, onModeChange }) {
  return (
    <nav className="mode-tabs" aria-label="Modos de Sadhana">
      {MODES.map((mode) => {
        const Icon = mode.icon;
        return (
          <button
            key={mode.id}
            className={activeMode === mode.id ? 'mode-tab active' : 'mode-tab'}
            type="button"
            onClick={() => onModeChange(mode.id)}
          >
            <Icon size={18} />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
