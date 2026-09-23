import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
    it('renders the site title', () => {
        render(<App />)
        expect(screen.getByRole('heading', { name: 'spotifyexport.com' })).toBeInTheDocument()
    })
})
