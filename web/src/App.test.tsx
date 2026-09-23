import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { App } from './App'

function renderAt(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <App />
        </MemoryRouter>
    )
}

describe('App', () => {
    it('renders the home page at /', () => {
        renderAt('/')
        expect(
            screen.getByRole('heading', { level: 2, name: 'How does it work?' })
        ).toBeInTheDocument()
    })

    it('renders the about page at /about', () => {
        renderAt('/about')
        expect(screen.getByRole('heading', { level: 2, name: 'About' })).toBeInTheDocument()
    })

    it('renders the not-found page for unknown paths', () => {
        renderAt('/does-not-exist')
        expect(
            screen.getByRole('heading', { level: 2, name: 'Page not found' })
        ).toBeInTheDocument()
    })

    it('navigates via the header links and marks the current page', async () => {
        const user = userEvent.setup()
        renderAt('/')

        await user.click(screen.getByRole('link', { name: 'about' }))

        expect(screen.getByRole('heading', { level: 2, name: 'About' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'about' })).toHaveAttribute('aria-current', 'page')
        expect(screen.getByRole('link', { name: 'spotify export' })).not.toHaveAttribute(
            'aria-current'
        )
    })
})
