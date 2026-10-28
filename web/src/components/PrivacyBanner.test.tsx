import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { PrivacyBanner } from './PrivacyBanner'

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <PrivacyBanner />
        </MemoryRouter>
    )
}

describe('PrivacyBanner', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('links to the privacy notice', () => {
        renderAt('/')
        expect(screen.getByRole('link', { name: 'Read the privacy notice' })).toHaveAttribute(
            'href',
            '/privacy'
        )
    })

    it('stays dismissed for the rest of the session', async () => {
        const user = userEvent.setup()
        const { unmount } = renderAt('/')

        await user.click(screen.getByRole('button', { name: 'Got it' }))
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
        unmount()

        renderAt('/')
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })

    it('is hidden on the privacy page itself', () => {
        renderAt('/privacy')
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
})
