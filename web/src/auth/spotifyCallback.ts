// Step 2 of Spotify's Authorization Code + PKCE flow: Spotify sent the user back to /callback with
// a one-time code; trade it, plus the verifier only this tab knows, for an access token.
// https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow#request-an-access-token
import { z } from 'zod'
import { getClientId, getRedirectUri, pendingLoginKey, PendingLoginSchema } from './spotifyLogin'

const tokenUrl = 'https://accounts.spotify.com/api/token'

// Spotify also sends a refresh_token. Zod drops keys the schema doesn't list, so it is never kept:
// one access token lasts an hour, plenty for an export.
const TokenResponseSchema = z.object({
    access_token: z.string(),
    expires_in: z.number(),
})

const TokenErrorSchema = z.object({
    error: z.string(),
    error_description: z.string().optional(),
})

export type SpotifyToken = {
    accessToken: string
    // Epoch milliseconds, so callers can tell an expired token from a fresh one without a request.
    expiresAt: number
}

type CompleteLoginOptions = {
    clientId?: string
    // Injectable so tests don't call Spotify.
    fetchFn?: typeof fetch
}

// Takes the query string of the callback URL, e.g. `?code=...&state=...` or `?error=access_denied&state=...`.
export async function completeLogin(
    search: string,
    { clientId = getClientId(), fetchFn = fetch }: CompleteLoginOptions = {}
): Promise<SpotifyToken> {
    const params = new URLSearchParams(search)
    // Read and remove right away, whatever happens next: verifier and state are good for one try only.
    const pendingLogin = takePendingLogin()

    const error = params.get('error')
    if (error === 'access_denied') {
        throw new Error("You didn't allow access to your playlists, so there is nothing to export.")
    }
    if (error) {
        throw new Error(`Spotify login failed: ${error}`)
    }
    if (!pendingLogin) {
        throw new Error("This login wasn't started in this tab, or was already used. Try again.")
    }
    // The CSRF check: only accept a callback that answers the login this tab started.
    if (params.get('state') !== pendingLogin.state) {
        throw new Error("The login response doesn't match the login this tab started. Try again.")
    }
    const code = params.get('code')
    if (!code) {
        throw new Error("Spotify didn't send a login code. Try again.")
    }

    return exchangeCodeForToken({
        clientId,
        code,
        codeVerifier: pendingLogin.codeVerifier,
        fetchFn,
    })
}

type ExchangeParams = {
    clientId: string
    code: string
    codeVerifier: string
    fetchFn: typeof fetch
}

// Where the old server sent `client_secret`, PKCE sends `client_id` + `code_verifier`. Spotify hashes
// the verifier and only answers if it matches the challenge from the login URL.
async function exchangeCodeForToken({
    clientId,
    code,
    codeVerifier,
    fetchFn,
}: ExchangeParams): Promise<SpotifyToken> {
    const response = await fetchFn(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            // Must be identical to the redirect_uri of the login, or Spotify rejects the exchange.
            redirect_uri: getRedirectUri(),
            client_id: clientId,
            code_verifier: codeVerifier,
        }),
    })
    const body: unknown = await response.json()

    if (!response.ok) {
        const parsedError = TokenErrorSchema.safeParse(body)
        const reason = parsedError.success
            ? (parsedError.data.error_description ?? parsedError.data.error)
            : `HTTP ${response.status}`
        throw new Error(`Spotify refused the login: ${reason}`)
    }

    const token = TokenResponseSchema.parse(body)
    return {
        accessToken: token.access_token,
        expiresAt: Date.now() + token.expires_in * 1000,
    }
}

function takePendingLogin() {
    try {
        const raw = sessionStorage.getItem(pendingLoginKey)
        sessionStorage.removeItem(pendingLoginKey)
        if (raw === null) {
            return undefined
        }
        const result = PendingLoginSchema.safeParse(JSON.parse(raw))
        return result.success ? result.data : undefined
    } catch {
        return undefined
    }
}
