import { createCodeChallenge } from './pkce'
import {
    buildAuthorizeUrl,
    getRedirectUri,
    pendingLoginKey,
    startLogin,
    type PendingLogin,
} from './spotifyLogin'

describe('buildAuthorizeUrl', () => {
    it('asks Spotify for a code, read-only playlist access and an S256 challenge', () => {
        const url = new URL(
            buildAuthorizeUrl({
                clientId: 'client-id',
                redirectUri: 'http://127.0.0.1:5173/callback',
                state: 'state',
                codeChallenge: 'challenge',
            })
        )

        expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize')
        expect(Object.fromEntries(url.searchParams)).toEqual({
            response_type: 'code',
            client_id: 'client-id',
            scope: 'playlist-read-private',
            redirect_uri: 'http://127.0.0.1:5173/callback',
            state: 'state',
            code_challenge_method: 'S256',
            code_challenge: 'challenge',
        })
    })
})

describe('startLogin', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('stores the verifier and state, and redirects with the matching challenge', async () => {
        let redirectedTo = ''
        await startLogin({ clientId: 'client-id', redirect: (url) => (redirectedTo = url) })

        const stored = JSON.parse(sessionStorage.getItem(pendingLoginKey) ?? '{}') as PendingLogin
        const params = new URL(redirectedTo).searchParams
        expect(params.get('state')).toBe(stored.state)
        expect(params.get('code_challenge')).toBe(await createCodeChallenge(stored.codeVerifier))
        expect(params.get('redirect_uri')).toBe(getRedirectUri())
    })

    it('never puts the verifier itself in the url', async () => {
        let redirectedTo = ''
        await startLogin({ clientId: 'client-id', redirect: (url) => (redirectedTo = url) })

        const stored = JSON.parse(sessionStorage.getItem(pendingLoginKey) ?? '{}') as PendingLogin
        expect(redirectedTo).not.toContain(stored.codeVerifier)
    })
})
