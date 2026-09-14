'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/',                      label: 'Startseite' },
  { href: '/berichte/',             label: 'Berichte' },
  { href: '/trainingszeiten/',      label: 'Trainingszeiten' },
  { href: '/ligen/',                label: 'Ligen' },
  { href: '/wir-ueber-uns/',        label: 'Wir über uns' },
  { href: '/unsere-unterstuetzer/', label: 'Unterstützer' },
  { href: '/gratis-schnuppern/',    label: 'Gratis Schnuppern', highlight: true },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentPath = pathname || '';

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoTextWrapper}>
            <span className={styles.logoTop}>PSV Salzburg</span>
            <span className={styles.logoBottom}>JUDO</span>
          </span>
          <img src="/logo.jpg" alt="PSV Salzburg Judo" className={styles.logoImg} />
        </Link>
        <nav className={styles.nav}>
          {NAV_LINKS.map(({ href, label, highlight }) => {
            const active = currentPath === href || (href !== '/' && currentPath.startsWith(href));
            return (
              <Link key={href} href={href} className={`${styles.link} ${active ? styles.active : ''} ${highlight ? styles.highlight : ''}`}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin/login" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
            Login
          </Link>
          {mounted && (
            <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          )}
          <button className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} onClick={() => setOpen(v => !v)} aria-label="Menü">
            <span /><span /><span />
          </button>
        </div>
      </div>
      <div className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}>
        <nav className={styles.drawerNav}>
          {NAV_LINKS.map(({ href, label, highlight }) => {
            const active = currentPath === href || (href !== '/' && currentPath.startsWith(href));
            return (
              <Link key={href} href={href} className={`${styles.drawerLink} ${active ? styles.drawerActive : ''} ${highlight ? styles.drawerHighlight : ''}`}>
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
