import Link from 'next/link';
export const dynamic = 'force-dynamic';
import { getAllArticles } from '../lib/news';
import { formatDate } from '../lib/utils';
import NewsCarousel from './components/NewsCarousel';
import styles from './page.module.css';

export const metadata = {
  title: 'PSV Salzburg – Judo | die JUDO Anlaufstelle in Salzburg',
  description: 'PSV Salzburg Judo – Judo für alle: Kinder, Jugend und Erwachsene in Salzburg. Gratis Schnuppern ab 28. September 2026.',
};

export default async function HomePage() {
  const allArticles = await getAllArticles();
  const latestFive = allArticles.slice(0, 5);



  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContainer}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}><span>🥋</span> die JUDO Anlaufstelle in Salzburg</div>
            <h1 className={styles.heroTitle}>PSV Salzburg<br /><span className={styles.heroRed}>JUDO</span></h1>
            <p className={styles.heroSub}>Judo für Kinder, Jugend und Erwachsene — mitten in Salzburg. Werde Teil unserer Gemeinschaft.</p>
            <div className={styles.heroCtas}>
              <Link href="/gratis-schnuppern/" className="btn btn-primary">Gratis Schnuppern →</Link>
              <Link href="/berichte/" className="btn btn-outline">Aktuelle Berichte</Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            {[
              { n: `${allArticles.length}+`, l: 'Berichte' },
              { n: '10', l: 'Trainer' },
              { n: '2021', l: 'Online seit' },
            ].map((s, i) => (
              <div key={i} className={styles.statGroup}>
                {i > 0 && <div className={styles.statDivider} />}
                <div className={styles.stat}>
                  <span className={styles.statNum}>{s.n}</span>
                  <span className={styles.statLabel}>{s.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest news carousel */}
      <section className={`section ${styles.newsSection}`}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <div className="divider" />
              <h2 className="section-title">Aktuelle Berichte</h2>
              <p className="section-subtitle">Die neuesten Nachrichten vom PSV Salzburg Judo</p>
            </div>
            <Link href="/berichte/" className="btn btn-outline">Alle Berichte →</Link>
          </div>
          <NewsCarousel articles={latestFive} />
        </div>
      </section>



      {/* 3 more recent articles */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div><div className="divider" /><h2 className="section-title">Weitere Berichte</h2></div>
            <Link href="/berichte/" className="btn btn-ghost">Alle anzeigen →</Link>
          </div>
          <div className={styles.recentGrid}>
            {allArticles.slice(5, 8).map(a => (
              <Link key={a.slug} href={`/berichte/${a.year}/${a.month}/${a.slug}/`} className="news-card">
                {a.image ? <img src={a.image} alt={a.title} className="news-card-img" /> : <div className="news-card-img-placeholder">🥋</div>}
                <div className="news-card-body">
                  <div className="news-card-meta">
                    {a.categories.slice(0, 1).map(c => <span key={c} className="pill">{c}</span>)}
                    <span className="news-card-date">{formatDate(a.date)}</span>
                  </div>
                  <h3 className="news-card-title">{a.title}</h3>
                  <div className="news-card-footer"><span className="btn btn-ghost">Weiterlesen →</span></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className="container">
          <div className={styles.ctaInner}>
            <div>
              <h2 className={styles.ctaTitle}>Jetzt gratis schnuppern!</h2>
              <p className={styles.ctaSub}>Judo Anfängerkurse Herbst 2026 — ab 28. September für Kinder, Jugend &amp; Erwachsene.</p>
            </div>
            <Link href="/gratis-schnuppern/" className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700 }}>
              Jetzt anmelden →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
