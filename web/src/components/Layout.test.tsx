import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Layout } from './Layout'

describe('Layout', () => {
    it('renders the page content between the header and the footer', () => {
        // The header's NavLinks need a router; MemoryRouter keeps the URL in memory instead of the address bar.
        render(
            <MemoryRouter>
                <Layout>
                    <p>page content</p>
                </Layout>
            </MemoryRouter>
        )
        expect(screen.getByRole('banner')).toHaveTextContent('spotifyexport.com')
        expect(screen.getByRole('main')).toHaveTextContent('page content')
        expect(screen.getByRole('contentinfo')).toHaveTextContent('Created by Dirk Agterhuis')
    })
})
