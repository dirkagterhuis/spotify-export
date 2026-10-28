import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FileType } from '../fileType'
import { HomePage } from './HomePage'

describe('HomePage', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('defaults to json and remembers the chosen file type', async () => {
        const user = userEvent.setup()
        const { unmount } = render(<HomePage />)
        expect(screen.getByRole('radio', { name: 'json' })).toBeChecked()

        await user.click(screen.getByRole('radio', { name: 'csv' }))
        unmount()

        render(<HomePage />)
        expect(screen.getByRole('radio', { name: 'csv' })).toBeChecked()
    })

    it('exports with the chosen file type and disables the form while exporting', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, finishExport } = controllableExport()
        render(<HomePage exportPlaylists={exportPlaylists} />)

        await user.click(screen.getByRole('radio', { name: 'csv' }))
        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(exportPlaylists).toHaveBeenCalledWith('csv', expect.any(Function))
        expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeDisabled()

        act(() => finishExport())

        expect(await screen.findByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeEnabled()
    })

    it('shows progress messages and a done summary', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, report, finishExport } = controllableExport()
        render(<HomePage exportPlaylists={exportPlaylists} />)
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
        render(<HomePage exportPlaylists={exportPlaylists} />)

        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(await screen.findByText('Something went wrong: Spotify is down')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
    })

    it('starts a fresh log when exporting again', async () => {
        const user = userEvent.setup()
        const { exportPlaylists, report, finishExport } = controllableExport()
        render(<HomePage exportPlaylists={exportPlaylists} />)

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
        (_fileType: FileType, reportProgress: (message: string) => void) =>
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
