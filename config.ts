import fs from 'fs'
import yaml from 'js-yaml'

// Only set localConfig in dev
let localConfig
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    try {
        localConfig = yaml.load(fs.readFileSync('./local.yml', 'utf8'))
    } catch (e) {
        throw new Error(`In dev environment, localConfig isn't configured correctly: ${e.message}`)
    }
}

export const config = {
    env: process.env.NODE_ENV || 'dev',
    //TODO: change to https when secure.
    baseUrl: process.env.NODE_ENV ? 'http://spotifyexport.com' : 'http://localhost:8000',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret:
        process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret,
}