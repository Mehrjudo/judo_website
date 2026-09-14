import { NextResponse } from 'next/server';
import { getAllArticles, getArticleBySlug } from '../../../lib/news';
import { getGraphClient } from '../../../lib/graphClient';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const slug = searchParams.get('slug');

  if (year && month && slug) {
    const article = await getArticleBySlug(year, month, slug);
    if (!article) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, article });
  }

  const articles = await getAllArticles();
  return NextResponse.json({ success: true, articles });
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { title, date, excerpt, content, image } = data;

    if (!title || !date || !content) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const dateObj = new Date(date);
    const year = dateObj.getFullYear().toString();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const slug = slugify(title);

    let articles = await getAllArticles();

    const newArticle = {
      slug, year, month, title,
      date, categories: [], sourceUrl: '',
      image: image || null,
      excerpt: excerpt && excerpt !== '<p><br></p>' ? excerpt : '',
      text: content.replace(/<[^>]+>/g, ' ').toLowerCase(),
      body: content
    };

    articles.push(newArticle);
    articles.sort((a, b) => (b.date > a.date ? 1 : -1));

    const { saveJsonToOneDrive } = await import('../../../lib/graphClient');
    await saveJsonToOneDrive('news.json', articles);

    return NextResponse.json({ success: true, slug, year, month });
  } catch (error) {
    console.error('Error creating news in JSON:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { originalYear, originalMonth, originalSlug, title, date, excerpt, content, image } = data;

    if (!title || !date || !content || !originalYear || !originalMonth || !originalSlug) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const dateObj = new Date(date);
    const year = dateObj.getFullYear().toString();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const slug = slugify(title);

    let articles = await getAllArticles();
    
    // Remove the old article
    articles = articles.filter(a => !(a.year === originalYear && a.month === originalMonth && a.slug === originalSlug));

    // Add the updated article
    const updatedArticle = {
      slug, year, month, title,
      date, categories: [], sourceUrl: '',
      image: image || null,
      excerpt: excerpt && excerpt !== '<p><br></p>' ? excerpt : '',
      text: content.replace(/<[^>]+>/g, ' ').toLowerCase(),
      body: content
    };

    articles.push(updatedArticle);
    articles.sort((a, b) => (b.date > a.date ? 1 : -1));

    const { saveJsonToOneDrive } = await import('../../../lib/graphClient');
    await saveJsonToOneDrive('news.json', articles);

    return NextResponse.json({ success: true, slug, year, month });
  } catch (error) {
    console.error('Error updating news in JSON:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const slug = searchParams.get('slug');

    if (!year || !month || !slug) {
       return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    let articles = await getAllArticles();
    const initialLength = articles.length;
    
    articles = articles.filter(a => !(a.year === year && a.month === month && a.slug === slug));

    if (articles.length < initialLength) {
      const { saveJsonToOneDrive } = await import('../../../lib/graphClient');
      await saveJsonToOneDrive('news.json', articles);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting news from JSON:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
