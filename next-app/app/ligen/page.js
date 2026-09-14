import styles from './page.module.css';

export const metadata = {
  title: 'Ligen',
  description: 'PSV Salzburg Judo in der Österreichischen Judo-Bundesliga und regionalen Ligen.',
};

const LIGEN = [
  {
    name: 'Österreichische Judo Bundesliga',
    short: 'ÖBL',
    level: 'National',
    description: 'Die höchste Ligaebene im österreichischen Vereinsjudo. PSV Salzburg kämpft in der 2. Judo-Bundesliga und tritt gegen die besten Vereine Österreichs an.',
    categories: ['Damen', 'Herren'],
    icon: '🏆',
  },
  {
    name: 'Österreichische Judo-Landesliga Salzburg',
    short: 'LLS',
    level: 'Regional',
    description: 'Die stärkste regionale Liga des Bundeslandes Salzburg. Wettkampf-Judo auf höchstem Landesni­veau.',
    categories: ['U18', 'U21', 'Allgemein'],
    icon: '🥇',
  },
  {
    name: 'Nachwuchsliga / Schülerliga',
    short: 'NWL',
    level: 'Nachwuchs',
    description: 'Ligabetrieb für U10 bis U16 auf regionaler Ebene. Ideales Format für erste Wettkampferfahrungen.',
    categories: ['U10', 'U12', 'U14', 'U16'],
    icon: '⭐',
  },
];

export default function LigenPage() {
  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Ligen</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>
            PSV Salzburg im Wettkampfbetrieb
          </p>
        </div>
      </div>
      <div className={`container section-sm ${styles.wrapper}`}>
        <div className={styles.grid}>
          {LIGEN.map(liga => (
            <div key={liga.short} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.icon}>{liga.icon}</span>
                <span className={styles.level}>{liga.level}</span>
              </div>
              <h2 className={styles.ligaName}>{liga.name}</h2>
              <p className={styles.desc}>{liga.description}</p>
              <div className={styles.categories}>
                {liga.categories.map(c => (
                  <span key={c} className="pill">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={styles.infoSection}>
          <div className={styles.infoBox}>
            <h3>Ergebnisse &amp; Berichte</h3>
            <p>
              Alle Wettkampfergebnisse, Turnierberichte und Ligaergebnisse finden Sie in unseren
              aktuellen <a href="/berichte/" style={{ color: 'var(--primary)' }}>Berichten</a>.
            </p>
          </div>
          <div className={styles.infoBox}>
            <h3>Für Wettkämpfer</h3>
            <p>
              Interesse am Wettkampfjudo? Kontaktiere uns unter{' '}
              <a href="mailto:office@psv-judo.at" style={{ color: 'var(--primary)' }}>office@psv-judo.at</a>{' '}
              oder komm direkt zum Training!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
