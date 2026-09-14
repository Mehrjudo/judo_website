import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';
import fs from 'fs';
import path from 'path';
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
    if (!process.env.ONEDRIVE_REFRESH_TOKEN) throw new Error('ONEDRIVE_REFRESH_TOKEN not found in env variables.');
    const result = await msalClient.acquireTokenByRefreshToken({
      scopes: ['Files.ReadWrite', 'offline_access'],
      refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN
    });
    return result.accessToken;
  }
};

const client = Client.initWithMiddleware({ authProvider });

async function uploadFileToGraph(localPath, remotePath) {
  try {
    const fileContent = fs.readFileSync(localPath);
    console.log(`Uploading ${localPath} to ${remotePath}...`);
    // Microsoft Graph upload API for personal OneDrive root
    const endpoint = `/me/drive/root:/${remotePath}:/content`;
    await client.api(endpoint).put(fileContent);
    console.log(`Successfully uploaded ${remotePath}`);
  } catch (error) {
    console.error(`Error uploading ${localPath}:`, error.message);
  }
}

async function run() {
  console.log('Starting migration to personal OneDrive...');
  try {
    // 1. Upload generic JSON files
    const jsonFiles = ['trainingszeiten.json', 'gratis-schnuppern.json', 'trainers.json'];
    for (const file of jsonFiles) {
      const localPath = path.join(rootDir, '..', 'content', file);
      if (fs.existsSync(localPath)) {
        await uploadFileToGraph(localPath, `website/${file}`);
      }
    }

    // 2. Upload news MDX files
    const newsDir = path.join(rootDir, '..', 'content', 'news');
    if (fs.existsSync(newsDir)) {
      const years = fs.readdirSync(newsDir).filter(y => !y.startsWith('.'));
      for (const year of years) {
        const months = fs.readdirSync(path.join(newsDir, year)).filter(m => !m.startsWith('.'));
        for (const month of months) {
          const files = fs.readdirSync(path.join(newsDir, year, month)).filter(f => f.endsWith('.mdx'));
          for (const file of files) {
            const localPath = path.join(newsDir, year, month, file);
            await uploadFileToGraph(localPath, `website/news/${year}/${month}/${file}`);
          }
        }
      }
    }

    // 3. Upload images
    const imagesDirs = [
      { local: path.join(rootDir, 'public', 'images'), remote: 'website/images' },
      { local: path.join(rootDir, 'public', 'images', 'trainers'), remote: 'website/images/trainers' }
    ];

    for (const dirObj of imagesDirs) {
      if (fs.existsSync(dirObj.local)) {
        const files = fs.readdirSync(dirObj.local).filter(f => !f.startsWith('.'));
        for (const file of files) {
          const localPath = path.join(dirObj.local, file);
          if (fs.statSync(localPath).isFile()) {
            await uploadFileToGraph(localPath, `${dirObj.remote}/${file}`);
          }
        }
      }
    }

    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
