// Saves the export file on the user's computer, without a server: the file only exists in the
// browser's memory, as a Blob, until the browser writes it to the Downloads folder.
// Replaces the `readyForDownload` handler in public/views/index.html of the Express app.
import type { ExportFile } from './exportFile'
import type { FileType } from './fileType'

// Long enough for any browser to have started reading the Blob, see below.
const revokeDelayMs = 10_000

export function downloadFile(file: ExportFile, fileName: string): void {
    const blob = new Blob([file.content], { type: file.mimeType })
    // A short `blob:http://127.0.0.1:5173/<uuid>` URL that points at the Blob in memory. Unlike the
    // `data:` URI of the Express app, the file content isn't copied into the URL itself, so a large
    // export doesn't run into URL length limits.
    const url = URL.createObjectURL(blob)

    // A link with a `download` attribute saves its target instead of opening it. It never has to
    // be visible, but Firefox only follows links that are in the document.
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()

    // The browser keeps the Blob in memory for as long as a URL points at it, so release it. Not
    // right away: `click()` only starts the download, and some browsers (older Safari) read the
    // Blob after it returns, which fails once the URL is revoked.
    setTimeout(() => URL.revokeObjectURL(url), revokeDelayMs)
}

// `spotify playlists export 2026-11-05 21_32_36.json`, in local time, as the Express app named it.
// That one used `toLocaleString('sv-SV')` for the `2026-11-05 21:32:36` format, and the browser
// replaced the colons with `_` because Windows doesn't allow them in file names. Here the `_` is
// written out, so the name doesn't depend on what the browser does with it.
export function exportFileName(fileType: FileType, date = new Date()): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    const time = `${pad(date.getHours())}_${pad(date.getMinutes())}_${pad(date.getSeconds())}`
    return `spotify playlists export ${day} ${time}.${fileType}`
}
