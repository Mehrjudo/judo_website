import { getAllArticles } from '../../lib/news';
export const dynamic = 'force-dynamic';
import NewsGrid from './NewsGrid';

export const metadata = {
  title: 'Berichte',
  description: 'Alle Neuigkeiten, Turnierergebnisse und Berichte vom PSV Salzburg Judo — durchsuchbar und nach Datum sortiert.',
};

export default async function BerichtePage() {
  const articles = await getAllArticles();
  const years = [...new Set(articles.map(a => a.year))].sort((a, b) => b - a);
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Berichte</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>{articles.length} Beiträge · 2021 – 2026</p>
        </div>
      </div>
      <div className="container">
        <NewsGrid articles={articles} years={years} />
      </div>
    </>
  );
}
