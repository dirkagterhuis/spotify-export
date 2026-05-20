# spotifyexport.com
This application allows users to export playlists from their Spotify account. Pushing a button will:
1. Authorize the users' Spotify Account to read their playslists through an OAuth 2.0 flow.
2. Retrieve all playlists. 
3. Per playlist, retrieve all tracks. 

The application is built in Typescript and is currently hosted on AWS. You can also clone this repository and run it from there; see the 'How to' section on this page. 

# Roadmap new
- Get it working again locally: disable cap of 10 playlists and actually export all playlists. 
- Revisit architecture: from aws container to ?Lamda? something else? 
- Make it React
- Setup a convenient pipeline
- Create provisioning with terraform
- Store sessions/users

# Roadmap OLD
- After refresh/redirect: scroll down to page with download, or move progress logs up.
- Add a visual loader: progress for download.
- Allow selection of 'own playlists only' vs. 'subscribed playlists too'. 
- Allow selection of which fields to be retrieved.
- Allow uploading of playlists to a Spotify account. 
- Possibly show the served .json or .csv as a textbox, not as a file to download, so the user can copy it.
- Use tooltips to explain abbout filetypes.
- After pressing the button, the user is always authenticated. Might not always be necessary for an active session.
- Improve error handling to user: use `sendLoadingMessageToClient()` or use error page.

# Technical improvements
- Clean up `index.ts` and implement proper routing for api routes and socket.io, e.g. [example](https://stackoverflow.com/questions/59681974/how-to-organize-routes-in-nodejs-express-app) or [for socket.io](https://stackoverflow.com/questions/20466129/how-to-organize-socket-handling-in-node-js-and-socket-io-app). 
- Track traffic.
- Add types everywhere. 
- Add unit tests everywhere.
- Add versioning and versions based on commit messages.
- configure webpack to include the html files in `./dist` instead of copying them over in the `npm run build` script.
- Use proper session management with e.g. Redis or node-cache to store active sessions.Pro: get session id in every express request, and more secure. Con: will have to use cookies? More info [here](https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/) and [here](https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x).

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