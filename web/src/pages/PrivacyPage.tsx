import { Section } from '../components/Section'

// Keep this in line with what the code does. Revisit for the analytics backend (Phase B) and for
// visitors' own Spotify apps (Phase C), which stores a client id in the browser.
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
                    it to fetch your playlists directly from Spotify, builds the export file on your
                    own device and saves it there. Nothing is uploaded anywhere.
                </p>
                <p>
                    The token is only kept in the page's memory, never saved: reloading the page or
                    closing the tab forgets it. It expires after an hour anyway.
                </p>
            </Section>
            <Section title="Disconnecting from Spotify">
                <p>
                    After your first login, Spotify lists this site under the apps that can access
                    your account. To remove that access, open{' '}
                    <a href="https://www.spotify.com/account/apps/">
                        Manage apps in your Spotify account
                    </a>{' '}
                    and click <strong>Remove access</strong> next to this site's app. There is no
                    data of yours on our side to delete afterwards.
                </p>
            </Section>
            <Section title="Spotify's list of users">
                <p>
                    Spotify only lets this site's Spotify app be used by a few people, whom the site
                    owner adds by hand in Spotify's developer dashboard. To be added, you share the
                    name and the email address of your Spotify account with the owner, who enters
                    them there. They are used for nothing else, and removed when you ask.
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
                        tampering. They are deleted as soon as you are back from Spotify.
                    </li>
                </ul>
                <p>
                    No cookies are set, not by this site and not by anyone else through it, so there
                    are no cookie settings to manage. Clearing your browser's site data, or closing
                    the tab, removes the values above.
                </p>
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
                    spotifyexport.com is a hobby project run by Dirk Agterhuis. It is not affiliated
                    with, endorsed by or supported by Spotify. The code is open source, so you can
                    check all of this yourself. Other questions or ideas are welcome as an issue on{' '}
                    <a href="https://github.com/dirkagterhuis/spotify-export/issues">GitHub</a>.
                </p>
            </Section>
        </>
    )
}
