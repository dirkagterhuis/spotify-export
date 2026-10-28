import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { isExportAfterLogin } from '../auth/exportAfterLogin'
import { isTokenValid, type SpotifyToken } from '../auth/spotifyCallback'
import { startLogin } from '../auth/spotifyLogin'
import { ExportForm } from '../components/ExportForm'
import { Hero } from '../components/Hero'
import { ProgressLog } from '../components/ProgressLog'
import { Section } from '../components/Section'
import type { ExportStatus } from '../exportStatus'
import { fakeExport, type ExportPlaylists } from '../fakeExport'
import { FileTypeSchema } from '../fileType'
import { useSessionStorage } from '../hooks/useSessionStorage'

type HomePageProps = {
    exportPlaylists?: ExportPlaylists
    spotifyToken?: SpotifyToken
    login?: () => Promise<void>
}

export function HomePage({
    exportPlaylists = fakeExport,
    spotifyToken,
    login = startLogin,
}: HomePageProps) {
    // State is lifted up to the page: the picker, the button and the progress log all depend on it.
    // Same storage key as the old frontend, so the choice survives the login redirect.
    const [fileType, setFileType] = useSessionStorage('selectedFileType', FileTypeSchema, 'json')
    const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' })
    const [messages, setMessages] = useState<string[]>([])
    const location = useLocation()
    const navigate = useNavigate()
    const exportSectionRef = useRef<HTMLElement>(null)
    // Same StrictMode guard as on the callback page: the export must start once, not twice.
    const hasResumedExport = useRef(false)

    function handleExport() {
        // No token yet, or an hour old: log in first. The export then resumes in the effect below.
        if (!isTokenValid(spotifyToken)) {
            handleLogin()
            return
        }
        startExport(spotifyToken)
    }

    function startExport(token: SpotifyToken) {
        // Start every export with a clean log, so exporting a second time doesn't mix two runs.
        setMessages([])
        setStatus({ kind: 'exporting' })
        // The updater form `previous => ...` matters: this callback runs many times after the click,
        // and the `messages` variable it closed over would still be the empty array from the start.
        const onProgress = (message: string) => setMessages((previous) => [...previous, message])
        // Event handlers can't await, hence `void` with both outcomes handled in `then`.
        void exportPlaylists(token.accessToken, fileType, onProgress).then(
            () => setStatus({ kind: 'done' }),
            (error: unknown) => setStatus({ kind: 'failed', error: errorMessage(error) })
        )
    }

    function handleLogin() {
        setMessages(['Taking you to Spotify to log in…'])
        setStatus({ kind: 'loggingIn' })
        // On success the browser leaves this page, so only the failure needs handling here.
        void login().catch((error: unknown) =>
            setStatus({ kind: 'failed', error: errorMessage(error) })
        )
    }

    // Back from Spotify with a fresh token: carry on with the export the user clicked for.
    // An effect, because nothing is clicked here: the page reacts to how it was navigated to.
    useEffect(() => {
        if (
            hasResumedExport.current ||
            !isExportAfterLogin(location.state) ||
            !isTokenValid(spotifyToken)
        ) {
            return
        }
        hasResumedExport.current = true
        // Drop the state from this history entry, so a reload or back/forward doesn't export again.
        void navigate('.', { replace: true, state: null })
        // After the redirect the page opens at the top; bring the progress log into view.
        exportSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
        startExport(spotifyToken)
    })

    return (
        <>
            <Hero />
            <Section title="Why export your playlists?">
                <p>
                    You probably still have some of the music you grew up with: a shelf of CDs, a
                    box of vinyl, a folder of mp3s. You owned it, so it stayed.
                </p>
                <p>
                    Playlists are different. They only exist inside your Spotify account. Years of
                    carefully built mixes are one cancelled subscription away from being gone. In
                    twenty years, will you still have them?
                </p>
                <p>
                    An export is a backup you keep yourself: a list of every playlist and every
                    track in it, which you can read, search, or use to rebuild them anywhere.
                </p>
            </Section>
            <Section title="How does it work?">
                <ol>
                    <li>Pick a file format below and click the big green button.</li>
                    <li>
                        Log in on Spotify's own page and allow this site to read your playlists.
                    </li>
                    <li>
                        Your browser fetches all your playlists and their tracks from Spotify, then
                        saves them as one file on your device.
                    </li>
                </ol>
            </Section>
            <Section title="Which format should I pick?">
                <p>
                    Choose <a href="https://en.wikipedia.org/wiki/Comma-separated_values">csv</a> if
                    you want to open the export in Excel. Choose{' '}
                    <a href="https://en.wikipedia.org/wiki/JSON">json</a> if you want to process it
                    with code.
                </p>
            </Section>
            <Section title="What about my data?">
                <p>
                    It stays between your browser and Spotify: no cookies, no tracking, and no
                    server of ours in between. Read the <Link to="/privacy">privacy notice</Link>{' '}
                    for the details.
                </p>
            </Section>
            <Section title="Let's get started!" ref={exportSectionRef}>
                <ExportForm
                    fileType={fileType}
                    onFileTypeChange={setFileType}
                    isExporting={status.kind === 'exporting' || status.kind === 'loggingIn'}
                    onExport={handleExport}
                />
                <ProgressLog status={status} messages={messages} />
            </Section>
        </>
    )
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
