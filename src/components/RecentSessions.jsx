import { Bell, MoreHorizontal, TreePine, Waves } from 'lucide-react';

const fallbackSessions = [
  { id: 'morning', name: 'Mañana tranquila', duration: '24 min', when: 'Hoy, 07:12', icon: Bell, color: '#f6a133', sample: true },
  { id: 'walk', name: 'Paseo consciente', duration: '18 min', when: 'Ayer, 19:30', icon: TreePine, color: '#9bb56f', sample: true },
  { id: 'deep', name: 'Relajación profunda', duration: '30 min', when: 'Ayer, 07:45', icon: Waves, color: '#b886d0', sample: true },
  { id: 'breath', name: 'Respiración', duration: '12 min', when: 'Anteayer, 21:10', icon: Bell, color: '#f6a133', sample: true },
];

export function RecentSessions({ sessions = [], onViewAll, onRepeatSession, onDeleteSession }) {
  const items = sessions.length > 0 ? sessions : fallbackSessions;

  return (
    <section className="recent-panel" aria-label="Ultimas sesiones">
      <div className="recent-header">
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
                <button type="button" onClick={() => onRepeatSession?.(item)} aria-label={`Repetir ${item.name}`}>
                  <MoreHorizontal size={16} />
                  Repetir
                </button>
                {!item.sample && (
                  <button type="button" onClick={() => onDeleteSession?.(item.id)} aria-label={`Eliminar ${item.name}`}>
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
