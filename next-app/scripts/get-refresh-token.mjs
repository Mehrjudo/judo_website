import { PublicClientApplication } from '@azure/msal-node';
import 'isomorphic-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

// Since it's for personal accounts, we use the common authority.
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common', 
  }
};

const pca = new PublicClientApplication(msalConfig);

async function run() {
  const deviceCodeRequest = {
    scopes: ['Files.ReadWrite', 'offline_access'],
    deviceCodeCallback: (response) => {
      console.log('\n======================================================');
      console.log('To sign in, use a web browser to open the page:');
      console.log(response.verificationUri);
      console.log(`and enter the code: ${response.userCode}`);
      console.log('======================================================\n');
    }
  };

  try {
    const response = await pca.acquireTokenByDeviceCode(deviceCodeRequest);
    console.log('Authentication successful!\n');
    
    // MSAL caches the refresh token internally. Let's extract it from the token cache.
    const tokenCache = pca.getTokenCache().serialize();
    const cacheParsed = JSON.parse(tokenCache);
    let refreshToken = null;
    
    if (cacheParsed.RefreshToken) {
      const keys = Object.keys(cacheParsed.RefreshToken);
      if (keys.length > 0) {
        refreshToken = cacheParsed.RefreshToken[keys[0]].secret;
      }
    }

    if (refreshToken) {
      console.log('Add the following line to your .env.local file:');
      console.log(`\nONEDRIVE_REFRESH_TOKEN=${refreshToken}\n`);
    } else {
      console.log('Could not find refresh token in cache. Please ensure offline_access scope is permitted.');
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
}

run();
