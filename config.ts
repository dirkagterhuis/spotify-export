import fs from 'fs'
import yaml from 'js-yaml'

let localConfig
try {
    localConfig = yaml.load(fs.readFileSync('./local.yml', 'utf8'))
} catch (e) {
    console.log(e)
}

export const config = {
    env: process.env.NODE_ENV || 'dev',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret:
        process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret,
}
