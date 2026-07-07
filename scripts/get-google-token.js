/**
 * ONE-TIME SCRIPT: Get Google OAuth Refresh Token
 * 
 * Run this once to generate a refresh token for the app's Google Calendar access.
 * 
 * SETUP:
 * 1. Go to https://console.cloud.google.com
 * 2. Enable Google Calendar API for your project
 * 3. Create OAuth 2.0 Client ID (Web Application type)
 * 4. Add http://localhost:3000 as an Authorized Redirect URI
 * 5. Fill in your CLIENT_ID and CLIENT_SECRET below
 * 6. Run: node scripts/get-google-token.js
 * 7. Open the printed URL in your browser, log in with your app's Google account
 * 8. Copy the "code" from the redirect URL and paste it when prompted
 * 9. Copy the printed refresh_token into your .env as GOOGLE_OAUTH_REFRESH_TOKEN
 */

const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

// ⬇️ Fill these in from Google Cloud Console
const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3000';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

async function main() {
  const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Forces refresh_token to be returned every time
  });

  console.log('\n===========================================');
  console.log('STEP 1: Open this URL in your browser:');
  console.log('===========================================\n');
  console.log(authUrl);
  console.log('\n===========================================');
  console.log('STEP 2: After authorizing, you will be redirected to localhost:3000');
  console.log('         Copy the "code" query parameter from the URL');
  console.log('         It looks like: http://localhost:3000/?code=4/xxxxx...');
  console.log('===========================================\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Paste the authorization code here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      console.log('\n✅ SUCCESS! Add these to your .env file:\n');
      console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\nFull token info:', JSON.stringify(tokens, null, 2));
    } catch (err) {
      console.error('\n❌ Error getting token:', err.message);
    }
  });
}

main().catch(console.error);
