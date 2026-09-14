'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDate } from '../../lib/utils';
import styles from './NewsGrid.module.css';

const PAGE_SIZE = 24;

export default function NewsGrid({ articles, years }) {
  const [query, setQuery] = useState('');
  const [activeYear, setActiveYear] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return articles.filter(a => {
      if (activeYear !== 'all' && a.year !== activeYear) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || 
             a.categories.some(c => c.toLowerCase().includes(q)) || 
             (a.text && a.text.includes(q));
    });
  }, [articles, query, activeYear]);

  const handleQuery = (v) => { setQuery(v); setPage(1); };
  const handleYear  = (y) => { setActiveYear(y); setPage(1); };
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="berichte-search" type="search" className={styles.searchInput} placeholder="Beiträge durchsuchen…" value={query} onChange={e => handleQuery(e.target.value)} />
          {query && <button className={styles.clearBtn} onClick={() => handleQuery('')} aria-label="Suche löschen">✕</button>}
        </div>
        <div className={styles.yearFilter}>
          <button className={`${styles.yearBtn} ${activeYear === 'all' ? styles.yearActive : ''}`} onClick={() => handleYear('all')}>Alle</button>
          {years.map(y => (
            <button key={y} className={`${styles.yearBtn} ${activeYear === y ? styles.yearActive : ''}`} onClick={() => handleYear(y)}>{y}</button>
          ))}
        </div>
      </div>
      <p className={styles.resultCount}>{filtered.length === articles.length ? `${filtered.length} Beiträge` : `${filtered.length} von ${articles.length} Beiträgen`}</p>
      {visible.length === 0 ? (
        <div className={styles.empty}>
          <span>🔍</span>
          <p>Keine Beiträge gefunden für „{query}"</p>
          <button className="btn btn-outline" onClick={() => { handleQuery(''); handleYear('all'); }}>Filter zurücksetzen</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map(a => (
            <Link key={`${a.year}-${a.month}-${a.slug}`} href={`/berichte/${a.year}/${a.month}/${a.slug}/`} className="news-card">
              {a.image ? <img src={a.image} alt={a.title} className="news-card-img" loading="lazy" /> : <div className="news-card-img-placeholder">🥋</div>}
              <div className="news-card-body">
                <div className="news-card-meta">
                  {a.categories.slice(0, 2).map(c => <span key={c} className="pill">{c}</span>)}
                  <span className="news-card-date">{formatDate(a.date)}</span>
                </div>
                <h2 className="news-card-title">{a.title}</h2>
                <p className="news-card-excerpt">{a.excerpt}</p>
                <div className="news-card-footer"><span className="btn btn-ghost">Weiterlesen →</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ''}`} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Zurück</button>
          <div className={styles.pageNums}>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
              return <button key={p} className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ''}`} onClick={() => { setPage(p); window.scrollTo({ top: 300, behavior: 'smooth' }); }}>{p}</button>;
            })}
          </div>
          <button className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ''}`} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Weiter →</button>
        </div>
      )}
    </>
  );
}
