import { Link } from 'react-router'

const repoUrl = 'https://github.com/dirkagterhuis/spotify-export'

export function Footer() {
    return (
        <footer>
            <p>
                Created by <a href="https://github.com/dirkagterhuis">Dirk Agterhuis</a>
            </p>
            {/* `footer-links` puts the links on one line with separators drawn in CSS. */}
            <ul className="footer-links">
                <li>
                    <a href={repoUrl}>source on GitHub</a>
                </li>
                <li>
                    {/* GitHub renders the README and turns each heading into an anchor. */}
                    <a href={`${repoUrl}#how-to`}>run it yourself</a>
                </li>
                <li>
                    {/* Keeps the privacy notice reachable after the banner has been dismissed. */}
                    <Link to="/privacy">privacy</Link>
                </li>
            </ul>
        </footer>
    )
}
