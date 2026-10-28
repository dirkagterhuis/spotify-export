import { StrictMode, type ComponentProps } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { exportAfterLoginState } from '../auth/exportAfterLogin'
import type { FileType } from '../fileType'
import { HomePage } from './HomePage'

// Most tests are about the export itself, so they start logged in with a token that's still valid.
const validToken = { accessToken: 'token-xyz', expiresAt: Date.now() + 3_600_000 }

// The page links to /privacy, and a Link needs a router around it.
function renderHomePage(props: ComponentProps<typeof HomePage> = {}) {
    return render(
        <MemoryRouter>
            <HomePage spotifyToken={validToken} {...props} />
        </MemoryRouter>
    )
}

// Arrives the way /callback sends the user back: with the location state that asks for the export.
function renderAfterLogin(props: ComponentProps<typeof HomePage> = {}) {
    return render(
        <StrictMode>
            <MemoryRouter initialEntries={[{ pathname: '/', state: exportAfterLoginState }]}>
                <HomePage spotifyToken={validToken} {...props} />
            </MemoryRouter>
        </StrictMode>
    )
}

describe('HomePage', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('defaults to json and remembers the chosen file type', async () => {
        const user = userEvent.setup()
        const { unmount } = renderHomePage()
        expect(screen.getByRole('radio', { name: 'json' })).toBeChecked()

        await user.click(screen.getByRole('radio', { name: 'csv' }))
        unmount()

        renderHomePage()
        expect(screen.getByRole('radio', { name: 'csv' })).toBeChecked()
    })

    it('exports with the chosen file type and disables the form while exporting', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, finishExport } = controllableExport()
        renderHomePage({ exportPlaylists })

        await user.click(screen.getByRole('radio', { name: 'csv' }))
        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(exportPlaylists).toHaveBeenCalledWith('token-xyz', 'csv', expect.any(Function))
        expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeDisabled()

        act(() => finishExport())

        expect(await screen.findByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeEnabled()
    })

    it('shows progress messages and a done summary', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, report, finishExport } = controllableExport()
        renderHomePage({ exportPlaylists })
        expect(screen.queryByRole('log')).not.toBeInTheDocument()

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))
        act(() => report('Retrieved 2 playlists'))
        act(() => report('Getting tracks for playlist #001'))

        const items = within(screen.getByRole('log')).getAllByRole('listitem')
        expect(items.map((item) => item.textContent)).toEqual([
            'Retrieved 2 playlists',
            'Getting tracks for playlist #001',
        ])

        act(() => finishExport())

        expect(await screen.findByText(/^Done!/)).toBeInTheDocument()
    })

    it('shows the error when the export fails', async () => {
        const user = userEvent.setup()
        const exportPlaylists = vi.fn(() => Promise.reject(new Error('Spotify is down')))
        renderHomePage({ exportPlaylists })

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(await screen.findByText('Something went wrong: Spotify is down')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
    })

    it('logs in first when there is no token, without exporting', async () => {
        const user = userEvent.setup()
        const login = vi.fn(() => new Promise<void>(() => {}))
        const exportPlaylists = vi.fn()
        renderHomePage({ spotifyToken: undefined, login, exportPlaylists })

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(login).toHaveBeenCalledTimes(1)
        expect(exportPlaylists).not.toHaveBeenCalled()
        expect(screen.getByText('Taking you to Spotify to log in…')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
    })

    it('logs in again when the token has expired', async () => {
        const user = userEvent.setup()
        const login = vi.fn(() => new Promise<void>(() => {}))
        const expiredToken = { accessToken: 'old', expiresAt: Date.now() - 1 }
        renderHomePage({ spotifyToken: expiredToken, login })

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(login).toHaveBeenCalledTimes(1)
    })

    it('shows the error when the login cannot start', async () => {
        const user = userEvent.setup()
        const login = vi.fn(() => Promise.reject(new Error('VITE_SPOTIFY_CLIENT_ID is not set')))
        renderHomePage({ spotifyToken: undefined, login })

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(
            await screen.findByText('Something went wrong: VITE_SPOTIFY_CLIENT_ID is not set')
        ).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
    })

    it('starts the export by itself after the login, once, even under StrictMode', () => {
        const { exportPlaylists } = controllableExport()
        renderAfterLogin({ exportPlaylists })

        expect(exportPlaylists).toHaveBeenCalledTimes(1)
        expect(exportPlaylists).toHaveBeenCalledWith('token-xyz', 'json', expect.any(Function))
        expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
    })

    it('does not start an export on a normal visit', () => {
        const { exportPlaylists } = controllableExport()
        renderHomePage({ exportPlaylists })

        expect(exportPlaylists).not.toHaveBeenCalled()
    })

    it('does not start an export after the login without a valid token', () => {
        const { exportPlaylists } = controllableExport()
        renderAfterLogin({ exportPlaylists, spotifyToken: undefined })

        expect(exportPlaylists).not.toHaveBeenCalled()
    })

    it('starts a fresh log when exporting again', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, report, finishExport } = controllableExport()
        renderHomePage({ exportPlaylists })

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))
        act(() => report('first run'))
        act(() => finishExport())
        await user.click(await screen.findByRole('button', { name: 'Get my playlists!' }))

        expect(screen.queryByText('first run')).not.toBeInTheDocument()
        expect(screen.queryByText(/^Done!/)).not.toBeInTheDocument()
    })
})

// A fake export the test drives by hand: report progress lines and finish whenever it wants.
function controllableExport() {
    let onProgress: (message: string) => void = () => {}
    let finishExport = () => {}
    const exportPlaylists = vi.fn(
        (_accessToken: string, _fileType: FileType, reportProgress: (message: string) => void) =>
            new Promise<void>((resolve) => {
                onProgress = reportProgress
                finishExport = resolve
            })
    )
    return {
        exportPlaylists,
        report: (message: string) => onProgress(message),
        finishExport: () => finishExport(),
    }
}
