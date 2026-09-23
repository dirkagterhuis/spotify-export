import { render, screen } from '@testing-library/react'
import { Section } from './Section'

describe('Section', () => {
    it('renders the title as a heading, followed by its content', () => {
        render(
            <Section title="Why?">
                <p>Because.</p>
            </Section>
        )
        expect(screen.getByRole('heading', { level: 2, name: 'Why?' })).toBeInTheDocument()
        expect(screen.getByText('Because.')).toBeInTheDocument()
    })
})
