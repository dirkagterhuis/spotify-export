// The building blocks of PKCE (Proof Key for Code Exchange, RFC 7636): https://www.rfc-editor.org/rfc/rfc7636.
// Uses the browser's Web Crypto API, so no library is needed and the randomness is cryptographically secure.

// The secret half of PKCE: stays in the browser until the token exchange.
// 32 random bytes become 43 base64url characters, the minimum length the RFC allows.
export function generateCodeVerifier(): string {
    return randomBase64Url(32)
}

// Ties the redirect back from Spotify to the login this tab started, against forged callbacks (CSRF).
export function generateState(): string {
    return randomBase64Url(16)
}

// The public half of PKCE: sent with the login. Spotify keeps it and later checks the verifier against it.
// SHA-256 is one-way, so seeing the challenge doesn't reveal the verifier.
export async function createCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
    return base64UrlEncode(new Uint8Array(digest))
}

function randomBase64Url(byteLength: number): string {
    return base64UrlEncode(crypto.getRandomValues(new Uint8Array(byteLength)))
}

// Base64url is base64 made safe for URLs: `-` and `_` instead of `+` and `/`, and no `=` padding.
function base64UrlEncode(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
