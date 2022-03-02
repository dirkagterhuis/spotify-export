import type { FileType } from '../types'

export function generateReturnFile(playlists, fileType: FileType): string {
    switch (fileType) {
        case 'json':
            return `data:text/json;charset=utf-8, ${encodeURIComponent(
                JSON.stringify(playlists, null, 2)
            )}`
        case 'csv':
            return `data:text/csv;charset=utf-8, ${encodeURIComponent(csvFromJSON(playlists))}`
        default:
            throw new Error(`Unexpected fileType: ${fileType}`)
    }
}

function csvFromJSON(playlists): string {
    const headers: string[] = [
        'playlist id',
        'playlist Name',
        'playlist owner name',
        'playlist owner type',
        'playlist is collaborative',
        'playlist href',
        'playlist description',
        'track id,track name',
        'track artist name(s)',
        'track album name',
        'track href',
    ]
    let ret: string = headers.join(',')

    for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i]
        const items = playlist.items

        // In dev, not all playlists have items because not all tracks are retrieved for all playlists
        if (!items) {
            continue
        }
        for (let j = 0; j < items.length; j++) {
            const track = items[j].track
            if (track === null) {
                continue
            }
            const artists = track.artists
            let artistNames: string = ''
            for (let k = 0; k < artists.length; k++) {
                artistNames += artists[k].name as string
                if (k !== artists.length - 1) {
                    artistNames += ', '
                }
            }
            const retNewLine: string[] = [
                playlist.id,
                playlist.name,
                playlist.owner.display_name,
                playlist.owner.type,
                String(playlist.collaborative),
                playlist.href,
                playlist.description,
                track.id,
                track.name,
                artistNames,
                track.album.name,
                track.href,
            ]

            handleCommas(retNewLine)
            ret += `\n${retNewLine.join(',')}`
        }
    }
    return ret
}

// Escape comma's in .csv by placing all elements in double quotes and escaping double quotes with an extra double quote
function handleCommas(input: string[]): void {
    for (let i = 0; i < input.length; i++) {
        input[i] = `"${input[i].replaceAll('"', "\"")}"`
    }
}