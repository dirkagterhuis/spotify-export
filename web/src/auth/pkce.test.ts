import { createCodeChallenge, generateCodeVerifier, generateState } from './pkce'

const base64Url = /^[A-Za-z0-9_-]+$/

describe('generateCodeVerifier', () => {
    it('returns 43 url-safe characters, the minimum length PKCE allows', () => {
        const verifier = generateCodeVerifier()
        expect(verifier).toHaveLength(43)
        expect(verifier).toMatch(base64Url)
    })

    it('returns a different value every time', () => {
        expect(generateCodeVerifier()).not.toBe(generateCodeVerifier())
    })
})

describe('generateState', () => {
    it('returns a different url-safe value every time', () => {
        const state = generateState()
        expect(state).toMatch(base64Url)
        expect(state).not.toBe(generateState())
    })
})

describe('createCodeChallenge', () => {
    it('matches the example from the PKCE spec (RFC 7636, appendix B)', async () => {
        const challenge = await createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')
        expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
    })
})
