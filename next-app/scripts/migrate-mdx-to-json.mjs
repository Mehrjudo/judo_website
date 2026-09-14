import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';
import matter from 'gray-matter';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const msalConfig = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common', 
  }
};

const msalClient = new PublicClientApplication(msalConfig);

const authProvider = {
  getAccessToken: async () => {
    if (!process.env.ONEDRIVE_REFRESH_TOKEN) throw new Error('ONEDRIVE_REFRESH_TOKEN not found.');
    const result = await msalClient.acquireTokenByRefreshToken({
      scopes: ['Files.ReadWrite', 'offline_access'],
      refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN
    });
    return result.accessToken;
  }
};

const client = Client.initWithMiddleware({ authProvider });

// Helpers
function extractFeaturedImage(body) {
  let m = body.match(/class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/);
  if (!m) m = body.match(/src="([^"]+)"[^>]*class="[^"]*wp-post-image[^"]*"/);
  if (m) return m[1];
  m = body.match(/<figure[^>]*featured-image[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/);
  if (m) return m[1];
  m = body.match(/<img[^>]+src="(\/images\/[^"]+)"/);
  return m ? m[1] : null;
}

function extractExcerpt(body) {
  return extractPlainText(body).slice(0, 160).trimEnd() + ' …';
}

function extractPlainText(body) {
  return body
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

async function run() {
  console.log('Starting migration from MDX to JSON...');
  
  const articles = [];

  try {
    const newsDir = path.join(rootDir, '..', 'content', 'news');
    if (!fs.existsSync(newsDir)) {
      throw new Error(`Directory not found: ${newsDir}`);
    }

    const years = fs.readdirSync(newsDir).filter(y => !y.startsWith('.'));
    for (const year of years) {
      const months = fs.readdirSync(path.join(newsDir, year)).filter(m => !m.startsWith('.'));
      for (const month of months) {
        const files = fs.readdirSync(path.join(newsDir, year, month)).filter(f => f.endsWith('.mdx'));
        for (const file of files) {
          try {
            const raw = fs.readFileSync(path.join(newsDir, year, month, file), 'utf-8');
            const { data, content } = matter(raw);
            const slug = file.replace(/\.mdx$/, '');
            
            // Rewrite /images/... URLs to /api/image/?path=images/... so they always proxy through OneDrive
            const rewriteImageUrls = (html) => {
              if (!html) return html;
              return html.replace(/src="\/images\//g, 'src="/api/image/?path=images/');
            };
            
            const rewrittenBody = rewriteImageUrls(content);
            const rawImage = data.image ? data.image : extractFeaturedImage(content);
            const image = rawImage && rawImage.startsWith('/images/')
              ? rawImage.replace('/images/', '/api/image/?path=images/')
              : rawImage;

            articles.push({
              slug, year, month,
              title: data.title || slug,
              date: data.date || `${year}-${month}-01`,
              categories: data.categories || [],
              sourceUrl: data.sourceUrl || '',
              image,
              excerpt: data.excerpt ? extractPlainText(data.excerpt) : extractExcerpt(content),
              text: extractPlainText(content).toLowerCase(),
              body: rewrittenBody
            });
            process.stdout.write('.');
          } catch (e) {
            console.error(`\nError reading article ${file}:`, e.message);
          }
        }
      }
    }
    
    console.log(`\nFound and parsed ${articles.length} MDX files.`);

    articles.sort((a, b) => (b.date > a.date ? 1 : -1));

    // Save news.json to OneDrive
    const jsonData = JSON.stringify(articles, null, 2);
    console.log(`Uploading website/news.json to OneDrive (Size: ${jsonData.length} bytes)...`);
    await client.api('/me/drive/root:/website/news.json:/content').put(jsonData);
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Error during migration:', error.message);
  }
}

run();
