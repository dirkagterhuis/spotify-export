// Uses Spotify OAuth flow for web apps: https://developer.spotify.com/documentation/general/guides/authorization/code-flow/.
import type { Client } from '../types'
import { config } from '../../config'

import axios from 'axios'
import { URLSearchParams } from 'url'

const redirect_uri = `${config.baseUrl}/spotify-app-callback`

function generateState(): string {
    return (Math.random() + 1).toString(36).substring(7)
}

export function login(client: Client): string {
    client.state = generateState()
    const loginUrl: string =
        'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: config.spotifyClientId,
            scope: 'playlist-read-private',
            redirect_uri: redirect_uri,
            state: client.state,
        })
    return loginUrl
}

export async function getAuthToken(code: string) {
    const requestBody = new URLSearchParams({
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
                    'Origin': config.baseUrl
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

export function validateState(client: Client, state: string, sendLoadingMessageToClient: Function) {
    if (!client) {
        const errorMessage: string = `Error(state_mismatch): no active client found with received state`
        console.log(errorMessage)
    }
    if (state !== client.state) {
        const errorMessage: string = `Error(state_mismatch): different state on client. Get outta here!`
        console.log(errorMessage)
        sendLoadingMessageToClient(client.socketId, errorMessage)
    }
}