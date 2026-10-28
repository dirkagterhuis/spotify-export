import { Link } from 'react-router'

export function Footer() {
    return (
        <footer>
            <p>Created by Dirk Agterhuis</p>
            {/* Keeps the privacy notice reachable after the banner has been dismissed. */}
            <p>
                <Link to="/privacy">privacy</Link>
            </p>
        </footer>
    )
}
