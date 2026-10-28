import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Footer } from './Footer'

describe('Footer', () => {
    it('links to the author, the source, the run-locally instructions and the privacy notice', () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        )
        const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
        expect(hrefs).toEqual([
            'https://github.com/dirkagterhuis',
            'https://github.com/dirkagterhuis/spotify-export',
            'https://github.com/dirkagterhuis/spotify-export#how-to',
            '/privacy',
        ])
    })
})
