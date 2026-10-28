import { completeLogin, isTokenValid } from './spotifyCallback'
import { getRedirectUri, pendingLoginKey } from './spotifyLogin'

function storePendingLogin(state = 'state-123', codeVerifier = 'verifier-abc') {
    sessionStorage.setItem(pendingLoginKey, JSON.stringify({ codeVerifier, state }))
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function tokenFetch() {
    return vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse({
            access_token: 'token-xyz',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'refresh',
            scope: 'playlist-read-private',
        })
    )
}

describe('completeLogin', () => {
    afterEach(() => {
        sessionStorage.clear()
        vi.useRealTimers()
    })

    it('exchanges the code and the stored verifier for an access token', async () => {
        vi.useFakeTimers({ now: 1_000_000 })
        storePendingLogin()
        const fetchFn = tokenFetch()

        const token = await completeLogin('?code=code-1&state=state-123', {
            clientId: 'client-id',
            fetchFn,
        })

        expect(token).toEqual({ accessToken: 'token-xyz', expiresAt: 1_000_000 + 3_600_000 })
        const [url, init] = fetchFn.mock.calls[0]
        expect(url).toBe('https://accounts.spotify.com/api/token')
        expect(init?.method).toBe('POST')
        expect(Object.fromEntries(init?.body as URLSearchParams)).toEqual({
            grant_type: 'authorization_code',
            code: 'code-1',
            redirect_uri: getRedirectUri(),
            client_id: 'client-id',
            code_verifier: 'verifier-abc',
        })
    })

    it('uses the stored login only once', async () => {
        storePendingLogin()
        const options = { clientId: 'client-id', fetchFn: tokenFetch() }

        await completeLogin('?code=code-1&state=state-123', options)

        expect(sessionStorage.getItem(pendingLoginKey)).toBeNull()
        await expect(completeLogin('?code=code-1&state=state-123', options)).rejects.toThrow(
            "wasn't started in this tab"
        )
    })

    it('rejects a callback whose state does not match, without calling Spotify', async () => {
        storePendingLogin('state-123')
        const fetchFn = tokenFetch()

        await expect(
            completeLogin('?code=code-1&state=forged', { clientId: 'client-id', fetchFn })
        ).rejects.toThrow("doesn't match")
        expect(fetchFn).not.toHaveBeenCalled()
    })

    it('explains when the user denied access', async () => {
        storePendingLogin()

        await expect(
            completeLogin('?error=access_denied&state=state-123', {
                clientId: 'client-id',
                fetchFn: tokenFetch(),
            })
        ).rejects.toThrow("didn't allow access")
        // Also cleaned up on failure, so a stale login can't be replayed later.
        expect(sessionStorage.getItem(pendingLoginKey)).toBeNull()
    })

    it("passes on Spotify's reason when the exchange is refused", async () => {
        storePendingLogin()
        const fetchFn = vi
            .fn<typeof fetch>()
            .mockResolvedValue(
                jsonResponse(
                    { error: 'invalid_grant', error_description: 'Invalid authorization code' },
                    400
                )
            )

        await expect(
            completeLogin('?code=old&state=state-123', { clientId: 'client-id', fetchFn })
        ).rejects.toThrow('Spotify refused the login: Invalid authorization code')
    })
})

describe('isTokenValid', () => {
    it('accepts a token until it expires', () => {
        expect(isTokenValid({ accessToken: 'token', expiresAt: Date.now() + 60_000 })).toBe(true)
        expect(isTokenValid({ accessToken: 'token', expiresAt: Date.now() - 1 })).toBe(false)
        expect(isTokenValid(undefined)).toBe(false)
    })
})
