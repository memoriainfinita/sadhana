import { Bell, MoreHorizontal } from 'lucide-react';

export function RecentSessions({ sessions = [], onViewAll, onRepeatSession, onDeleteSession }) {
  return (
    <section className="recent-panel" aria-label="Ultimas sesiones">
      <div className="section-header">
        <h2>Ultimas sesiones</h2>
        <button type="button" onClick={onViewAll}>Ver todo</button>
      </div>
      {sessions.length === 0 ? (
        <p className="empty-state">Aún no has completado ninguna sesión. Practica y aparecerán aquí.</p>
      ) : (
        <div className="recent-grid">
          {sessions.slice(0, 4).map((item) => {
            const Icon = item.icon ?? Bell;
            return (
              <article className="recent-card" key={item.id} style={{ '--cue-color': item.color ?? '#f6a133' }}>
                <Icon size={31} />
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.duration} <span>•</span> {item.when}</p>
                </div>
                <div className="recent-actions" aria-label={`Opciones de ${item.name}`}>
                  <button type="button" onClick={() => onRepeatSession?.(item)} aria-label={`Repetir ${item.name}`} title={`Ir a Practicar con la sesion: ${item.name}`}>
                    <MoreHorizontal size={16} />
                    Repetir
                  </button>
                  <button type="button" onClick={() => onDeleteSession?.(item.id)} aria-label={`Eliminar ${item.name}`} title={`Eliminar sesion: ${item.name}`}>
                    Eliminar
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
