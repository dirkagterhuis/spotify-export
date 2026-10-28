import { useState } from 'react'
import { ExportForm } from '../components/ExportForm'
import { ProgressLog } from '../components/ProgressLog'
import { Section } from '../components/Section'
import type { ExportStatus } from '../exportStatus'
import { fakeExport, type ExportPlaylists } from '../fakeExport'
import { FileTypeSchema } from '../fileType'
import { useSessionStorage } from '../hooks/useSessionStorage'

type HomePageProps = {
    exportPlaylists?: ExportPlaylists
}

export function HomePage({ exportPlaylists = fakeExport }: HomePageProps) {
    // State is lifted up to the page: the picker, the button and the progress log all depend on it.
    // Same storage key as the old frontend, so the choice survives the login redirect.
    const [fileType, setFileType] = useSessionStorage('selectedFileType', FileTypeSchema, 'json')
    const [status, setStatus] = useState<ExportStatus>({ kind: 'idle' })
    const [messages, setMessages] = useState<string[]>([])

    function handleExport() {
        // Start every export with a clean log, so exporting a second time doesn't mix two runs.
        setMessages([])
        setStatus({ kind: 'exporting' })
        // The updater form `previous => ...` matters: this callback runs many times after the click,
        // and the `messages` variable it closed over would still be the empty array from the start.
        const onProgress = (message: string) => setMessages((previous) => [...previous, message])
        // Event handlers can't await, hence `void` with both outcomes handled in `then`.
        void exportPlaylists(fileType, onProgress).then(
            () => setStatus({ kind: 'done' }),
            (error: unknown) =>
                setStatus({
                    kind: 'failed',
                    error: error instanceof Error ? error.message : String(error),
                })
        )
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
                    isExporting={status.kind === 'exporting'}
                    onExport={handleExport}
                />
                <ProgressLog status={status} messages={messages} />
            </Section>
        </>
    )
}
