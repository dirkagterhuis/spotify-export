import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
    it('renders the page content between the header and the footer', () => {
        render(
            <Layout>
                <p>page content</p>
            </Layout>
        )
        expect(screen.getByRole('banner')).toHaveTextContent('spotifyexport.com')
        expect(screen.getByRole('main')).toHaveTextContent('page content')
        expect(screen.getByRole('contentinfo')).toHaveTextContent('Created by Dirk Agterhuis')
    })
})
