import { Link, useLocation } from 'react-router'
import { z } from 'zod'
import { useSessionStorage } from '../hooks/useSessionStorage'

// Session storage on purpose: the notice promises that nothing outlives the tab, so the
// "dismissed" flag doesn't either. The cost is that the notice shows again on your next visit.
export function PrivacyBanner() {
    const [dismissed, setDismissed] = useSessionStorage(
        'privacyNoticeDismissed',
        z.boolean(),
        false
    )
    const { pathname } = useLocation()

    // Hooks above, early return below: hooks must run in the same order on every render.
    if (dismissed || pathname === '/privacy') {
        return null
    }

    return (
        <aside className="privacy-banner" aria-label="Privacy notice">
            <p>
                No cookies and no tracking: your playlists go straight from Spotify to your browser.{' '}
                <Link to="/privacy">Read the privacy notice</Link>.
            </p>
            <button type="button" onClick={() => setDismissed(true)}>
                Got it
            </button>
        </aside>
    )
}
