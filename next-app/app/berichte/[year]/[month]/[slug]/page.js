import { getAllArticles, getArticleBySlug } from '../../../../../lib/news';
import { formatDate } from '../../../../../lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map(a => ({ year: a.year, month: a.month, slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.year, params.month, params.slug);
  if (!article) return {};
  return { title: article.title, description: `${article.title} – PSV Salzburg Judo`, openGraph: { title: article.title, images: article.image ? [{ url: article.image }] : [] } };
}

export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.year, params.month, params.slug);
  if (!article) notFound();

  return (
    <article>
      <div className={styles.hero}>
        {article.image && <img src={article.image} alt={article.title} className={styles.heroImg} />}
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.meta}>
            {article.categories.map(c => <span key={c} className="pill">{c}</span>)}
            <span className={styles.date}>{formatDate(article.date)}</span>
          </div>
          <h1 className={styles.title}>{article.title}</h1>
        </div>
      </div>
      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <Link href="/berichte/" className={`btn btn-outline ${styles.backBtn}`}>← Alle Berichte</Link>
            {article.sourceUrl && <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className={styles.origLink}>Originalbeitrag ↗</a>}
          </aside>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }} />
        </div>
      </div>
      <div className="container" style={{ padding: '48px 24px' }}>
        <Link href="/berichte/" className="btn btn-outline">← Zurück zu allen Berichten</Link>
      </div>
    </article>
  );
}
