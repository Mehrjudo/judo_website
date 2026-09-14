import styles from './page.module.css';

export const metadata = {
  title: 'Unsere Unterstützer',
  description: 'Die Sponsoren und Partner des PSV Salzburg Judo.',
};

const SUPPORTERS = [
  {
    name: 'PSV Salzburg',
    category: 'Hauptverein',
    description: 'Der Polizei-Sport-Verein Salzburg ist unser Hauptverein und gibt uns als Sektion Rückhalt und Infrastruktur.',
    url: 'https://www.psv-salzburg.at',
    icon: '🏛️',
  },
  {
    name: 'Land Salzburg – Sport',
    category: 'Sportförderung',
    description: 'Das Land Salzburg unterstützt den organisierten Sport im Bundesland durch gezielte Sportförderungen.',
    url: null,
    icon: '🏔️',
  },
  {
    name: 'Judo Austria',
    category: 'Dachverband',
    description: 'Als Mitglied im Österreichischen Judo-Verband (Judo Austria) sind wir Teil des nationalen Verbandssystems.',
    url: 'https://www.judo-austria.at',
    icon: '🥋',
  },
];

export default function UnsereUnterstuetzerPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Unsere Unterstützer</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>
            Partner und Förderer des PSV Salzburg Judo
          </p>
        </div>
      </div>
      <div className="container section-sm">
        <div className={styles.grid}>
          {SUPPORTERS.map(s => (
            <div key={s.name} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.icon}>{s.icon}</span>
                <span className="pill pill-gold">{s.category}</span>
              </div>
              <h2 className={styles.name}>{s.name}</h2>
              <p className={styles.desc}>{s.description}</p>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Website besuchen ↗
                </a>
              )}
            </div>
          ))}
        </div>
        <div className={styles.cta}>
          <h3>Werden Sie Unterstützer!</h3>
          <p>
            Sie möchten den PSV Salzburg Judo unterstützen? Wir freuen uns über Sponsorings jeder Art.
            Kontaktieren Sie uns unter{' '}
            <a href="mailto:office@psv-judo.at" style={{ color: 'var(--primary)' }}>office@psv-judo.at</a>.
          </p>
        </div>
      </div>
    </>
  );
}
