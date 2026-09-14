import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
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

async function test() {
  try {
    console.log(`Fetching user profile via /me...`);
    const user = await client.api(`/me`).get();
    console.log('User retrieved successfully:', user.displayName);
  } catch (error) {
    console.error('Error fetching user:', error.statusCode, error.message);
  }

  try {
    console.log(`Fetching personal OneDrive root...`);
    const driveRoot = await client.api(`/me/drive/root`).get();
    console.log('Drive root retrieved successfully! ID:', driveRoot.id);
  } catch (error) {
    console.error('Error fetching drive:', error.statusCode, error.message);
  }
}

test();
