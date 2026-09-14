'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { formatDate } from '../../lib/utils';
import styles from './NewsCarousel.module.css';

const INTERVAL = 5000;

export default function NewsCarousel({ articles }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const next = useCallback(() => setCurrent(c => (c + 1) % articles.length), [articles.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + articles.length) % articles.length), [articles.length]);

  useEffect(() => {
    if (paused || articles.length <= 1) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [paused, next, articles.length]);

  if (!articles.length) return null;
  const article = articles[current];

  return (
    <div className={styles.carousel} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={styles.slideContainer}>
        {articles.map((a, i) => (
          <div key={a.slug} className={`${styles.slide} ${i === current ? styles.active : ''}`} aria-hidden={i !== current}>
            <div className={styles.imgWrap}>
              {a.image ? <img src={a.image} alt={a.title} className={styles.img} /> : <div className={styles.imgPlaceholder} />}
              <div className={styles.overlay} />
            </div>
            <div className={styles.content}>
              <div className={styles.meta}>
                {a.categories.slice(0, 2).map(cat => <span key={cat} className="pill">{cat}</span>)}
                <span className={styles.date}>{formatDate(a.date)}</span>
              </div>
              <h3 className={styles.title}>{a.title}</h3>
              <p className={styles.excerpt}>{a.excerpt}</p>
              <Link href={`/berichte/${a.year}/${a.month}/${a.slug}/`} className={`btn btn-primary ${styles.link}`}>
                Weiterlesen →
              </Link>
            </div>
          </div>
        ))}
      </div>
      <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Vorheriger">‹</button>
      <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Nächster">›</button>
      <div className={styles.dots}>
        {articles.map((_, i) => <button key={i} className={`${styles.dot} ${i === current ? styles.dotActive : ''}`} onClick={() => setCurrent(i)} aria-label={`Beitrag ${i + 1}`} />)}
      </div>
      <div className={styles.progress} key={`${current}-${paused}`}>
        <div className={`${styles.progressBar} ${!paused ? styles.progressAnimate : ''}`} />
      </div>
    </div>
  );
}
