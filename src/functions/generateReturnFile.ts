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

        // in dev, not all playlists have items because not all tracks are retrieved for all playlists
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

            // Escape comma's in .csv
            for (let l = 0; l < retNewLine.length; l++) {
                // TODO: replaceAll not always supported. Read up on: https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
                // retNewLine[l].replaceAll(',', '","')
            }

            ret += `\n${retNewLine.join(',')}`
        }
    }
    return ret
}
