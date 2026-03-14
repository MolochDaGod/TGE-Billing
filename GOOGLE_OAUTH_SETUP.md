# Google OAuth Setup Instructions

## Overview
ElectraPro supports Google OAuth for user authentication. To enable this feature, you need to configure Google OAuth credentials.

## Prerequisites
1. A Google Cloud Platform (GCP) account
2. Admin access to your ElectraPro deployment

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted:
   - User Type: External (for public access) or Internal (for organization only)
   - App name: ElectraPro
   - User support email: Your company email
   - Developer contact information: Your company email

6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: ElectraPro Web Client
   - Authorized JavaScript origins:
     - `https://your-repl-name.repl.co`
     - `http://localhost:5000` (for development)
   - Authorized redirect URIs:
     - `https://your-repl-name.repl.co/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback`

7. Click "Create" and copy the Client ID and Client Secret

### 2. Configure Environment Variables

Add the following secrets to your Replit project:

1. Go to your Replit project
2. Click on "Secrets" in the left sidebar
3. Add these secrets:
   - Key: `GOOGLE_CLIENT_ID`
     Value: Your Google OAuth Client ID
   - Key: `GOOGLE_CLIENT_SECRET`
     Value: Your Google OAuth Client Secret

### 3. Restart the Application

After adding the secrets, restart your application. The Google OAuth login button will now work on the auth page.

## Testing

1. Navigate to `/auth` on your application
2. Click "Continue with Google"
3. Authorize with your Google account
4. You should be redirected back to the application and logged in

## Troubleshooting

### "Unknown authentication strategy: google"
This means the Google Client ID and Secret environment variables are not set. Verify that:
1. Both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in your Secrets
2. The application has been restarted after adding the secrets
3. The secrets don't have any extra whitespace

### "Redirect URI mismatch" error
This means your redirect URI in Google Console doesn't match your app's URL. Make sure:
1. The authorized redirect URI exactly matches: `https://your-repl-name.repl.co/api/auth/google/callback`
2. There are no trailing slashes or typos
3. Your production domain is included if deploying

## Alternative: Use Replit Auth

ElectraPro also supports **Replit Auth** which provides Google login (along with GitHub, Apple, X, and email/password) without requiring separate Google OAuth credentials. Replit Auth is already configured and ready to use.

To use Replit Auth instead:
1. No additional setup required
2. Users can log in with their Replit account
3. Replit handles all OAuth flows automatically
4. Supports multiple providers: Google, GitHub, Apple, X (Twitter), email/password

## Security Notes

- Never commit your Client ID or Secret to version control
- Use Replit's Secrets management for secure storage
- Rotate credentials if they are ever exposed
- Monitor the OAuth consent screen for suspicious activity
