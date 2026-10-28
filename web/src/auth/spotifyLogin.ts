// Step 1 of Spotify's Authorization Code + PKCE flow: send the user to Spotify's login page.
// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
import { createCodeChallenge, generateCodeVerifier, generateState } from './pkce'

const authorizeUrl = 'https://accounts.spotify.com/authorize'
// Read-only access to the user's playlists, including private ones. Nothing else.
const scope = 'playlist-read-private'

// Survives the round trip to Spotify in sessionStorage; the callback (step 7c) reads it back.
export const pendingLoginKey = 'spotifyPendingLogin'

export type PendingLogin = {
    codeVerifier: string
    state: string
}

type AuthorizeUrlParams = {
    clientId: string
    redirectUri: string
    state: string
    codeChallenge: string
}

export function buildAuthorizeUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge,
}: AuthorizeUrlParams): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope,
        redirect_uri: redirectUri,
        state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    })
    return `${authorizeUrl}?${params.toString()}`
}

// Derived from wherever the app runs, so dev, preview and production each get their own callback.
// Every one of them has to be registered as a redirect URI in the Spotify app's dashboard.
export function getRedirectUri(): string {
    return `${window.location.origin}/callback`
}

type StartLoginOptions = {
    clientId?: string
    // Injectable so tests can capture the URL instead of leaving the page.
    redirect?: (url: string) => void
}

export async function startLogin({
    clientId = getClientId(),
    redirect = (url) => window.location.assign(url),
}: StartLoginOptions = {}): Promise<void> {
    const codeVerifier = generateCodeVerifier()
    const state = generateState()
    const codeChallenge = await createCodeChallenge(codeVerifier)

    // Store before leaving: the redirect unloads the page, and with it all in-memory state.
    // No try/catch on purpose: without storage the login can't be finished, so the caller should know.
    const pendingLogin: PendingLogin = { codeVerifier, state }
    sessionStorage.setItem(pendingLoginKey, JSON.stringify(pendingLogin))

    redirect(buildAuthorizeUrl({ clientId, redirectUri: getRedirectUri(), state, codeChallenge }))
}

// The client id is public (it ends up in every login URL), so it can live in a committed .env file.
function getClientId(): string {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
    if (!clientId) {
        throw new Error('VITE_SPOTIFY_CLIENT_ID is not set, see web/.env')
    }
    return clientId
}
