import { Section } from '../components/Section'

// Describes the app as it works once PKCE (step 7) and client-side fetching (step 8) land, which is
// also when this SPA goes live. Revisit when the optional analytics backend (Phase B) is added.
export function PrivacyPage() {
    return (
        <>
            <Section title="Privacy">
                <p>
                    The short version: no cookies, no analytics, no ads, and no server of ours that
                    ever sees your playlists. Everything happens between your browser and Spotify.
                </p>
            </Section>
            <Section title="What happens when you export">
                <p>
                    You log in on Spotify's own page; this site never sees your password. Spotify
                    then gives your browser a temporary access token that can only read your
                    playlists (the <code>playlist-read-private</code> permission). Your browser uses
                    it to fetch your playlists directly from Spotify and builds the export file on
                    your own device. The token expires after an hour.
                </p>
            </Section>
            <Section title="What is stored in your browser">
                <p>
                    Only a few small values in your browser's session storage, which is cleared when
                    you close the tab:
                </p>
                <ul>
                    <li>the file format you picked (json or csv);</li>
                    <li>whether you dismissed the privacy notice;</li>
                    <li>
                        while you log in, two one-time random values that protect the login against
                        tampering.
                    </li>
                </ul>
            </Section>
            <Section title="Hosting">
                <p>
                    This site is hosted on GitHub Pages. Like any web host, GitHub may log technical
                    data such as your IP address when your browser loads the site. See{' '}
                    <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
                        GitHub's privacy statement
                    </a>
                    . Your Spotify account itself is covered by{' '}
                    <a href="https://www.spotify.com/legal/privacy-policy/">
                        Spotify's privacy policy
                    </a>
                    .
                </p>
            </Section>
            <Section title="Who runs this site">
                <p>
                    spotifyexport.com is a hobby project run by Dirk Agterhuis. The code is open
                    source, so you can check all of this yourself. Other questions or ideas are
                    welcome as an issue on{' '}
                    <a href="https://github.com/dirkagterhuis/spotify-export/issues">GitHub</a>.
                </p>
            </Section>
        </>
    )
}
