// Turns the exported playlists into the content of the file the user downloads.
// Replaces src/functions/generateReturnFile.ts of the Express app (git tag express-app-final).
import type { FileType } from './fileType'
import type { PlaylistItem, PlaylistWithItems } from './spotify/schemas'

export type ExportFile = {
    content: string
    // For the Blob in downloadFile, so the browser and the OS know what kind of file it is.
    mimeType: string
}

export function createExportFile(playlists: PlaylistWithItems[], fileType: FileType): ExportFile {
    const decoded = playlists.map(decodePlaylistText)
    switch (fileType) {
        case 'json':
            return {
                content: JSON.stringify(decoded, null, 4),
                mimeType: 'application/json;charset=utf-8',
            }
        case 'csv':
            // The BOM (byte order mark) is an invisible first character that tells Excel the file
            // is UTF-8. Without it, Excel guesses another encoding and garbles é, ü, emoji etc.
            // JSON gets none: JSON.parse fails on a BOM.
            return { content: '\uFEFF' + toCsv(decoded), mimeType: 'text/csv;charset=utf-8' }
    }
}

// Spotify sends playlist names and descriptions HTML-escaped, e.g. `AC&#x2F;DC` for `AC/DC`.
function decodePlaylistText(playlist: PlaylistWithItems): PlaylistWithItems {
    return {
        ...playlist,
        name: decodeHtmlEntities(playlist.name),
        description: decodeHtmlEntities(playlist.description),
    }
}

const namedEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00A0',
}

// Decodes numeric entities (`&#47;`, `&#x2F;`) and the common named ones. One pass over the text,
// so `&amp;#x2F;` becomes the literal text `&#x2F;`, as it should, and not `/`.
// Unknown entities stay as they are.
//
// Hand-written on purpose, instead of one of the two usual alternatives:
// - the browser's own HTML parser (`DOMParser`, or the "textarea trick"): it parses tags too, so a
//   playlist called `a <b> c` would lose its `<b>`, and it's harder to be sure nothing runs;
// - a library like `entities`: it knows all 2,000+ named entities, but Spotify seems to only send
//   numeric ones and `&amp;`, which this covers in 15 lines without a dependency.
// If a real export shows other named entities (`&eacute;`, `&hellip;`…), switch to `entities`:
// `decodeHTML(text)` is a drop-in replacement.
export function decodeHtmlEntities(text: string): string {
    return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (entity, code: string) => {
        if (code.startsWith('#')) {
            const isHex = code[1] === 'x' || code[1] === 'X'
            const codePoint = isHex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
            return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity
        }
        return namedEntities[code.toLowerCase()] ?? entity
    })
}

const csvHeaders = [
    'playlist id',
    'playlist name',
    'playlist owner name',
    'playlist owner type',
    'playlist is collaborative',
    'playlist href',
    'playlist description',
    'playlist tracks skipped because',
    'item type',
    'item id',
    'item name',
    'item artist name(s)',
    'item album name',
    'item show name',
    'item href',
    'item is local',
]

// One row per track or episode. Items that are no longer available on Spotify have no data left,
// so they get no row (the JSON file keeps them, as null). A playlist without any item row (empty,
// or its tracks were skipped) gets one row with empty item columns, so it isn't missing.
export function toCsv(playlists: PlaylistWithItems[]): string {
    const rows = [csvHeaders]
    for (const playlist of playlists) {
        const playlistColumns = [
            playlist.id,
            playlist.name,
            playlist.owner.display_name ?? '',
            playlist.owner.type,
            String(playlist.collaborative),
            playlist.href,
            playlist.description,
            playlist.items_skipped ?? '',
        ]
        const itemRows = playlist.items
            .map(toItemColumns)
            .filter((itemColumns) => itemColumns !== undefined)
            .map((itemColumns) => [...playlistColumns, ...itemColumns])
        // Every row has as many columns as the header (RFC 4180), so fill the item columns with ''.
        const emptyItemColumns = Array<string>(csvHeaders.length - playlistColumns.length).fill('')
        rows.push(...(itemRows.length > 0 ? itemRows : [[...playlistColumns, ...emptyItemColumns]]))
    }
    // CRLF line endings, as the CSV standard (RFC 4180) prescribes.
    return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
}

function toItemColumns({ item, is_local }: PlaylistItem): string[] | undefined {
    if (item === null) {
        return undefined
    }
    // `item.type` narrows the union: only tracks have artists and an album, only episodes a show.
    const isTrack = item.type === 'track'
    return [
        item.type,
        item.id ?? '',
        item.name,
        isTrack ? item.artists.map((artist) => artist.name).join(', ') : '',
        isTrack ? item.album.name : '',
        isTrack ? '' : item.show.name,
        item.href ?? '',
        String(is_local),
    ]
}

// RFC 4180: a value with a comma, double quote or line break goes between double quotes, and each
// double quote inside it is doubled. `say "hi", Bob` becomes `"say ""hi"", Bob"`.
export function escapeCsvValue(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replaceAll('"', '""')}"`
    }
    return value
}
