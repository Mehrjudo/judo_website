import styles from './page.module.css';
export const dynamic = 'force-dynamic';
import { getJsonFromOneDrive } from '@/lib/graphClient';

export const metadata = { title: 'Trainingszeiten', description: 'Trainingszeiten des PSV Salzburg Judo.' };

export default async function TrainingszeitenPage() {
  const data = await getJsonFromOneDrive('trainingszeiten.json', { subtitle: '', schedule: {}, ferien: [] });
  
  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Trainingszeiten</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>{data.subtitle}</p>
        </div>
      </div>
      <div className={`container section-sm ${styles.wrapper}`}>
        {Object.entries(data.schedule).map(([day, rows]) => (
          <div key={day} className={styles.dayCard}>
            <h2 className={styles.dayTitle}><span className={styles.dayBullet} />{day}</h2>
            <div className={styles.tableWrap}>
              <table className="training-table">
                <thead><tr><th>Gruppe</th><th>Alter</th><th>Zeit</th><th>Trainer</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="td-group">{r.gruppe}{r.detail && <span className={styles.detail}> · {r.detail}</span>}</td>
                      <td>{r.alter}</td>
                      <td className="td-time">{r.zeit}</td>
                      <td className="td-trainer">{r.trainer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <div className={`${styles.dayCard} ${styles.ferienCard}`}>
          <h2 className={styles.dayTitle}><span className={styles.dayBullet} style={{ background: 'var(--gold)' }} />Ferientraining für Kinder</h2>
          <p className={styles.ferienNote}>An schulfreien Tagen findet (außer Dienstag) kein Training statt. In den Schulferien ist für alle Kinder nur am <strong>Dienstag</strong> (außer Feiertagen und Sommerpause) das ganze Jahr Training!</p>
          <div className={styles.tableWrap}>
            <table className="training-table">
              <thead><tr><th>Gruppe</th><th>Tag</th><th>Zeit</th></tr></thead>
              <tbody>{data.ferien.map((r, i) => <tr key={i}><td className="td-group">{r.gruppe}</td><td>{r.tag}</td><td className="td-time">{r.zeit}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>📍</span>
          <div><strong>Trainingsort</strong><p>PSV Salzburg · Plainstraße 37, 5020 Salzburg</p></div>
        </div>
      </div>
    </>
  );
}
