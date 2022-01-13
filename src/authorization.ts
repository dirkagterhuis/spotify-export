// Uses Spotify OAuth flow for web apps: https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
import { config } from '../config'
import axios from 'axios'
import url from 'url'

const redirect_uri = 'http://localhost:8000/spotify-app-callback' //TODO: make this dependent on environment // the redirect uri should be added to the allowed redirect URI's on https://developer.spotify.com/

export function generateState(): string {
    return (Math.random() + 1).toString(36).substring(7)
}

export function getSpotifyLoginUrl(state: string): string {
    const loginUrl: string =
        'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: config.spotifyClientId,
            scope: 'playlist-read-private',
            redirect_uri: redirect_uri,
            state: state,
        })
    return loginUrl
}

export async function getAuthToken(code: string) {
    const requestBody = new url.URLSearchParams({
        code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
    })

    try {
        const getTokenResponse = await axios.post(
            'https://accounts.spotify.com/api/token',
            requestBody.toString(),
            {
                method: 'post',
                headers: {
                    Authorization:
                        'Basic ' +
                        Buffer.from(
                            config.spotifyClientId + ':' + config.spotifyClientSecret
                        ).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )
        if (getTokenResponse.status === 200) {
            const data = getTokenResponse.data
            console.log('token: ' + JSON.stringify(data))
            return data.access_token
        }
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error.message)}`)
        throw new Error(error)
    }
}
