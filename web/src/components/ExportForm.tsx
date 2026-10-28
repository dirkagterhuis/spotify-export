import type { FormEvent } from 'react'
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
        </form>
    )
}
