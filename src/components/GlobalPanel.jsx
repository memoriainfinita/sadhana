import { useEffect, useRef } from 'react';
import { useT } from '../i18n/useT.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { LANGUAGES } from '../i18n/index.js';

const ACCENT_PRESETS = [
  { key: 'amber', value: '#f6a133' },
  { key: 'gold', value: '#e8c547' },
  { key: 'sage', value: '#7eb87a' },
  { key: 'cyan', value: '#4db8b5' },
  { key: 'rose', value: '#e07070' },
  { key: 'lilac', value: '#9b8bc8' },
];

export function GlobalPanel({
  activePanel,
  onClose,
  theme,
  onThemeToggle,
  accentColor,
  onAccentColorChange,
  masterVolume,
  onMasterVolumeChange,
  muted,
  onMutedChange,
  onStopAudio,
  onExportData,
  onImportData,
  showSoundNames,
  onShowSoundNamesChange,
}) {
  const t = useT();
  const { lang, setLang } = useLang();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!activePanel) return;
    // Move focus into the panel each time it opens or switches panels.
    const node = panelRef.current;
    if (!node) return;
    const focusable = node.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? node).focus();
  }, [activePanel]);

  if (!activePanel) return null;

  return (
    <aside className="global-panel" ref={panelRef} tabIndex={-1} aria-label={t('shell.globalControls')}>
      <div className="global-panel-header">
        <span>{t('panel.header')}</span>
        <button type="button" title={t('panel.closeTitle')} onClick={onClose}>{t('panel.close')}</button>
      </div>

      {activePanel === 'theme' && (
        <>
          <h2>{t('theme.heading')}</h2>
          <button type="button" title={t('theme.toggleTitle')} onClick={onThemeToggle}>
            {theme === 'dim' ? t('theme.useContrast') : t('theme.useDim')}
          </button>
          <label>
            {t('theme.accentLabel')}
            <div className="accent-presets">
              {ACCENT_PRESETS.map((preset) => {
                const label = t('theme.accents.' + preset.key);
                return (
                  <button
                    key={preset.value}
                    type="button"
                    className={`accent-swatch${accentColor === preset.value ? ' active' : ''}`}
                    style={{ background: preset.value }}
                    aria-label={label}
                    aria-pressed={accentColor === preset.value}
                    title={label}
                    onClick={() => onAccentColorChange(preset.value)}
                  />
                );
              })}
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onAccentColorChange(e.target.value)}
                aria-label={t('theme.customColor')}
                title={t('theme.customColor')}
                className="accent-color-input"
              />
            </div>
          </label>
        </>
      )}

      {activePanel === 'audio' && (
        <>
          <h2>{t('audio.heading')}</h2>
          <label>
            {t('audio.masterVolume')}
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(event) => onMasterVolumeChange(Number(event.target.value))}
            />
            <span>{masterVolume}%</span>
          </label>
          <label className="check-row">
            <input type="checkbox" checked={muted} onChange={(event) => onMutedChange(event.target.checked)} />
            {t('audio.mute')}
          </label>
          <button type="button" title={t('audio.stopTitle')} onClick={onStopAudio}>{t('audio.stop')}</button>
        </>
      )}

      {activePanel === 'settings' && (
        <>
          <h2>{t('settings.heading')}</h2>
          <label className="check-row">
            <input
              type="checkbox"
              checked={showSoundNames}
              onChange={(event) => onShowSoundNamesChange(event.target.checked)}
            />
            {t('settings.showSoundNames')}
          </label>
          <label className="settings-language">
            {t('settings.language')}
            <select value={lang} onChange={(event) => setLang(event.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.native}</option>
              ))}
            </select>
          </label>
          <button type="button" title={t('settings.exportTitle')} onClick={onExportData}>{t('settings.export')}</button>
          <textarea
            placeholder={t('settings.importPlaceholder')}
            onBlur={(event) => {
              if (event.target.value.trim()) onImportData(event.target.value);
            }}
          />
        </>
      )}
    </aside>
  );
}
