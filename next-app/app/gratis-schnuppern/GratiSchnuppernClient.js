'use client';
import { useState } from 'react';
import styles from './page.module.css';

const PREFIXES = [
  { code: '+43', label: 'Austria +43' },
  { code: '+49', label: 'Germany +49' },
  { code: '+41', label: 'Switzerland +41' },
];

export default function GratiSchnuppernClient({ initialData }) {
  const [selected, setSelected] = useState({});
  const [prefix, setPrefix] = useState('+43');
  const [submitted, setSubmitted] = useState(false);

  const courses = initialData?.courses || [];
  const infoCards = initialData?.infoCards || [];
  const subtitle = initialData?.subtitle || '';

  const toggleCourse = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const selectedCourses = courses.filter(c => selected[c.id]).map(c => c.label);
    data.append('kurse', selectedCourses.join(', '));
    await fetch('https://formspree.io/f/YOUR_FORM_ID', {
      method: 'POST', body: data,
      headers: { Accept: 'application/json' },
    }).catch(() => {});
    setSubmitted(true);
  };

  return (
    <>
      <div className="page-hero">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="divider" style={{ margin: '0 auto 20px' }} />
          <h1>Gratis Schnuppern</h1>
          <p className="text-muted" style={{ marginTop: 12, fontSize: '1.05rem' }}>
            {subtitle}
          </p>
        </div>
      </div>
      <div className="container">
        <div className={styles.layout}>
          <div className={styles.info}>
            {infoCards.map((card, idx) => (
              <div key={idx} className={styles.infoCard}>
                <h2 className={styles.infoTitle}>{card.icon} {card.title}</h2>
                <p className={styles.infoSubtitle}>{card.subtitle}</p>
                <div className={styles.courseList}>
                  {(card.items || []).map(c => (
                    <div key={c.label} className={styles.courseItem}>
                      <div className={styles.courseLabel}>{c.label}</div>
                      <div className={styles.courseMeta}>
                        <span className="pill pill-gold">{c.alter}</span>
                        <span>{c.tag} · {c.zeit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className={styles.noteCard}>
              <span>📍</span>
              <div>
                <strong>PSV Salzburg – Sektion Judo</strong>
                <p>Plainstraße 37, 5020 Salzburg<br />Ausreichend Parkplätze vorhanden</p>
              </div>
            </div>
          </div>
          <div className={styles.formWrap}>
            {submitted ? (
              <div className={styles.successBox}>
                <span className={styles.successIcon}>✅</span>
                <h3>Anmeldung erhalten!</h3>
                <p>
                  Vielen Dank! Sie erhalten unter der angegebenen E-Mail-Adresse eine
                  Bestätigung und weitere Informationen für den ersten Trainingstag.
                </p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h2 className={styles.formTitle}>Online Anmeldung</h2>
                <p className={styles.formSubtitle}>Kursangebot</p>
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="nachname">Nachname *</label>
                    <input id="nachname" name="nachname" className="form-input" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="vorname">Vorname *</label>
                    <input id="vorname" name="vorname" className="form-input" required />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="geschlecht">Geschlecht *</label>
                    <select id="geschlecht" name="geschlecht" className="form-select" required>
                      <option value="">Bitte wählen</option>
                      <option>Männlich</option>
                      <option>Weiblich</option>
                      <option>Divers</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="geburtsdatum">Geburtsdatum *</label>
                    <input id="geburtsdatum" name="geburtsdatum" type="date" className="form-input" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">E-Mail *</label>
                  <input id="email" name="email" type="email" className="form-input" required placeholder="wird für die Bestätigung verwendet" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="telefon">Telefon- / Handynummer</label>
                  <div className={styles.phoneRow}>
                    <select className={`form-select ${styles.prefixSelect}`} name="prefix" value={prefix} onChange={e => setPrefix(e.target.value)}>
                      {PREFIXES.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
                    </select>
                    <input id="telefon" name="telefon" type="tel" className="form-input" placeholder="Telefonnummer" />
                  </div>
                </div>
                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>Kursangebot auswählen *</legend>
                  {courses.map(c => (
                    <label key={c.id} className={`form-checkbox-group ${styles.checkLabel}`}>
                      <input type="checkbox" className="form-checkbox" checked={!!selected[c.id]} onChange={() => toggleCourse(c.id)} />
                      <span className="form-checkbox-label">{c.label}</span>
                    </label>
                  ))}
                </fieldset>
                <div className="form-group">
                  <label className="form-label" htmlFor="info">Zusätzliche Informationen</label>
                  <textarea id="info" name="info" className="form-textarea" rows={3} />
                </div>
                <label className={`form-checkbox-group ${styles.consentLabel}`}>
                  <input type="checkbox" className="form-checkbox" required />
                  <span className="form-checkbox-label" style={{ fontSize: '0.8rem' }}>
                    Ich stimme zu, dass meine persönlichen Daten zum Zwecke der Kontaktaufnahme durch den
                    PSV Salzburg – Judo verarbeitet werden. Eine Weitergabe erfolgt nicht.
                    Widerruf jederzeit per E-Mail an{' '}
                    <a href="mailto:office@psv-judo.at" style={{ color: 'var(--primary)' }}>office@psv-judo.at</a>. *
                  </span>
                </label>
                <p className={styles.formNote}>
                  * Sollten Sie für eine Trainingsstunde verhindert sein, bitten wir Sie per E-Mail
                  abzusagen. Vielen Dank!
                </p>
                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`}>
                  Anmeldung absenden →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
