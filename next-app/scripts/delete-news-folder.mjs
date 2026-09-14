import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';
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
    if (!process.env.ONEDRIVE_REFRESH_TOKEN) throw new Error('ONEDRIVE_REFRESH_TOKEN not found.');
    const result = await msalClient.acquireTokenByRefreshToken({
      scopes: ['Files.ReadWrite', 'offline_access'],
      refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN
    });
    return result.accessToken;
  }
};

const client = Client.initWithMiddleware({ authProvider });

async function run() {
  console.log('Attempting to delete website/news folder from OneDrive...');
  try {
    await client.api('/me/drive/root:/website/news').delete();
    console.log('Successfully deleted website/news folder from OneDrive.');
  } catch (error) {
    if (error.statusCode === 404) {
      console.log('Folder website/news does not exist on OneDrive. Nothing to delete!');
    } else {
      console.error('Error deleting folder:', error.message);
    }
  }
}

run();
