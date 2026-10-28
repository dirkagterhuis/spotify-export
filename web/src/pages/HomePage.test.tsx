import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
        let finishExport = () => {}
        const exportPlaylists = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    finishExport = resolve
                })
        )
        render(<HomePage exportPlaylists={exportPlaylists} />)

        await user.click(screen.getByRole('radio', { name: 'csv' }))
        await user.click(screen.getByRole('button', { name: 'Get my playlists!' }))

        expect(exportPlaylists).toHaveBeenCalledWith('csv')
        expect(screen.getByRole('button', { name: 'Exporting…' })).toBeDisabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeDisabled()

        finishExport()

        expect(await screen.findByRole('button', { name: 'Get my playlists!' })).toBeEnabled()
        expect(screen.getByRole('radio', { name: 'json' })).toBeEnabled()
    })
})
