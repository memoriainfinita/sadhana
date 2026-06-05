import { Bell, MoreHorizontal, Waves } from 'lucide-react';

const fallbackSessions = [
  { id: 'sample-complete-session', name: 'Secuencia completa', duration: '24 min', when: 'Hoy, 07:12', icon: Bell, color: '#f6a133', sample: true },
  { id: 'sample-short-session', name: 'Sesion breve', duration: '12 min', when: 'Ayer, 21:10', icon: Waves, color: '#6fa7c4', sample: true },
];

export function RecentSessions({ sessions = [], onViewAll, onRepeatSession, onDeleteSession }) {
  const items = sessions.length > 0 ? sessions : fallbackSessions;

  return (
    <section className="recent-panel" aria-label="Ultimas sesiones">
      <div className="section-header">
        <h2>Ultimas sesiones</h2>
        <button type="button" onClick={onViewAll}>Ver todo</button>
      </div>
      <div className="recent-grid">
        {items.slice(0, 4).map((item) => {
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
                {!item.sample && (
                  <button type="button" onClick={() => onDeleteSession?.(item.id)} aria-label={`Eliminar ${item.name}`} title={`Eliminar sesion: ${item.name}`}>
                    Eliminar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
