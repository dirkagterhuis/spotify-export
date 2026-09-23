import { Link } from 'react-router'
import { Section } from '../components/Section'

export function NotFoundPage() {
    return (
        <Section title="Page not found">
            <p>
                This page doesn't exist. <Link to="/">Go back to spotify export</Link>.
            </p>
        </Section>
    )
}
