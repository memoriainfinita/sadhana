import { Bell, MoreHorizontal } from 'lucide-react';
import { useT } from '../i18n/useT.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatDuration, formatRelativeDate } from '../i18n/format.js';
import { sessionDisplay } from '../domain/session.js';

export function RecentSessions({ sessions = [], onViewAll, onRepeatSession, onDeleteSession }) {
  const t = useT();
  const { lang } = useLang();
  return (
    <section className="recent-panel" aria-label={t('sessions.sectionLabel')}>
      <div className="section-header">
        <h2>{t('sessions.heading')}</h2>
        <button type="button" onClick={onViewAll}>{t('sessions.viewAll')}</button>
      </div>
      {sessions.length === 0 ? (
        <p className="empty-state">{t('sessions.empty')}</p>
      ) : (
        <div className="recent-grid">
          {sessions.slice(0, 4).map((item) => {
            const Icon = item.icon ?? Bell;
            const { name, duration, when } = sessionDisplay(
              item,
              t,
              (s) => formatDuration(s, lang),
              (d) => formatRelativeDate(d, lang)
            );
            return (
              <article className="recent-card" key={item.id} style={{ '--cue-color': item.color ?? '#f6a133' }}>
                <Icon size={31} />
                <div>
                  <h3>{name}</h3>
                  <p>{duration} <span>•</span> {when}</p>
                </div>
                <div className="recent-actions" aria-label={t('sessions.optionsAria', { name })}>
                  <button type="button" onClick={() => onRepeatSession?.(item)} aria-label={t('sessions.repeatAria', { name })} title={t('sessions.repeatTitle', { name })}>
                    <MoreHorizontal size={16} />
                    {t('sessions.repeat')}
                  </button>
                  <button type="button" onClick={() => onDeleteSession?.(item.id)} aria-label={t('sessions.deleteAria', { name })} title={t('sessions.deleteTitle', { name })}>
                    {t('sessions.delete')}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
