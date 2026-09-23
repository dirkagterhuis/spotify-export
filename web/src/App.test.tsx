import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
    it('renders the home page inside the layout', () => {
        render(<App />)
        expect(
            screen.getByRole('heading', { level: 1, name: 'spotifyexport.com' })
        ).toBeInTheDocument()
        expect(
            screen.getByRole('heading', { level: 2, name: 'How does it work?' })
        ).toBeInTheDocument()
    })
})
