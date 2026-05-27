# spotifyexport.com
This application allows users to export playlists from their Spotify account. Pushing a button will:
1. Authorize the users' Spotify Account to read their playslists through an OAuth 2.0 flow.
2. Retrieve all playlists. 
3. Per playlist, retrieve all tracks. 

The application is built in Typescript and is currently hosted on AWS. You can also clone this repository and run it from there; see the 'How to' section on this page. 

# Architecture plan

Moving from an always-on AWS container (~€12-20/mo) to a serverless, client-driven architecture (~€0/mo).

## Target architecture
```
┌─────────────────────────────────────┐
│  GitHub Pages                       │
│  React SPA (static)                 │
│  - Calls Spotify API directly       │
│  - Progress updates via React state │
└──────────┬──────────────────────────┘
           │ HTTPS
┌──────────▼──────────────────────────┐
│  API Gateway + Lambda               │
│                                     │
│  POST /auth/token                   │
│    → exchange OAuth code for token  │
│    → upsert user in DynamoDB        │
│                                     │
│  POST /exports                      │
│    → log export event (timestamp,   │
│      playlist count, format, etc.)  │
│                                     │
│  GET  /users/:id/exports            │
│    → export history for a user      │
└──────────┬──────────────────────────┘
           │
┌──────────▼──────────────────────────┐
│  DynamoDB (on-demand)               │
│  - Users table (spotify ID, email,  │
│    display name, first/last seen)   │
│  - Exports table (user ID, date,    │
│    playlist count, format)          │
└─────────────────────────────────────┘
```

## Key design decisions
- **Browser calls Spotify API directly** using the user's OAuth token — no server timeout concerns, no Socket.io needed. The only server-side call is the OAuth token exchange (requires client_secret).
- **React SPA** replaces the current HTML/EJS + Socket.io frontend. Progress updates are just React state.
- **DynamoDB on-demand** for user/session tracking. Free tier covers 25GB storage + 25 WCU/RCU.
- **GitHub Pages** for hosting the static frontend (CNAME already set up for spotifyexport.com).
- **Terraform** to provision API Gateway, Lambda, and DynamoDB.
- **GitHub Actions** for CI/CD: lint/test/build → deploy frontend to Pages, deploy infra via Terraform.

## Implementation steps
1. Introduce VItest
2. Introduce ZOD and add types
3. Set up React app (Vite + TypeScript), replace current HTML/EJS frontend, but perhaps still use webpack
4. Move Spotify API calls (playlists, tracks) to client-side fetch calls
5. Set up terraform
6. Set up GitHub Actions pipeline
7. Set up DynamoDB tables (Users, Exports)
8. Create Lambda function for OAuth token exchange + user upsert
9. Wire up API Gateway in front of Lambda
10. Migrate DNS / update Spotify app redirect URIs
11. Add versioning and versions based on commit messages.
12. configure webpack to include the html files in `./dist` instead of copying them over in the `npm run build` script.

## Future features (after architecture migration)
- Allow selection of 'own playlists only' vs. 'subscribed playlists too'
- Allow selection of which fields to be retrieved
- Allow uploading of playlists to a Spotify account
- Visual progress bar for export
- Track traffic
- Add tooltips to explain json and csv file types

# Known issues
- If you click the button again after retrieving playlists, you get an error.
- CSV's contain weird unicode like characters, e.g. `&#x2F;` instead of `/`.

# How to

## Setup development environment
You'll need to create a spotify app which you can create on [https://developer.spotify.com/dashboard/login](https://developer.spotify.com/dashboard/login).

- `npm install`
- Save your Spotify App `Client Id` and `Client Secret` in `local.yml`:
```yml
localSpotifyAppClientId: "INSERT_CLIENT_ID"
localSpotifyAppClientSecret: "INSERT_CLIENT_SECRET"
```
- Set up HTTPS for localhost using [mkcert](https://github.com/FiloSottile/mkcert) (required by Spotify's OAuth redirect URI policy):
```bash
brew install mkcert
mkcert -install        # installs a local CA — requires your system password, run in a terminal
mkcert localhost       # generates localhost.pem and localhost-key.pem in the project root
```
- Add `https://localhost:8000/spotify-app-callback` to the allowed redirect URIs in your Spotify app on [developer.spotify.com](https://developer.spotify.com/dashboard).
- `npm run dev` to start up local server on [https://localhost:8000](https://localhost:8000). From there, you can initiate the export. Go to [https://dev.spotifyexport.com:8000](https://dev.spotifyexport.com:8000) to view ui. 

## Build
- `npm run build`. For some reason, this could give `Missing script: "build"`. In that case, copy-pasta the script.
- Push to AWS codecommit repo. 
- `eb deploy`

# Changelog
- Converted to Typescript.
- Implemented Socket.io as a framework to push statusupdates from server to client. The alternative was using Server Side Events (SSE). Although the use case is unidirectional and I'm not using binaries in the communication, SSE's have a limit to the number of open connections.
- Made separate repo for `spotifyexport.com`
- Support .csv file format, escape `,` in e.g. track names.
- Added a timeout for playlists with > 50 items to adhere to the rate limiting enforced by Spotify.
- After login redirect, the windows scrolls to the loadingmessages / progress messages.
- Fixed local development login flow that was broken because Spotify's OAuth rejects localhost as a redirect URI by pointing to dev.spotifyexport.com at 127.0.0.1 via a DNS A record to allow the app to run locally with a mkcert certificate. 

# Troubleshooting
- During auth/login to spotify: `redirect_uri: Insecure` error: Spotify requires HTTPS for all redirect URIs. Make sure you've completed the mkcert setup above and added `https://localhost:8000/spotify-app-callback` to your Spotify app's allowed redirect URIs.