import { fetchJson } from './graphClient.js';

let newsCache = null;
let newsCacheTime = 0;

// Cache the result in-memory to avoid hitting Graph API rate limits
// and bypass Next.js unstable_cache 2MB limit
export async function getAllArticles() {
  if (newsCache && Date.now() - newsCacheTime < 60000) {
    return newsCache;
  }
  try {
    const data = await fetchJson('news.json');
    newsCache = data || [];
    newsCacheTime = Date.now();
    return newsCache;
  } catch (e) {
    console.error('Error fetching news.json', e.message);
    return [];
  }
}

export async function getArticleBySlug(year, month, slug) {
  try {
    const articles = await getAllArticles();
    const article = articles.find(a => a.year === year && a.month === month && a.slug === slug);
    return article || null;
  } catch (error) {
    console.error(`Article not found or error fetching: ${slug}`, error.message);
    return null;
  }
}
