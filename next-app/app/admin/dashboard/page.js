'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('news');

  // --- NEWS STATE ---
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsForm, setNewsForm] = useState({ title: '', date: '', excerpt: '', content: '' });
  const [editMode, setEditMode] = useState(null);
  const [coverImage, setCoverImage] = useState('');
  const [newsStatus, setNewsStatus] = useState({ type: '', message: '' });
  const [newsLoading, setNewsLoading] = useState(false);
  const quillRef = useRef(null);

  // --- TRAININGSZEITEN STATE ---
  const [trainingsData, setTrainingsData] = useState({ subtitle: '', schedule: {}, ferien: [] });
  const [trainingsLoading, setTrainingsLoading] = useState(false);
  const [trainingsStatus, setTrainingsStatus] = useState({ type: '', message: '' });

  // --- GRATIS SCHNUPPERN STATE ---
  const [gratisData, setGratisData] = useState({ subtitle: '', courses: [], infoCards: [] });
  const [gratisLoading, setGratisLoading] = useState(false);
  const [gratisStatus, setGratisStatus] = useState({ type: '', message: '' });

  // --- TRAINERS STATE ---
  const [trainersData, setTrainersData] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(false);
  const [trainersStatus, setTrainersStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (activeTab === 'news') fetchArticles();
    if (activeTab === 'trainingszeiten') fetchTrainingszeiten();
    if (activeTab === 'gratis') fetchGratisSchnuppern();
    if (activeTab === 'trainers') fetchTrainers();
  }, [activeTab]);

  // --- NEWS LOGIC ---
  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.success) setArticles(data.articles);
    } catch (err) {
      console.error('Failed to fetch articles', err);
    }
  };

  const handleNewsChange = (e) => {
    const { name, value } = e.target;
    setNewsForm(prev => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const contentImages = useMemo(() => {
    if (typeof window === 'undefined') return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(newsForm.content, 'text/html');
    return Array.from(doc.querySelectorAll('img')).map(img => img.src);
  }, [newsForm.content]);

  const handleDirectCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, 'news');
      setCoverImage(url);
    } catch (err) {
      alert('Failed to upload cover image.');
    }
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setNewsLoading(true);
    setNewsStatus({ type: '', message: '' });
    try {
      const method = editMode ? 'PUT' : 'POST';
      const bodyPayload = { ...newsForm, image: coverImage };
      if (editMode) {
        bodyPayload.originalYear = editMode.originalYear;
        bodyPayload.originalMonth = editMode.originalMonth;
        bodyPayload.originalSlug = editMode.originalSlug;
      }
      const res = await fetch('/api/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (!res.ok) throw new Error(editMode ? 'Failed to update news' : 'Failed to save news');
      setNewsStatus({ type: 'success', message: editMode ? 'News updated successfully!' : 'News published successfully!' });
      setNewsForm({ title: '', date: '', excerpt: '', content: '' });
      setEditMode(null);
      setCoverImage('');
      fetchArticles();
    } catch (err) {
      setNewsStatus({ type: 'error', message: err.message });
    } finally {
      setNewsLoading(false);
    }
  };

  const handleEdit = async (article) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNewsStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/news?year=${article.year}&month=${article.month}&slug=${article.slug}`);
      const data = await res.json();
      if (data.success && data.article) {
        const fullArticle = data.article;
        setNewsForm({
          title: fullArticle.title,
          date: fullArticle.date,
          excerpt: fullArticle.excerpt || '',
          content: fullArticle.body || '',
        });
        setCoverImage(fullArticle.image || '');
        setEditMode({ originalYear: article.year, originalMonth: article.month, originalSlug: article.slug });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load article details.');
    }
  };

  const handleDelete = async (article) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return;
    try {
      const res = await fetch(`/api/news?year=${article.year}&month=${article.month}&slug=${article.slug}`, { method: 'DELETE' });
      if (res.ok) fetchArticles();
      else alert('Failed to delete article.');
    } catch (err) {
      console.error(err);
      alert('Error deleting article.');
    }
  };

  const cancelEdit = () => {
    setEditMode(null);
    setNewsForm({ title: '', date: '', excerpt: '', content: '' });
    setNewsStatus({ type: '', message: '' });
    setCoverImage('');
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();
          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              try {
                const url = await uploadFile(file, 'news');
                const range = this.quill.getSelection(true);
                this.quill.insertEmbed(range.index, 'image', url);
              } catch (e) {
                console.error('Upload Error:', e);
                alert('Image upload failed: ' + e.message);
              }
            }
          };
        }
      }
    }
  }), []);

  // --- TRAININGSZEITEN LOGIC ---
  const fetchTrainingszeiten = async () => {
    try {
      const res = await fetch('/api/trainingszeiten');
      const json = await res.json();
      if (json.success && json.data) {
        setTrainingsData({
          subtitle: json.data.subtitle || '',
          schedule: json.data.schedule || {},
          ferien: json.data.ferien || []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrainingsSubmit = async () => {
    setTrainingsLoading(true);
    setTrainingsStatus({ type: '', message: '' });
    try {
      const res = await fetch('/api/trainingszeiten', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingsData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setTrainingsStatus({ type: 'success', message: 'Trainingszeiten updated successfully!' });
    } catch (err) {
      setTrainingsStatus({ type: 'error', message: err.message });
    } finally {
      setTrainingsLoading(false);
    }
  };

  // --- GRATIS SCHNUPPERN LOGIC ---
  const fetchGratisSchnuppern = async () => {
    try {
      const res = await fetch('/api/gratis-schnuppern');
      const json = await res.json();
      if (json.success && json.data) {
        setGratisData({
          subtitle: json.data.subtitle || '',
          courses: json.data.courses || [],
          infoCards: json.data.infoCards || []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGratisSubmit = async () => {
    setGratisLoading(true);
    setGratisStatus({ type: '', message: '' });
    try {
      const res = await fetch('/api/gratis-schnuppern', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gratisData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setGratisStatus({ type: 'success', message: 'Gratis Schnuppern updated successfully!' });
    } catch (err) {
      setGratisStatus({ type: 'error', message: err.message });
    } finally {
      setGratisLoading(false);
    }
  };

  // --- TRAINERS LOGIC ---
  const fetchTrainers = async () => {
    try {
      const res = await fetch('/api/trainers');
      const json = await res.json();
      if (json.success && json.data) {
        setTrainersData(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrainersSubmit = async () => {
    setTrainersLoading(true);
    setTrainersStatus({ type: '', message: '' });
    try {
      const res = await fetch('/api/trainers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainersData)
      });
      if (!res.ok) throw new Error('Failed to save');
      setTrainersStatus({ type: 'success', message: 'Trainerteam updated successfully!' });
    } catch (err) {
      setTrainersStatus({ type: 'error', message: err.message });
    } finally {
      setTrainersLoading(false);
    }
  };

  const handleTrainerImageUpload = async (index, file) => {
    if (!file) return;
    try {
      const url = await uploadFile(file, 'trainers');
      const newTrainers = [...trainersData];
      newTrainers[index].image = url;
      setTrainersData(newTrainers);
    } catch (err) {
      alert('Failed to upload trainer image.');
    }
  };


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '2px solid var(--border)', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('news')}
          style={{ padding: '12px 24px', fontWeight: 600, border: 'none', background: activeTab === 'news' ? 'var(--primary)' : 'transparent', color: activeTab === 'news' ? '#fff' : 'var(--text)', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
        >
          Manage News
        </button>
        <button 
          onClick={() => setActiveTab('trainingszeiten')}
          style={{ padding: '12px 24px', fontWeight: 600, border: 'none', background: activeTab === 'trainingszeiten' ? 'var(--primary)' : 'transparent', color: activeTab === 'trainingszeiten' ? '#fff' : 'var(--text)', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
        >
          Trainingszeiten
        </button>
        <button 
          onClick={() => setActiveTab('gratis')}
          style={{ padding: '12px 24px', fontWeight: 600, border: 'none', background: activeTab === 'gratis' ? 'var(--primary)' : 'transparent', color: activeTab === 'gratis' ? '#fff' : 'var(--text)', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
        >
          Gratis Schnuppern
        </button>
        <button 
          onClick={() => setActiveTab('trainers')}
          style={{ padding: '12px 24px', fontWeight: 600, border: 'none', background: activeTab === 'trainers' ? 'var(--primary)' : 'transparent', color: activeTab === 'trainers' ? '#fff' : 'var(--text)', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
        >
          Trainerteam
        </button>
      </div>

      {activeTab === 'news' && (
        <>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{editMode ? 'Edit News Article' : 'Create News Article'}</h2>
            <form onSubmit={handleNewsSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Title</label>
                <input name="title" type="text" required className={styles.input} value={newsForm.title} onChange={handleNewsChange} />
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Date (YYYY-MM-DD)</label>
                <input name="date" type="date" required className={styles.input} value={newsForm.date} onChange={handleNewsChange} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Excerpt</label>
                <ReactQuill theme="snow" value={newsForm.excerpt} onChange={(val) => setNewsForm(prev => ({ ...prev, excerpt: val }))} style={{ backgroundColor: '#fff', color: '#000', borderRadius: '4px' }} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Content</label>
                <ReactQuill ref={quillRef} theme="snow" value={newsForm.content} onChange={(val) => setNewsForm(prev => ({ ...prev, content: val }))} modules={modules} style={{ backgroundColor: '#fff', color: '#000', borderRadius: '4px' }} />
              </div>

              <div className={styles.inputGroup} style={{ marginTop: '20px', padding: '16px', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label className={styles.label}>Select Cover Image</label>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  Click on any image from your article below to set it as the Cover Image, or upload a specific one.
                </p>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {contentImages.map((src, i) => (
                    <img 
                      key={i} src={src} alt="Content" onClick={() => setCoverImage(src)}
                      style={{ 
                        width: '100px', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px',
                        border: coverImage === src ? '4px solid var(--primary)' : '2px solid transparent',
                        opacity: coverImage && coverImage !== src ? 0.6 : 1
                      }} 
                    />
                  ))}
                  {contentImages.length === 0 && <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No images inserted in content yet.</p>}
                </div>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="file" accept="image/*" className={styles.input} style={{ flex: 1 }} onChange={handleDirectCoverUpload} />
                  {coverImage && (
                    <button type="button" onClick={() => setCoverImage('')} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Clear Cover</button>
                  )}
                </div>
                {coverImage && (
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Selected Cover:</span>
                    <p style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{coverImage}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" disabled={newsLoading} className={styles.button}>
                  {newsLoading ? (editMode ? 'Updating...' : 'Publishing...') : (editMode ? 'Update News' : 'Publish News')}
                </button>
                {editMode && (
                  <button type="button" onClick={cancelEdit} className={`${styles.button} ${styles.btnOutline}`} style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
                )}
              </div>

              {newsStatus.message && (
                <div className={`${styles.message} ${newsStatus.type === 'success' ? styles.success : styles.error}`}>{newsStatus.message}</div>
              )}
            </form>
          </div>

          <div className={styles.section}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>Manage Articles</h2>
              <input type="text" placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.input} style={{ maxWidth: '300px' }} />
            </div>
            <div className={styles.articleList}>
              {articles
                .filter(a => {
                  const q = searchQuery.toLowerCase();
                  return a.title?.toLowerCase().includes(q) || a.text?.includes(q) || a.excerpt?.toLowerCase().includes(q);
                })
                .map(article => (
                <div key={`${article.year}-${article.month}-${article.slug}`} className={styles.articleItem}>
                  <div className={styles.articleInfo}>
                    <h3>{article.title}</h3>
                    <p>{article.date} | /{article.year}/{article.month}/{article.slug}</p>
                  </div>
                  <div className={styles.articleActions}>
                    <button onClick={() => handleEdit(article)} className={`${styles.actionBtn} ${styles.editBtn}`}>Edit</button>
                    <button onClick={() => handleDelete(article)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
                  </div>
                </div>
              ))}
              {articles.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No articles found.</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === 'trainingszeiten' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manage Trainingszeiten</h2>
          
          <div className={styles.inputGroup}>
            <label className={styles.label}>Subtitle / Info Text (e.g. Herbst 2026)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={trainingsData.subtitle} 
              onChange={e => setTrainingsData(p => ({ ...p, subtitle: e.target.value }))} 
            />
          </div>

          {DAYS.map(day => (
            <div key={day} style={{ marginBottom: '32px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '16px' }}>{day}</h3>
              {(trainingsData.schedule[day] || []).map((row, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Gruppe (e.g. Anfänger)" className={styles.input} style={{ flex: 1, minWidth: '150px' }} value={row.gruppe} onChange={e => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day][index].gruppe = e.target.value;
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} />
                  <input type="text" placeholder="Detail (optional)" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={row.detail} onChange={e => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day][index].detail = e.target.value;
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} />
                  <input type="text" placeholder="Alter" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={row.alter} onChange={e => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day][index].alter = e.target.value;
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} />
                  <input type="text" placeholder="Zeit" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={row.zeit} onChange={e => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day][index].zeit = e.target.value;
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} />
                  <input type="text" placeholder="Trainer" className={styles.input} style={{ flex: 1, minWidth: '150px' }} value={row.trainer} onChange={e => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day][index].trainer = e.target.value;
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} />
                  <button type="button" onClick={() => {
                    const newSched = { ...trainingsData.schedule };
                    newSched[day].splice(index, 1);
                    setTrainingsData({ ...trainingsData, schedule: newSched });
                  }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove</button>
                </div>
              ))}
              <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} style={{ marginTop: '8px' }} onClick={() => {
                const newSched = { ...trainingsData.schedule };
                if (!newSched[day]) newSched[day] = [];
                newSched[day].push({ gruppe: '', detail: '', alter: '', zeit: '', trainer: '' });
                setTrainingsData({ ...trainingsData, schedule: newSched });
              }}>+ Add Row for {day}</button>
            </div>
          ))}

          <div style={{ marginBottom: '32px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '16px' }}>Ferientraining (Holidays)</h3>
            {(trainingsData.ferien || []).map((row, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Gruppe" className={styles.input} style={{ flex: 1, minWidth: '150px' }} value={row.gruppe} onChange={e => {
                  const newFerien = [...trainingsData.ferien];
                  newFerien[index].gruppe = e.target.value;
                  setTrainingsData({ ...trainingsData, ferien: newFerien });
                }} />
                <input type="text" placeholder="Tag" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={row.tag} onChange={e => {
                  const newFerien = [...trainingsData.ferien];
                  newFerien[index].tag = e.target.value;
                  setTrainingsData({ ...trainingsData, ferien: newFerien });
                }} />
                <input type="text" placeholder="Zeit" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={row.zeit} onChange={e => {
                  const newFerien = [...trainingsData.ferien];
                  newFerien[index].zeit = e.target.value;
                  setTrainingsData({ ...trainingsData, ferien: newFerien });
                }} />
                <button type="button" onClick={() => {
                  const newFerien = [...trainingsData.ferien];
                  newFerien.splice(index, 1);
                  setTrainingsData({ ...trainingsData, ferien: newFerien });
                }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove</button>
              </div>
            ))}
            <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} style={{ marginTop: '8px' }} onClick={() => {
              const newFerien = [...trainingsData.ferien];
              newFerien.push({ gruppe: '', tag: '', zeit: '' });
              setTrainingsData({ ...trainingsData, ferien: newFerien });
            }}>+ Add Ferien Row</button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleTrainingsSubmit} disabled={trainingsLoading} className={styles.button}>
              {trainingsLoading ? 'Saving...' : 'Save Trainingszeiten'}
            </button>
          </div>

          {trainingsStatus.message && (
            <div style={{ marginTop: '16px' }} className={`${styles.message} ${trainingsStatus.type === 'success' ? styles.success : styles.error}`}>
              {trainingsStatus.message}
            </div>
          )}
        </div>
      )}


      {activeTab === 'gratis' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manage Gratis Schnuppern</h2>
          
          <div className={styles.inputGroup} style={{ marginBottom: '32px' }}>
            <label className={styles.label}>Subtitle / Info Text (e.g. Judo Anfängerkurse Herbst 2026...)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={gratisData.subtitle} 
              onChange={e => setGratisData(p => ({ ...p, subtitle: e.target.value }))} 
            />
          </div>

          <div style={{ marginBottom: '32px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '16px' }}>1. Info Cards (Left Side)</h3>
            {(gratisData.infoCards || []).map((card, cIndex) => (
              <div key={cIndex} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" placeholder="Icon (e.g. 🧒)" className={styles.input} style={{ width: '80px' }} value={card.icon} onChange={e => {
                    const newCards = [...gratisData.infoCards];
                    newCards[cIndex].icon = e.target.value;
                    setGratisData({ ...gratisData, infoCards: newCards });
                  }} />
                  <input type="text" placeholder="Title (e.g. Kleinkinderjudo)" className={styles.input} style={{ flex: 1 }} value={card.title} onChange={e => {
                    const newCards = [...gratisData.infoCards];
                    newCards[cIndex].title = e.target.value;
                    setGratisData({ ...gratisData, infoCards: newCards });
                  }} />
                  <button type="button" onClick={() => {
                    const newCards = [...gratisData.infoCards];
                    newCards.splice(cIndex, 1);
                    setGratisData({ ...gratisData, infoCards: newCards });
                  }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove Card</button>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <input type="text" placeholder="Subtitle (e.g. Präjudo Einsteiger · 4 – 6 Jahre)" className={styles.input} style={{ width: '100%' }} value={card.subtitle} onChange={e => {
                    const newCards = [...gratisData.infoCards];
                    newCards[cIndex].subtitle = e.target.value;
                    setGratisData({ ...gratisData, infoCards: newCards });
                  }} />
                </div>
                
                <h4 style={{ marginBottom: '8px', fontSize: '0.9rem' }}>Classes in this Card:</h4>
                {(card.items || []).map((item, iIndex) => (
                  <div key={iIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Label" className={styles.input} style={{ flex: 1, minWidth: '150px' }} value={item.label} onChange={e => {
                      const newCards = [...gratisData.infoCards];
                      newCards[cIndex].items[iIndex].label = e.target.value;
                      setGratisData({ ...gratisData, infoCards: newCards });
                    }} />
                    <input type="text" placeholder="Alter" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={item.alter} onChange={e => {
                      const newCards = [...gratisData.infoCards];
                      newCards[cIndex].items[iIndex].alter = e.target.value;
                      setGratisData({ ...gratisData, infoCards: newCards });
                    }} />
                    <input type="text" placeholder="Tag" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={item.tag} onChange={e => {
                      const newCards = [...gratisData.infoCards];
                      newCards[cIndex].items[iIndex].tag = e.target.value;
                      setGratisData({ ...gratisData, infoCards: newCards });
                    }} />
                    <input type="text" placeholder="Zeit" className={styles.input} style={{ flex: 1, minWidth: '100px' }} value={item.zeit} onChange={e => {
                      const newCards = [...gratisData.infoCards];
                      newCards[cIndex].items[iIndex].zeit = e.target.value;
                      setGratisData({ ...gratisData, infoCards: newCards });
                    }} />
                    <button type="button" onClick={() => {
                      const newCards = [...gratisData.infoCards];
                      newCards[cIndex].items.splice(iIndex, 1);
                      setGratisData({ ...gratisData, infoCards: newCards });
                    }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove</button>
                  </div>
                ))}
                <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} style={{ marginTop: '8px' }} onClick={() => {
                  const newCards = [...gratisData.infoCards];
                  if (!newCards[cIndex].items) newCards[cIndex].items = [];
                  newCards[cIndex].items.push({ label: '', alter: '', tag: '', zeit: '' });
                  setGratisData({ ...gratisData, infoCards: newCards });
                }}>+ Add Class</button>
              </div>
            ))}
            <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} style={{ marginTop: '8px' }} onClick={() => {
              const newCards = [...gratisData.infoCards];
              newCards.push({ icon: '', title: '', subtitle: '', items: [] });
              setGratisData({ ...gratisData, infoCards: newCards });
            }}>+ Add New Info Card</button>
          </div>


          <div style={{ marginBottom: '32px', background: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '16px' }}>2. Form Checkboxes (Course Selection Options)</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '12px' }}>
              These are the actual checkboxes that users can tick when filling out the online form. The ID must be unique (e.g. "kg1").
            </p>
            {(gratisData.courses || []).map((course, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input type="text" placeholder="Unique ID (e.g. kg1)" className={styles.input} style={{ width: '120px' }} value={course.id} onChange={e => {
                  const newCourses = [...gratisData.courses];
                  newCourses[index].id = e.target.value;
                  setGratisData({ ...gratisData, courses: newCourses });
                }} />
                <input type="text" placeholder="Label (e.g. Kindergartenkinder 1 (4-6 Jahre) Montag 14:30 Uhr)" className={styles.input} style={{ flex: 1 }} value={course.label} onChange={e => {
                  const newCourses = [...gratisData.courses];
                  newCourses[index].label = e.target.value;
                  setGratisData({ ...gratisData, courses: newCourses });
                }} />
                <button type="button" onClick={() => {
                  const newCourses = [...gratisData.courses];
                  newCourses.splice(index, 1);
                  setGratisData({ ...gratisData, courses: newCourses });
                }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove</button>
              </div>
            ))}
            <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} style={{ marginTop: '8px' }} onClick={() => {
              const newCourses = [...gratisData.courses];
              newCourses.push({ id: '', label: '' });
              setGratisData({ ...gratisData, courses: newCourses });
            }}>+ Add Form Checkbox</button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleGratisSubmit} disabled={gratisLoading} className={styles.button}>
              {gratisLoading ? 'Saving...' : 'Save Gratis Schnuppern'}
            </button>
          </div>

          {gratisStatus.message && (
            <div style={{ marginTop: '16px' }} className={`${styles.message} ${gratisStatus.type === 'success' ? styles.success : styles.error}`}>
              {gratisStatus.message}
            </div>
          )}
        </div>
      )}

      {activeTab === 'trainers' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Manage Trainerteam</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '24px' }}>
            Manage your coaches below. You can assign an image URL directly or upload an image from your computer. If no image is provided, the website will display the trainer's initials automatically.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {trainersData.map((trainer, index) => (
              <div key={index} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 80px', height: '80px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 600 }}>
                  {trainer.image ? (
                    <img src={trainer.image} alt={trainer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    trainer.name ? trainer.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?'
                  )}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Name" className={styles.input} style={{ flex: 1 }} value={trainer.name} onChange={e => {
                      const newTrainers = [...trainersData];
                      newTrainers[index].name = e.target.value;
                      setTrainersData(newTrainers);
                    }} />
                    <input type="text" placeholder="Role (e.g. Allgemeintraining)" className={styles.input} style={{ flex: 1 }} value={trainer.role} onChange={e => {
                      const newTrainers = [...trainersData];
                      newTrainers[index].role = e.target.value;
                      setTrainersData(newTrainers);
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Day (e.g. Montag)" className={styles.input} style={{ width: '150px' }} value={trainer.day} onChange={e => {
                      const newTrainers = [...trainersData];
                      newTrainers[index].day = e.target.value;
                      setTrainersData(newTrainers);
                    }} />
                    <input type="text" placeholder="Image URL (optional)" className={styles.input} style={{ flex: 1 }} value={trainer.image} onChange={e => {
                      const newTrainers = [...trainersData];
                      newTrainers[index].image = e.target.value;
                      setTrainersData(newTrainers);
                    }} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} id={`trainer-upload-${index}`} onChange={e => handleTrainerImageUpload(index, e.target.files[0])} />
                    <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => document.getElementById(`trainer-upload-${index}`).click()}>
                      Upload Image
                    </button>
                    <button type="button" onClick={() => {
                      const newTrainers = [...trainersData];
                      newTrainers.splice(index, 1);
                      setTrainersData(newTrainers);
                    }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Remove Trainer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => {
              const newTrainers = [...trainersData];
              newTrainers.push({ name: '', role: '', day: '', image: '' });
              setTrainersData(newTrainers);
            }}>+ Add Trainer</button>

            <button onClick={handleTrainersSubmit} disabled={trainersLoading} className={styles.button} style={{ marginLeft: 'auto' }}>
              {trainersLoading ? 'Saving...' : 'Save Trainerteam'}
            </button>
          </div>

          {trainersStatus.message && (
            <div style={{ marginTop: '16px' }} className={`${styles.message} ${trainersStatus.type === 'success' ? styles.success : styles.error}`}>
              {trainersStatus.message}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
