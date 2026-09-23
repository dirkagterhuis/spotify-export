import { Section } from '../components/Section'

export function HomePage() {
    return (
        <>
            <p className="centre">
                Welcome to spotifyexport.com. Here you can export your Spotify playlists from
                Spotify.
            </p>
            <Section title="Nice. Why?">
                <p>
                    If you want to backup the music you're enjoying today in a way that you will
                    always be able to access it.
                </p>
            </Section>
            <Section title="How does it work?">
                <p>
                    Just click the big green button below. You can then login to your Spotify
                    account and give this app the permissions to read your playlists. Then, all your
                    playlists will be retrieved and all playlist items will be included in the
                    export.
                </p>
            </Section>
            <Section title="How will I get the export?">
                <p>
                    You can choose to export as{' '}
                    <a href="https://en.wikipedia.org/wiki/JSON">json</a> or{' '}
                    <a href="https://en.wikipedia.org/wiki/Comma-separated_values">csv</a>. If you
                    don't know what json is, choose csv. If you don't know what csv is: you can
                    easily turn it into an Excel file.
                </p>
            </Section>
            <Section title="What about my data?">
                <p>
                    No data is stored anywhere but on your browser, and nothing is tracked. Although
                    this app only retrieves data from your Spotify account, use it at your own risk.
                </p>
            </Section>
        </>
    )
}
