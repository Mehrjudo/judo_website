import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';

const msalConfig = {
  auth: {
    clientId: process.env.MSAL_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common', 
  }
};

let msalClient;
try {
  if (process.env.MSAL_CLIENT_ID && process.env.ONEDRIVE_REFRESH_TOKEN) {
    msalClient = new PublicClientApplication(msalConfig);
  }
} catch (e) {
  console.error('Failed to initialize MSAL', e);
}

export const authProvider = {
  getAccessToken: async () => {
    if (!msalClient) throw new Error('MSAL not configured. Missing ENV variables (MSAL_CLIENT_ID or ONEDRIVE_REFRESH_TOKEN).');
    
    // Acquire a new token using the refresh token
    const result = await msalClient.acquireTokenByRefreshToken({
      scopes: ['Files.ReadWrite', 'offline_access'],
      refreshToken: process.env.ONEDRIVE_REFRESH_TOKEN
    });
    
    return result.accessToken;
  }
};

let graphClient;
if (msalClient) {
  graphClient = Client.initWithMiddleware({ 
    authProvider,
    fetchOptions: {
      cache: 'no-store'
    }
  });
}
export const getGraphClient = () => {
  if (!graphClient) {
    throw new Error('Graph client is not initialized. Please ensure MSAL_CLIENT_ID and ONEDRIVE_REFRESH_TOKEN are set in environment variables.');
  }
  return graphClient;
};

// Helper to get file path in OneDrive
export const getDrivePath = (filename) => {
  return `/website/${filename}`;
};

export async function fetchJson(filename) {
  const client = getGraphClient();
  try {
    const raw = await client.api(`/me/drive/root:/website/${filename}:/content`).responseType('text').get();
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error reading ${filename} from OneDrive:`, error.message);
    return null;
  }
}

export async function getJsonFromOneDrive(filename, defaultData = {}) {
  const data = await fetchJson(filename);
  return data || defaultData;
}

export async function saveJsonToOneDrive(filename, data) {
  const client = getGraphClient();
  try {
    await client.api(`/me/drive/root:/website/${filename}:/content`).put(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving ${filename} to OneDrive:`, error.message);
    throw error;
  }
}
