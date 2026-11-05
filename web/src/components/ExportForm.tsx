import type { FormEvent } from 'react'
import { Link } from 'react-router'
import type { FileType } from '../fileType'
import { FileTypePicker } from './FileTypePicker'

type ExportFormProps = {
    fileType: FileType
    onFileTypeChange: (fileType: FileType) => void
    isExporting: boolean
    onExport: () => void
}

export function ExportForm({ fileType, onFileTypeChange, isExporting, onExport }: ExportFormProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        // Stop the browser from submitting the form as a page navigation; React handles it instead.
        event.preventDefault()
        onExport()
    }

    return (
        <form onSubmit={handleSubmit}>
            <FileTypePicker value={fileType} onChange={onFileTypeChange} disabled={isExporting} />
            <div className="centre">
                <button type="submit" className="spotify-button" disabled={isExporting}>
                    {isExporting ? 'Exporting…' : 'Get my playlists!'}
                </button>
            </div>
            {/* Spotify's Developer Terms (V.11) require users to agree to the terms before use. */}
            <p className="terms-consent">
                By logging in with Spotify, you agree to the <Link to="/terms">terms of use</Link>{' '}
                and the <Link to="/privacy">privacy notice</Link>.
            </p>
        </form>
    )
}
