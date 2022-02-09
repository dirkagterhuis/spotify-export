import fs from 'fs'
import yaml from 'js-yaml'

//TODO only do this when localy.yml is there
let localConfig
try {
    localConfig = yaml.load(fs.readFileSync('./local.yml', 'utf8'))
} catch (e) {
    console.log(e)
}

export const config = {
    env: process.env.NODE_ENV || 'dev',
    //TODO: change to https when secure
    baseUrl: process.env.NODE_ENV ? 'http://spotifyexport.com' : 'http://localhost:8000',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret:
        process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret,
}
