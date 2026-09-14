import styles from './page.module.css';
import { getJsonFromOneDrive } from '@/lib/graphClient';

export const metadata = {
  title: 'Wir über uns',
  description: 'Der PSV Salzburg Judo – Verein, Geschichte, Werte und unser Trainerteam.',
};

const VALUES = [
  { icon: '🤼', title: 'Gemeinschaft', text: 'Bei uns steht das Miteinander im Vordergrund — auf der Matte und darüber hinaus.' },
  { icon: '🧘', title: 'Respekt', text: 'Judo lehrt Respekt gegenüber Trainingspartnern, Trainern und sich selbst.' },
  { icon: '🏅', title: 'Leistung', text: 'Von Anfänger bis zum Wettkampfjudoka — wir fördern jeden auf seinem Niveau.' },
  { icon: '👨‍👩‍👧', title: 'Familie', text: 'Kinder, Jugendliche und Erwachsene trainieren gemeinsam in einer familiären Atmosphäre.' },
];

export default async function WirUeberUnsPage() {
  const TRAINERS = await getJsonFromOneDrive('trainers.json', []);

  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Wir über uns</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>
            PSV Salzburg – Sektion Judo
          </p>
        </div>
      </div>
      <div className="container section-sm">
        <div className={styles.intro}>
          <div>
            <div className="divider" />
            <h2 className="section-title">Der Verein</h2>
            <p style={{ marginTop: 16, fontSize: '1.05rem', maxWidth: 640 }}>
              Der PSV Salzburg – Sektion Judo ist eine der traditionsreichsten Judosektionen
              des Bundeslandes Salzburg. Wir bieten qualitätvolles Judotraining für Kinder ab
              4 Jahren, Jugendliche und Erwachsene — vom Anfänger bis zum Wettkampfathleten.
            </p>
            <p style={{ marginTop: 12, fontSize: '1.05rem', maxWidth: 640 }}>
              Unser Training verbindet sportliche Exzellenz mit den Grundwerten des Judo:
              Respekt, Disziplin und Gemeinschaft. In der 2. Österreichischen Judo-Bundesliga
              messen wir uns mit den besten Vereinen des Landes.
            </p>
          </div>
          <div className={styles.introStats}>
            {[
              { n: '4+', l: 'Min. Alter' },
              { n: '2021', l: 'Online seit' },
              { n: '321', l: 'Berichte' },
              { n: '10', l: 'Trainer' },
            ].map(s => (
              <div key={s.l} className={styles.introStat}>
                <span className={styles.introNum}>{s.n}</span>
                <span className={styles.introLabel}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 64 }}>
          <div className="divider" />
          <h2 className="section-title">Unsere Werte</h2>
          <div className={styles.valuesGrid} style={{ marginTop: 32 }}>
            {VALUES.map(v => (
              <div key={v.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>{v.icon}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 64 }}>
          <div className="divider" />
          <h2 className="section-title">Unser Trainerteam</h2>
          <div className={styles.trainersGrid} style={{ marginTop: 32 }}>
            {TRAINERS.map(t => (
              <div key={t.name} className={styles.trainerCard}>
                {t.image ? (
                  <img src={t.image} alt={t.name} className={styles.trainerAvatar} style={{ objectFit: 'cover', padding: 0 }} />
                ) : (
                  <div className={styles.trainerAvatar}>
                    {t.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                )}
                <div>
                  <div className={styles.trainerName}>{t.name}</div>
                  <div className={styles.trainerRole}>{t.role}</div>
                  <div className={styles.trainerDay}>{t.day}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.contact}>
          <h3>Kontakt</h3>
          <p>
            PSV Salzburg – Sektion Judo<br />
            Plainstraße 37, 5020 Salzburg<br />
            <a href="mailto:office@psv-judo.at" style={{ color: 'var(--primary)' }}>office@psv-judo.at</a>
          </p>
        </div>
      </div>
    </>
  );
}
