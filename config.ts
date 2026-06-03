import fs from 'fs'
import yaml from 'js-yaml'

interface LocalConfig {
    localSpotifyAppClientId: string
    localSpotifyAppClientSecret: string
}

// Only set localConfig in dev
let localConfig: LocalConfig | undefined
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    try {
        localConfig = yaml.load(fs.readFileSync('./local.yml', 'utf8')) as LocalConfig
    } catch (e) {
        throw new Error(`In dev environment, localConfig isn't configured correctly: ${e.message}`)
    }
}

export const config = {
    env: process.env.NODE_ENV || 'dev',
    baseUrl: process.env.NODE_ENV
        ? 'https://spotifyexport.com'
        : 'https://dev.spotifyexport.com:8000',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig?.localSpotifyAppClientId,
    spotifyClientSecret:
        process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig?.localSpotifyAppClientSecret,
}
