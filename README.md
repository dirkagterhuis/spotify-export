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
┌────────────────────────────────────────────┐
│  GitHub Pages — React SPA (static)          │
│  - Runs OAuth Authorization Code + PKCE     │
│    directly with Spotify (no client_secret) │
│  - Calls Spotify API directly for           │
│    playlists + tracks                       │
│  - Progress updates via React state         │
└──────────┬───────────────────────────────────┘
           │ HTTPS (optional analytics only)
┌──────────▼───────────────────────────────────┐
│  API Gateway + Lambda                        │
│                                              │
│  POST /exports                               │
│    → log export event (timestamp,            │
│      playlist count, format)                 │
│                                              │
│  GET  /users/:id/exports                     │
│    → export history for an anonymous user    │
└──────────┬───────────────────────────────────┘
           │
┌──────────▼───────────────────────────────────┐
│  DynamoDB (on-demand) — no PII               │
│  - Exports table: anonymous user id          │
│    (hashed Spotify id), date, playlist       │
│    count, format                             │
└────────────────────────────────────────────────┘
```

> The auth path has **zero infrastructure**: PKCE lets the browser complete the OAuth flow with no `client_secret`, so there is nothing server-side to secure. The Lambda / API Gateway / DynamoDB tier exists purely for optional export analytics.

## Key design decisions
- **OAuth Authorization Code + PKCE, fully in the browser.** PKCE replaces the static `client_secret` with a per-login proof (a random `code_verifier`; only its SHA-256 hash, the `code_challenge`, is sent to Spotify). This means no secret has to live anywhere and the entire auth flow — including the token exchange — runs client-side. No auth server, no Socket.io.
- **Browser calls Spotify API directly** using the user's access token — no server timeout concerns. The access token lasts ~1h, which covers a one-shot export, so no refresh token is stored in the browser.
- **React SPA (Vite + TypeScript)** replaces the current HTML/EJS + Socket.io frontend. Progress updates are just React state.
- **No PII stored.** The optional analytics tier keys exports by a *hashed* Spotify id only — no email, no display name. Store as little as possible.
- **DynamoDB on-demand** for the export-event analytics. Free tier covers 25GB storage + 25 WCU/RCU.
- **GitHub Pages** for hosting the static frontend (CNAME already set up for spotifyexport.com). Client-side routing uses a `404.html` fallback.
- **Terraform** to provision API Gateway, Lambda, and DynamoDB.
- **GitHub Actions** for CI/CD: lint/test/build → deploy frontend to Pages, deploy infra via Terraform.

## Implementation steps
1. [x] Introduce VItest
2. [x] Introduce ZOD and add types, add type check as commit hook
3. [x] Make linting rules more strict
4. [ ] review plan again
5. [ ] Add skills or agents
### Phase A — Static SPA, client-side everything (this alone gets hosting to ~€0)
6. Set up React app (Vite + TypeScript), replace the current HTML/EJS frontend. (Vite replaces webpack and the EJS-copy build step entirely.)
   1. Yes, a React SPA runs fine on GitHub Pages — it's just static assets, with a `404.html` fallback for client-side routes.
   2. Add cookie / privacy notice (lighter now: PKCE uses `sessionStorage`, not cookies, and analytics stores no PII).
   3. Ui Spotify export: verhaal vertellen: you used to own your music, you might still own your CDs and mp3s or vinyl or records. .  But in 20 years, you might not have your playlists. Help yourself. En profi maken. Verwijziny naast GitHub en dirk en instr
7. Implement Spotify auth in the browser via Authorization Code + PKCE (`crypto.subtle` for the challenge, `sessionStorage` for the verifier + state). Remove the server-side token exchange and `client_secret`.
8. Move Spotify API calls (playlists, tracks) to client-side fetch calls.
   1. While here, fix the two known issues: re-clicking the button after a finished export, and the HTML-entity escaping in CSVs (`&#x2F;` → `/`).
9. Migrate DNS / update Spotify app redirect URIs; deploy the SPA to GitHub Pages.
10. Set up GitHub Actions: lint / test / build → deploy frontend to Pages.

### Phase B — Optional analytics backend (the AWS / Terraform / Lambda / DynamoDB learning)
11. Set up Terraform.
12. Set up DynamoDB Exports table (anonymous hashed Spotify id, date, playlist count, format — no PII).
13. Create Lambda function to log export events + return history.
    1. Use esbuild for bundling.
14. Wire up API Gateway in front of Lambda (`POST /exports`, `GET /users/:id/exports`).
15. Extend the GitHub Actions pipeline to `terraform apply` the infra.

### Cross-cutting
16. Add versioning based on commit messages.

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