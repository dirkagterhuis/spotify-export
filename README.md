# spotifyexport.com
This application allows users to export playlists from their Spotify account. Pushing a button will:
1. Authorize the users' Spotify Account to read their playslists through an OAuth 2.0 flow.
2. Retrieve all playlists. 
3. Per playlist, retrieve all tracks. 

The application is built in Typescript and is currently hosted on AWS. 

# Future features
- [ ] Allow selection of 'own playlists only' vs. 'subscribed playlists too'. 
- [ ] Allow selection of which fields to be retrieved.
- [ ] Allow uploading of playlists to a Spotify account. 
- [ ] Possibly show the server .json or .csv as a textbox, not as a file to download.
- [ ] Use proper session management with e.g. Redis or node-cache to store active sessiens, get session id from server, not client. Pro: get session id in every express request, and more secure. Con: will have to use cookies?
  - [ ] https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/
  - [ ] https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
- [ ] After pressing the button, the user is always authenticated. Might not always be necessary for an active session.

# Known issues
- Sometimes, a given track of a playlist may be `null`. No idea why, but these are skipped.
- csv: check csv separation character or escape ; or , in playlist/track names

# How to

## Setup development environment
You'll need a spotify app which you can create on [https://developer.spotify.com/dashboard/login](https://developer.spotify.com/dashboard/login).

- `npm install`
- Save your Spotify App `Client Id` and `Client Secret` in `local.yml`. Don't worry: this file is in `.gitignore`:
```yml
localSpotifyAppClientId: "INSERT_CLIENT_ID"
localSpotifyAppClientSecret: "INSERT_CLIENT_SECRET"
```
- `npm run dev` to start up local server on [localhost:8000](localhost:8000)

## Set up AWS Elastic Beanstalk
- [ ] When AWS free tier has ran out, Consider using heroku for free (only for non-commercial use) or €25/month. AWS will be min €19/month.
- [Deploying an Express application to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_express.html)
  - Install the Elastic Beanstalk (EB) CLI. As an easier alternative to https://github.com/aws/aws-elastic-beanstalk-cli-setup, use `brew install awsebcli`
  - AWS supports Node.js 14 as highest version
  - `eb init`
    - Region: eu-west-1 (Ireland)
    - CodeCommit: origin/master
    - This will create `.elasticbeanstalk/`
  - `eb create`: creates an environment in AWS
    - Environment name
    - DNS CNAME prefix
    - Load balancer type -> application
    - Spot Flee -> N

## Build
- `npm run build`. It sucks, but this could give `Missing script: "build"`. In that case, copy-pasta the script.
  - To do: configure webpack to include the html files in `./dist` instead of copying them over.

# Changelog
- Converted to TS due to annoying Node/JS issues in node versions.
- Static website vs. Node.JS app: Went with Node.js: I want to learn it, and move it to TS, so just do it. It also makes this 1000 times easier and the learning more meaningfull than writing some vanilla static website that does everything itself without using NPM libraries. While at it, trying out AWS or otherwise Heroku, since I want to become more familiar with AWS anyway.
- Implemented Socket.io as a framework to push statusupdates from server to client. The alternative was using Server Side Events (SSE). Although the use case is unidirectional and I'm not using binaries in the communication, SSE's have a limit to the number of open connections.
- Allow multiple sessions/clients simultaneously 
- Made separate repo for `spotify-export.com`
- Support .csv file format.

# Troubleshooting
- During auth/login to spotify: redirect isn't working: Solution: add `http://localhost:8000/spotify-app` to the allowed redirect URI's on developer.spotify.com.