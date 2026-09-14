import { PublicClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const msalClient = new PublicClientApplication({ 
  auth: { 
    clientId: process.env.MSAL_CLIENT_ID, 
    authority: 'https://login.microsoftonline.com/common' 
  }
});

const authProvider = { 
  getAccessToken: async () => (await msalClient.acquireTokenByRefreshToken({ 
    scopes: ['Files.ReadWrite'], 
    refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN 
  })).accessToken 
};

const client = Client.initWithMiddleware({ authProvider });

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').trim();
}

async function cleanNews() {
  console.log('Fetching news.json from OneDrive...');
  const response = await client.api('/me/drive/root:/website/news.json:/content').get();
  
  let updatedCount = 0;
  const cleanedNews = response.map(article => {
    if (article.excerpt && article.excerpt.includes('<')) {
      article.excerpt = stripHtml(article.excerpt);
      updatedCount++;
    }
    return article;
  });

  console.log(`Cleaned ${updatedCount} excerpts.`);
  
  console.log('Uploading cleaned news.json back to OneDrive...');
  await client.api('/me/drive/root:/website/news.json:/content').put(JSON.stringify(cleanedNews, null, 2));
  console.log('Done!');
}

cleanNews().catch(console.error);
