# spotifyexport.com
This application allows users to export playlists from their Spotify account to a json or csv file. Pushing a button will:
1. Log in to Spotify (OAuth 2.0 Authorization Code + PKCE) with permission to read your playlists.
2. Retrieve all playlists.
3. Per playlist, retrieve all tracks and episodes.
4. Save them as one file on your device.

It's a React + TypeScript single-page app that does all of this in the browser: there is no server. It's hosted on GitHub Pages and deployed by GitHub Actions on every push to `main`. You can also clone this repository and run it yourself; see [How to](#how-to). Spotify limits who can use it, see [Known issues and limits](#known-issues-and-limits).

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
- **GitHub Pages** for hosting the static frontend (`web/public/CNAME` for spotifyexport.com). Client-side routing uses a `404.html` fallback.
- **Terraform** to provision API Gateway, Lambda, and DynamoDB.
- **GitHub Actions** for CI/CD: lint/test/build → deploy frontend to Pages, deploy infra via Terraform.

## Implementation steps
Phase A is live on spotifyexport.com. Left to do: 9d and 9e. After that, Phase B and Phase C don't depend on each other, and the cross-cutting steps 17–19 come last.

1. [x] Introduce VItest
2. [x] Introduce ZOD and add types, add type check as commit hook
3. [x] Make linting rules more strict
4. [x] review plan again
5. [x] Add skills or agents
### Phase A — Static SPA, client-side everything (this alone gets hosting to ~€0)
6. Set up React app (Vite + TypeScript) in `web/`, replace the current HTML/EJS frontend. (Vite replaces the `tsc` + copy-`public/` build step.) The Express app keeps working until step 8, since the SPA can't export until PKCE (7) and client-side fetch (8) land.
   - Notes:
     - Yes, a React SPA runs fine on GitHub Pages — it's just static assets, with a `404.html` fallback for client-side routes.
     - Cookie / privacy notice is lighter now: PKCE uses `sessionStorage`, not cookies. Note that a hashed Spotify id (Phase B) is still pseudonymous personal data under GDPR.
     - Ui Spotify export: verhaal vertellen: you used to own your music, you might still own your CDs and mp3s or vinyl or records. .  But in 20 years, you might not have your playlists. Help yourself. En profi maken. Verwijziny naast GitHub en dirk en instr
   - [x] 6a. Tooling: Vite + React + TS in `web/`, tsconfig split, ESLint (react-hooks), Vitest projects (node + jsdom), smoke test.
   - [x] 6b. Layout as components: `Layout`, `Header`, `Footer`, `Section`, `HomePage`; port `styles.css` (no jQuery/Bootstrap).
   - [x] 6c. Routing: React Router + `AboutPage`, `NotFoundPage` (`/`, `/about`, `*`) + `404.html` fallback for GitHub Pages. `/privacy` follows in 6f.
   - [x] 6d. File-type picker: controlled radio group, lifted state, `useSessionStorage` hook; button disabled while exporting.
   - [x] 6e. Progress log: list rendering, auto-scroll via `useRef`, export status as a union type, driven by a fake export.
   - [x] 6f. Privacy notice: `/privacy` page + dismissible banner.
   - [x] 6g. Story & polish: hero, "why" narrative, how-it-works, footer links (GitHub, author, run-locally instructions), favicon.
     - Privacy page: add who runs the site and how to reach them (GDPR expects the controller's identity + contact details).
   - [x] 6h. Update README dev instructions.
7. Implement Spotify auth in the browser via Authorization Code + PKCE (`crypto.subtle` for the challenge, `sessionStorage` for the verifier + state). Remove the server-side token exchange and `client_secret` together with the rest of the Express app in step 8, so the live export keeps working until the SPA can replace it.
   - [x] 7a. PKCE building blocks: code verifier, state and S256 code challenge (Web Crypto), tested against the RFC 7636 example.
   - [x] 7b. Login redirect: Spotify client id + redirect URI config, build the authorize URL, store verifier + state in `sessionStorage`.
   - [x] 7c. Finish the login (no React yet): read back verifier + state, check state and Spotify's error, exchange code + verifier for an access token (`fetch`, zod-validated).
   - [x] 7d. `/callback` route: run 7c once (StrictMode-safe), keep the token in React state (memory only), clean the code from the URL, show login errors. The button logs in first when there's no valid token.
   - [x] 7e. After the login, start the export by itself (no second click) and pass the token to the export (still the fake export until step 8).
   - [x] 7f. Docs: register `http://127.0.0.1:5173/callback` with Spotify, update the run instructions.
8. Move Spotify API calls (playlists, tracks) to client-side fetch calls, then delete the Express app.
   - [x] 8a. Check the API, then move the data model: read Spotify's [February 2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide). `/playlists/{id}/tracks` became `/playlists/{id}/items` (the old route gives a 403 for Development Mode apps), field names changed, and Development Mode only returns the items of playlists you own or collaborate on. Then move the zod schemas from `src/types/spotify.ts` to `web/src/spotify/`, updated to the new shapes and made robust for real-world data: local files (`id: null`), podcast episodes in playlists, empty descriptions, unavailable tracks.
     - Findings for 8b/8e: `/playlists/{id}/items` gives a 403 for playlists you neither own nor collaborate on, so skip those (compare `owner.id` with the user's id from `/me`; `collaborative: true` doesn't tell whether *you* are a collaborator, so for those treat a 403 as "skip") and say in the progress log how many were skipped. Ask for episodes too with `additional_types=track,episode`, and use `item` (not `track`) in the `fields` parameter. Max `limit` is 50 for both endpoints. The schemas stay in `src/types/` as well until the Express app goes in 8f.
   - [x] 8b. Spotify API client with `fetch`: one `spotifyGet` helper (Bearer token, zod-validated, readable errors for 401 expired / 403 / 429), pagination as a loop instead of recursion, wait for `Retry-After` on a 429 instead of the fixed 100 ms delay. `getPlaylists` + `getPlaylistItems`, `fetchFn` injectable like in `spotifyCallback.ts`, tested with a fake fetch.
   - [x] 8c. Export file: move `generateReturnFile` + its tests into `web/`, and fix it along the way:
     - decode HTML entities in names and descriptions, for json and csv (known issue: `&#x2F;` → `/`);
     - real CSV escaping: `handleCommas` doesn't double quotes now (`replaceAll('"', '"')` does nothing), and newlines aren't escaped;
     - a UTF-8 BOM so Excel shows non-ASCII characters correctly;
     - return the file content + MIME type instead of a `data:` URI (which also put a space at the start of every file).
   - [x] 8d. Download in the browser: `Blob` + `URL.createObjectURL` + a temporary `<a download>`, the same timestamped file name as before, and revoke the URL afterwards.
   - [x] 8e. Real export: `spotifyExport` replaces `fakeExport` behind the same `ExportPlaylists` type and sends the same progress messages. Turn the 10-playlist limit for local runs into an opt-in setting: `VITE_EXPORT_PLAYLIST_LIMIT` in `web/.env.local`. Unset means all playlists, and when it is set, the progress log says so. Update the "done" text. When a list has fewer or more items than Spotify's `total` (it changed during the export), write a warning in the progress log and carry on. Handle a token that expires mid-export (log in again). Fix known issue: test that a second export after a finished one works. Then do a real export together (Claude can't log in).
   - [x] 8f. Delete the Express app: first tag the last commit that has it (`git tag express-app-final`). Then delete `src/`, `public/`, the committed `dist/`, `config.ts`, the server Vitest project, the root `tsconfig.json` server setup, the server dependencies (express, socket.io, cors, ejs, axios, js-yaml, nodemon, ts-node + their `@types`), the `build:` / `dev` / `start` scripts and the `.gitignore` entries that are no longer needed. Keep the root `index.html` + `CNAME` until step 9. Your own steps in the Spotify dashboard: rotate the client secret (it's no longer used anywhere) and remove the `dev.spotifyexport.com` redirect URI; the `dev.spotifyexport.com` DNS record can go too.
   - [x] 8g. Docs: check that `/privacy` matches what the code actually does (it was written ahead of steps 7 + 8: PKCE login, direct fetch from Spotify, token lifetime, what's in `sessionStorage`), and drop its "ahead of time" comment. In the README, remove the Express run instructions and the fixed known issues, and add the Development Mode limits (owned / collaborative playlists only, max 5 users).
9. Migrate DNS / update Spotify app redirect URIs; deploy the SPA to GitHub Pages. The DNS already points at Pages (it served the old root `index.html`), so no DNS change is needed.
   - [x] 9a. Move `CNAME` into `web/public/` so it ends up in the build, and delete the old root `index.html`.
   - [x] 9b. Your own steps: in the GitHub repo, rename the default branch `master` to `main` (and check that the `github-pages` environment allows `main`), set Settings → Pages → Source to "GitHub Actions" (before pushing 9a, or the site goes blank) and check that the custom domain + "Enforce HTTPS" are still set. In the Spotify dashboard, add `https://spotifyexport.com/callback` and `https://www.spotifyexport.com/callback` as redirect URIs.
   - [x] 9c. After the first deploy: one real login + export on spotifyexport.com.
   - [x] 9d. Check the [Spotify Developer Policy](https://developer.spotify.com/policy) and [Developer Terms](https://developer.spotify.com/terms) (both effective 15 May 2025) against the site. Added to `/privacy`: how to disconnect the app from your Spotify account (Policy I.1.2, Terms V.8), that no one sets cookies (Terms V.12), and that the site isn't affiliated with Spotify (Policy II.1). Added a `/terms` page with the minimum end user terms of Terms V.11, and a line by the export button that logging in means agreeing to them. Left open on purpose:
     - The domain name: Terms VII.1.3 forbids domain names that include "Spotify", and Policy VI.2 app names that start with "Spot". Ignored for now.
     - A private contact address for privacy questions (Terms V.12): left out for now, GitHub issues stay the only contact. See also 12.2.
   - [ ] 9e. Clean up what's left of the old hosting: check in the AWS console that nothing of the old container setup is still running or billed (container, load balancer, registry, Route 53 zone if DNS isn't there), and delete the `claude/optimistic-meitner-96vwv0` branch on GitHub if it's no longer needed.
10. Set up GitHub Actions: lint / test / build → deploy frontend to Pages.
   - [x] 10a. `.github/workflows/deploy.yml`: lint, type-check, tests and build on every push + pull request; on `main` it also deploys `web/dist` to Pages.

### Phase B — Optional analytics backend (the AWS / Terraform / Lambda / DynamoDB learning)
prereq: set up AWS account incl. cost alerts and billshock prevention
B.0: run a thorough security check: see 19.2
11. Set up Terraform.
12. Set up DynamoDB Exports table (anonymous hashed Spotify id, date, playlist count, format — no PII).
    1. Update the `/privacy` page before this goes live: a hashed Spotify id is pseudonymous personal data under GDPR, so state what is logged, the legal basis (likely legitimate interest), the retention period, and that AWS stores it (region).
    2. Add a private contact channel for privacy requests (e.g. deletion), since GitHub issues are public: a forwarding address like `privacy@spotifyexport.com` via the registrar or Cloudflare Email Routing, not a form (that would need a third-party service).
13. Create Lambda function to log export events + return history.
    1. Use esbuild for bundling.
14. Wire up API Gateway in front of Lambda (`POST /exports`, `GET /users/:id/exports`).
15. Extend the GitHub Actions pipeline to `terraform apply` the infra.

### Phase C — Bring your own Spotify app
16. Let visitors export with their own Spotify app. Since February 2026, a Spotify app in Development Mode accepts at most 5 users: the app's owner plus the users added by hand under *User Management* in the dashboard. Extended Quota Mode, which lifts that limit, is only granted to organisations (since May 2025). So with this site's own client id, only the people on that list can export.
    1. First check in the Spotify dashboard which mode this site's app is in, and its usage numbers. If it already has Extended Quota (approved under the old rules), this step isn't needed. Also check the current rules on Spotify's quota modes page, since the numbers above are from memory.
    2. Explain the limit on the site in plain language, before the export button: what the limit is, that it's Spotify's rule, and the two ways around it (ask to be added to the list, or use your own Spotify app).
    3. A how-to on the site: create a Spotify app, add `https://spotifyexport.com/callback` as its redirect URI, copy its client id. Mention what Spotify requires of the app's owner (Premium, at the time of writing).
    4. A field for the visitor's client id: check its format (32 hex characters), use it for the login instead of `VITE_SPOTIFY_CLIENT_ID`, and remember it in the browser with a way to forget it. It isn't a secret, so the browser may keep it.
    5. A clear message when Spotify refuses a user who isn't on the app's list, pointing to the how-to.
    6. Update `/privacy` (the client id stored in the browser) and the README (running locally with your own app is the other way around the limit).

### Cross-cutting
17. Add versioning based on commit messages.
18. Remove unnecessary comments: many were added to explain concepts while learning (React, PKCE, zod). Keep only the ones that explain a non-obvious why.
19. Thorough review of the whole codebase, as the last step.
    1. Code review: correctness, error handling, dead code, test gaps (`/code-review`), and whether the structure still makes sense now that everything is in place.
    2. Security review (`/security-review`), at least:
       - Access token: only in memory, never in `localStorage`, URLs or logs; the login code and state are removed from the URL and `sessionStorage` after use.
       - PKCE + state check (CSRF) still as in 7a–7d; the redirect URIs registered with Spotify are only the ones in use.
       - No secrets in the bundle: check `web/dist/` and everything that starts with `VITE_`.
       - XSS: Spotify data (playlist names, descriptions) is only rendered as text by React, never through `dangerouslySetInnerHTML`.
       - CSV formula injection: a playlist or track name that starts with `=`, `+`, `-` or `@` can run as a formula in Excel. Decide whether to prefix those with `'`.
       - A Content Security Policy for GitHub Pages (a `<meta>` tag, since Pages can't set headers), allowing only `api.spotify.com` and `accounts.spotify.com` to be called.
       - Dependencies: `npm audit`, remove what's unused, check the GitHub Actions permissions and pinned versions.
       - Lambda / API Gateway (Phase B): input validation, CORS limited to the site's origin, rate limiting, least-privilege IAM, no PII in logs.
    3. Check `/privacy` against what the code actually does, once more.

## Future features (after architecture migration)
- Allow selection of 'own playlists only' vs. 'subscribed playlists too'
- Allow selection of which fields to be retrieved
- Allow uploading of playlists to a Spotify account
- Visual progress bar for export
- Track traffic
  - Analytics that store or read anything on the device (cookies, ids) need opt-in consent under the EU ePrivacy rules, i.e. a real consent banner. A cookieless, IP-anonymising setup avoids that; update `/privacy` either way.
- Add tooltips to explain json and csv file types

# Known issues and limits
These come from Spotify's rules for apps in Development Mode (see the [February 2026 migration guide](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide)):
- **At most 5 users.** Only the owner of the Spotify app and the users added under *User Management* in the Spotify dashboard can export. Anyone else can run the app with their own Spotify app, see [How to](#how-to). Step 16 makes that possible on the site itself.
- **Only the tracks of playlists you own or collaborate on.** The file lists the playlists you only follow too, without their tracks, and says why (`items_skipped` in json, the `playlist tracks skipped because` column in csv).

# How to
The app lives in `web/`. The Express + Socket.io app it replaced was removed in step 8f; the git tag `express-app-final` points at its last version.

## Prerequisites
- Node.js 24.16 or newer (see `.nvmrc`). With a version manager: `nvm use` (macOS/Linux) or `nvm install 24.16.0` / `fnm use` (Windows, via [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm)).
- `npm install`. This also installs the git hooks (lefthook), see [Checks and commits](#checks-and-commits).

## Run the app
Everything runs in the browser: the login with Spotify (Authorization Code + PKCE), reading the playlists and creating the file. No client secret, certificates or server needed.

### Spotify app setup (once)
- Create an app on [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
- Add these redirect URIs to the app. They must match exactly, including the port, and must use `127.0.0.1`: Spotify only allows plain `http` for loopback IP addresses, not for `localhost`.
  - `http://127.0.0.1:5173/callback` for `npm run web:dev`
  - `http://127.0.0.1:4173/callback` for `npm run web:preview`
- The app's client id is in [web/.env](web/.env), committed on purpose: it isn't a secret, every login URL shows it. To use your own Spotify app, put `VITE_SPOTIFY_CLIENT_ID=<your client id>` in `web/.env.local` (git-ignored), which overrides it. Never put a client secret in either file: everything in them ends up in the browser bundle.
- In Development Mode, a Spotify app only accepts the logins of its owner and of the users added under *User Management* in the dashboard (at most 5), see [Known issues and limits](#known-issues-and-limits).
- To try an export without waiting for all your playlists, put `VITE_EXPORT_PLAYLIST_LIMIT=10` in `web/.env.local`: it exports only the first 10, and the progress log says so. Leave it out to export all of them. Restart `npm run web:dev` after changing a `.env` file.

### Commands
- `npm run web:dev`: dev server with hot reload on [http://127.0.0.1:5173](http://127.0.0.1:5173). Host and port are fixed (`strictPort`), because the redirect URI has to match exactly. If the port is taken, stop the other dev server rather than picking another port.
- `npm run web:build`: type-checks and builds to `web/dist/`, including the `404.html` copy that GitHub Pages needs for deep links like `/about` and `/callback`.
- `npm run web:preview`: serves that build on [http://127.0.0.1:4173](http://127.0.0.1:4173), to check it before deploying.

## Checks and commits
- `npm test` runs Vitest in watch mode (`npm run test:run` for a single run, `npm run test:coverage` for coverage). The tests run in jsdom, a browser environment in Node. The config in the root is a list of Vitest projects, with only `web` in it for now.
- `npm run lint` (ESLint), `npm run check:types` (the app's tsconfigs in `web/`, and the root one for the config files), `npm run format` (Prettier).
- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: ...`, `fix: ...`, `docs: ...`), enforced by commitlint. The pre-commit hook formats and lints staged files and type-checks the project.

# Changelog
- Converted to Typescript.
- Implemented Socket.io as a framework to push statusupdates from server to client. The alternative was using Server Side Events (SSE). Although the use case is unidirectional and I'm not using binaries in the communication, SSE's have a limit to the number of open connections.
- Made separate repo for `spotifyexport.com`
- Support .csv file format, escape `,` in e.g. track names.
- Added a timeout for playlists with > 50 items to adhere to the rate limiting enforced by Spotify.
- After login redirect, the windows scrolls to the loadingmessages / progress messages.
- Fixed local development login flow that was broken because Spotify's OAuth rejects localhost as a redirect URI by pointing to dev.spotifyexport.com at 127.0.0.1 via a DNS A record to allow the app to run locally with a mkcert certificate.
- Rebuilt as a React single-page app (steps 6–8): PKCE login, Spotify API calls and the export file all in the browser, so the Express server, Socket.io, the client secret and the local certificates are gone. Also fixed: a second export after a finished one, HTML entities like `&#x2F;` in names, and CSV escaping of quotes and line breaks.
- Live on GitHub Pages, deployed by GitHub Actions after lint, type-check, tests and build pass (steps 9–10). The default branch is now `main`.

# Troubleshooting
- Spotify shows `INVALID_CLIENT: Invalid redirect URI`: the redirect URI isn't registered exactly as sent. Open the app via `http://127.0.0.1:5173` (not `localhost`), and check that `http://127.0.0.1:5173/callback` is in your Spotify app's redirect URIs.
- "This login wasn't started in this tab, or was already used": the login is tied to the browser tab that started it (`sessionStorage`). Start it again from the home page, in the same tab.
- Spotify refuses the login, or the export fails with *Spotify doesn't let this app read that…* right at the start: your Spotify account probably isn't on the app's list of users. Ask the app's owner to add it under *User Management* in the Spotify dashboard, or use your own Spotify app.
