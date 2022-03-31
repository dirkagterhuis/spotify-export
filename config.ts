import fs from 'fs'
import yaml from 'js-yaml'

// Only set localConfig in dev
let localConfig
console.log(`%%% process.env.NODE_ENV: ${process.env.NODE_ENV}`)
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    try {
        localConfig = yaml.load(fs.readFileSync('./local.yml', 'utf8'))
    } catch (e) {
        throw new Error(`In dev environment, localConfig isn't configured correctly: ${e.message}`)
    }
}

export const config = {
    env: process.env.NODE_ENV || 'dev',
    baseUrl: process.env.NODE_ENV ? 'https://spotifyexport.com' : 'http://localhost:8000',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret:
        process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret,
}