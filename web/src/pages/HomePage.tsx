import { useState } from 'react'
import { ExportForm } from '../components/ExportForm'
import { Section } from '../components/Section'
import { fakeExport } from '../fakeExport'
import { FileTypeSchema } from '../fileType'
import { useSessionStorage } from '../hooks/useSessionStorage'

type HomePageProps = {
    exportPlaylists?: typeof fakeExport
}

export function HomePage({ exportPlaylists = fakeExport }: HomePageProps) {
    // State is lifted up to the page: the picker and the button both depend on it, and the progress
    // log (6e) will too. Same storage key as the old frontend, so the choice survives the login redirect.
    const [fileType, setFileType] = useSessionStorage('selectedFileType', FileTypeSchema, 'json')
    const [isExporting, setIsExporting] = useState(false)

    function handleExport() {
        setIsExporting(true)
        // Event handlers can't await; `finally` re-enables the form whether the export succeeds or not.
        // Error handling lands with the export status union type in 6e.
        void exportPlaylists(fileType).finally(() => setIsExporting(false))
    }

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
            <Section title="Let's get started!">
                <ExportForm
                    fileType={fileType}
                    onFileTypeChange={setFileType}
                    isExporting={isExporting}
                    onExport={handleExport}
                />
            </Section>
        </>
    )
}
