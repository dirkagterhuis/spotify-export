import { NavLink } from 'react-router'

export function Header() {
    return (
        <header>
            <h1>spotifyexport.com</h1>
            <nav>
                {/* `end`: only mark "/" as active on exactly "/", not on every path below it */}
                <NavLink to="/" end>
                    spotify export
                </NavLink>{' '}
                | <NavLink to="/about">about</NavLink>
            </nav>
        </header>
    )
}
