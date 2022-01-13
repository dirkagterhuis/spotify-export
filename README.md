# To do
- [ ] Spotify-app
  - [ ] Move everything to separate spotifybackup repo
  - [ ] Allow user to choose json or csv: get user input (json or csv) as param and pass it to spotify as request param and forward it to callback, if that's possible
    - [ ] HIER GEBLEVEN: accept it in BE and process CSV
      - [ ] er lijkt een soort error te zijn met de opgeslagen `spotify-playlists.json`: van 118 playlists geeft hij aan geen tracks te hebben, van 10 wel, en er zijn er 128 in totaal. Terwijl de csv conversion niks met de local playlist te maken zou meoten hebben? En er is natuurlijk die limiet van 10 opgehaalde playlists. Waar gaat dit mis?
        - [ ] --> die playlists haal je ook niet op in dev, duh! -> check waarom csv niet gedownload wordt
    - [ ] add tooltips explaining about the filetypes
    - [ ] store state of fileType selection in sessionstorage or pass it back to client, now it goes back to default after redirect
    - [ ] check csv separation character or escape ; or , in playlist/track names
    - [ ] For playlists without items, log the playlist name but not the items in csv, with a message like 'export of playlist X did not contain items'. NB for example `37i9dQZF1EuByQ9lkv31mS` check the spotify back end if it contains something else
  - [ ] add track uri (retrieved from spotify api) to csv
  - [ ] Clean up the text in the .html
    - [ ] vermeld: nothing is stored, nothing is tracked
  - [ ] Go through all comments in the code
  - [ ] Clean up and organize code properly: more modular.
    - [ ] double check: do you need to store whole socket, or just id?
  - Decide whether to host whole site on AWS, or only spotify app.
  - Deploy to AWS. Forward from 'own' website to AWS website, preferably with own domain in the future.
    - [ ] To budget, add action to shutdown EC2 instance when budget is reached.
    - [ ] Use Elastic Beanstalk to host node.js server? [link](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_nodejs_express.html)
      - [ ] or [link](https://ourcodeworld.com/articles/read/977/how-to-deploy-a-node-js-application-on-aws-ec2-server)
  - [ ] test it with podcast playlists
- [ ] Use menu button for navigation
- [ ] Something to track traffic
- [ ] Implement lambda's?
- [ ] Make something to turn .md blogs into content
- [ ] Convert to ts. Add types.
- [ ] Add tests
- [ ] cookie notification? Only needed if you track users. Using a session id in sessionStorage though, but it's not used for tracking and not traceable to the user. No user id's or data is stored anywhere.
- [ ] Make site available as both static (github pages) as Node.js app using Express. Something with the index.html embedding the /public/views/index.html, but then with all refs working. Try and determine whether it's static or not, and then serve the correct content accordingly, with the right references. Or: use a view engine and move views to root dir, and update refs. Ideally end op with only 1 views dir and 1 static index.html, referencing the views.
  - Converted website to work both as a static website, and as a Node.JS Express app, such that the website works from Github Pages until it's pushed to AWS. Had some issues with hosting locally using `ws` vs. `nodemon`, but Nodemon definitely had a preference in ease of development as you don't have to restart the server on every change. It did however require the whole app to work as a Node.JS Express app, since you run `nodemon index.ts` and got served by the app, while `ws` just rendered the `index.html` in root.-> Didn't work yet.

# Future features
- [ ] Allow selection of 'own playlists only' vs. 'subscribed playlists too'. 
- [ ] Allow selection of which fields to be retrieved.
- [ ] Allow uploading of playlists to a Spotify account. 
- [ ] Possible show the server .json or .csv as a textbox, not as a file to download.
- [ ] Use proper session management with e.g. Redis or node-cache to store active sessiens, get session id from server, not client. Pro: get session id in every express request, and more secure. Con: will have to use cookies?
  - [ ] https://www.section.io/engineering-education/session-management-in-nodejs-using-expressjs-and-express-session/
  - [ ] https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x

# Known issues
- Sometimes, a given track of a playlist may be `null`. No idea why, but these are skipped.

# How to

## Setup development environment
- `npm install`
- Save your Spotify App `Client Id` and `Client Secret` in `local.yml`. Don't worry: this file is in `.gitignore`:
```yml
localSpotifyAppClientId: "INSERT_CLIENT_ID"
localSpotifyAppClientSecret: "INSERT_CLIENT_SECRET"
```
- `npm run dev` to start up local server on localhost:8000

# Changelog
- Converted to TS due to annoying Node/JS issues in node versions.
- Static website vs. Node.JS app: Went with Node.js: I want to learn it, and move it to TS, so just do it. It also makes this 1000 times easier and the learning more meaningfull than writing some vanilla static website that does everything itself without using NPM libraries. While at it, try out AWS or otherwise Heroku, since  you want to learn AWS anyway.
- Implemented Socket.io as a framework to push statusupdates from server to client. The alternative was using Server Side Events (SSE). Although the use case is unidirectional and I'm not using binaries in the communication, SSE's have a limit to the number of open connections.
- Allow multiple sessions/clients simultaneously 

# Troubleshooting
- During auth/login to spotify: redirect isn't working: Solution: add `http://localhost:8000/spotify-app` to the allowed redirect URI's on developer.spotify.com.