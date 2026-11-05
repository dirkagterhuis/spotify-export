import { Link } from 'react-router'
import { Section } from '../components/Section'

// The end user agreement that Spotify's Developer Terms (section V.11) require an app to show
// and have its users agree to. Keep the five minimum terms from V.11 in here when editing.
export function TermsPage() {
    return (
        <>
            <Section title="Terms of use">
                <p>
                    By logging in with Spotify on this site, you agree to these terms and to the{' '}
                    <Link to="/privacy">privacy notice</Link>. They are short, because the site does
                    one thing: export your own playlists to a file on your own device, for your own
                    personal, non-commercial use.
                </p>
            </Section>
            <Section title="No warranties">
                <p>
                    This site is provided as is, without any warranty. Neither the site owner nor
                    Spotify makes any promise that it works, is available, or that the export is
                    complete or correct. As far as the law allows, all implied warranties are
                    disclaimed, including those of merchantability and fitness for a particular
                    purpose. No one makes any warranty on Spotify's behalf.
                </p>
            </Section>
            <Section title="Spotify's service and content">
                <p>You may not, through this site:</p>
                <ul>
                    <li>
                        modify or create derivative works of the Spotify platform, the Spotify
                        service or Spotify content;
                    </li>
                    <li>
                        decompile, reverse engineer, disassemble or otherwise try to get at the
                        source code of the Spotify platform, the Spotify service or Spotify content.
                    </li>
                </ul>
                <p>
                    Your use of Spotify itself stays covered by{' '}
                    <a href="https://www.spotify.com/legal/end-user-agreement/">
                        Spotify's terms of use
                    </a>
                    . This site's own code is open source under the MIT license; the rules above are
                    about Spotify's, not this site's.
                </p>
            </Section>
            <Section title="Responsibility">
                <p>
                    The site owner, not Spotify, is responsible for this site and its content. As
                    far as the law allows, Spotify and other third parties are not liable for
                    anything that results from using it.
                </p>
                <p>
                    Spotify is a third-party beneficiary of these terms and of the privacy notice,
                    and may enforce these terms directly.
                </p>
            </Section>
        </>
    )
}
