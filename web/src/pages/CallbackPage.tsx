import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { exportAfterLoginState } from '../auth/exportAfterLogin'
import { completeLogin, type SpotifyToken } from '../auth/spotifyCallback'
import { Section } from '../components/Section'

type CallbackPageProps = {
    onLogin: (token: SpotifyToken) => void
    completeLoginFn?: (search: string) => Promise<SpotifyToken>
}

// Spotify redirects here after the login (the redirect URI), with `?code=...&state=...` in the URL.
export function CallbackPage({ onLogin, completeLoginFn = completeLogin }: CallbackPageProps) {
    const { search } = useLocation()
    const navigate = useNavigate()
    const [error, setError] = useState<string>()
    // In development, StrictMode runs every effect twice to expose effects that aren't safe to repeat.
    // This one isn't: a code can be exchanged only once. The ref survives StrictMode's remount, so
    // the second run sees `true` and stops. (Production runs effects once; the guard costs nothing.)
    const hasStarted = useRef(false)

    useEffect(() => {
        if (hasStarted.current) {
            return
        }
        hasStarted.current = true
        completeLoginFn(search).then(
            (token) => {
                onLogin(token)
                // `replace` swaps the /callback entry in the history for /, so the used code leaves the
                // address bar and the back button doesn't return to a dead callback. The state tells
                // the home page to carry on with the export that sent the user to Spotify.
                void navigate('/', { replace: true, state: exportAfterLoginState })
            },
            (loginError: unknown) =>
                setError(loginError instanceof Error ? loginError.message : String(loginError))
        )
    }, [completeLoginFn, search, onLogin, navigate])

    if (error) {
        return (
            <Section title="Login failed">
                <p>{error}</p>
                <p>
                    <Link to="/">Back to spotify export</Link>
                </p>
            </Section>
        )
    }

    return (
        <Section title="Logging in to Spotify">
            <p>One moment…</p>
        </Section>
    )
}
