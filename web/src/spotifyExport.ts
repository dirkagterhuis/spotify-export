// The real export: reads the user's playlists from Spotify, turns them into a file and downloads it.
// Replaces the /spotify-app-callback handler of the Express app (src/index.ts), and sends the same
// progress messages.
import { downloadFile, exportFileName } from './downloadFile'
import { createExportFile, decodeHtmlEntities, type ExportFile } from './exportFile'
import type { FileType } from './fileType'
import type { Playlist, PlaylistWithItems } from './spotify/schemas'
import {
    getCurrentUserId,
    getPlaylistItems,
    getPlaylists,
    SpotifyApiError,
    type SpotifyApiOptions,
} from './spotify/spotifyApi'

export type ExportPlaylists = (
    accessToken: string,
    fileType: FileType,
    onProgress: (message: string) => void
) => Promise<void>

export type SpotifyExportOptions = SpotifyApiOptions & {
    // Injectable so tests can check the file without a real download.
    download?: (file: ExportFile, fileName: string) => void
}

export async function spotifyExport(
    accessToken: string,
    fileType: FileType,
    onProgress: (message: string) => void,
    { download = downloadFile, ...apiOptions }: SpotifyExportOptions = {}
): Promise<void> {
    // Read before any request, so a typo in web/.env.local fails right away.
    const playlistLimit = readPlaylistLimit()

    const userId = await getCurrentUserId(accessToken, apiOptions)
    const playlists = await getPlaylists(accessToken, apiOptions)
    onProgress(`Retrieved ${playlists.items.length} playlists from your Spotify Account`)
    warnIfCountChanged(
        'your list of playlists',
        playlists.total,
        playlists.items.length,
        onProgress
    )

    // Development Mode apps may only read the items of playlists the user owns or collaborates on,
    // and give a 403 for the rest. Don't ask for the ones that will fail for sure.
    const isReadable = (playlist: Playlist) =>
        playlist.owner.id === userId || playlist.collaborative
    const readable = playlists.items.filter(isReadable)
    const followedCount = playlists.items.length - readable.length
    if (followedCount > 0) {
        onProgress(
            `Skipping the tracks of ${plural(followedCount, 'playlist')} you follow but didn't make: Spotify only lets this app read the tracks of playlists you own or collaborate on. The file still lists their names.`
        )
    }

    const toRead = new Set(readable.slice(0, playlistLimit))
    if (playlistLimit !== undefined) {
        onProgress(
            `VITE_EXPORT_PLAYLIST_LIMIT is set, so this exports only the first ${plural(toRead.size, 'playlist')} of ${readable.length}.`
        )
    }

    // One pass over all playlists, so the file keeps the order of your Spotify library.
    const exported: PlaylistWithItems[] = []
    let number = 0
    for (const playlist of playlists.items) {
        if (!isReadable(playlist)) {
            exported.push(withoutItems(playlist, followedReason))
            continue
        }
        if (!toRead.has(playlist)) {
            // Past VITE_EXPORT_PLAYLIST_LIMIT.
            continue
        }

        const name = decodeHtmlEntities(playlist.name)
        number++
        onProgress(
            `Getting tracks for playlist #${number.toString().padStart(3, '0')} out of ${toRead.size}: ${name}`
        )

        const items = await getItemsUnlessForbidden(accessToken, playlist, userId, apiOptions)
        if (items === undefined) {
            onProgress(
                `Skipped the tracks of "${name}": Spotify doesn't let this app read them. It's a collaborative playlist, but you're probably not one of its collaborators.`
            )
            exported.push(withoutItems(playlist, notACollaboratorReason))
            continue
        }
        warnIfCountChanged(`"${name}"`, items.total, items.items.length, onProgress)
        exported.push({ ...playlist, items: items.items })
    }

    const file = createExportFile(exported, fileType)
    const fileName = exportFileName(fileType)
    download(file, fileName)
    onProgress(exportSummary(exported, fileName))
}

const followedReason =
    "You follow this playlist but didn't make it. Spotify only lets this app read the tracks of playlists you own or collaborate on."
const notACollaboratorReason =
    "Spotify refused to share the tracks. You're probably not one of this collaborative playlist's collaborators."

function withoutItems(playlist: Playlist, reason: string): PlaylistWithItems {
    return { ...playlist, items: [], items_skipped: reason }
}

// `Exported 12 playlists with 340 tracks and episodes, plus the names of 3 playlists without
// their tracks, to "spotify playlists export ….json".`
function exportSummary(exported: PlaylistWithItems[], fileName: string): string {
    const withItems = exported.filter((playlist) => playlist.items_skipped === undefined)
    const skippedCount = exported.length - withItems.length
    const itemCount = withItems.reduce((sum, playlist) => sum + playlist.items.length, 0)
    const skipped =
        skippedCount > 0
            ? `, plus the names of ${plural(skippedCount, 'playlist')} without their tracks,`
            : ''
    return `Exported ${plural(withItems.length, 'playlist')} with ${plural(itemCount, 'track or episode', 'tracks and episodes')}${skipped} to "${fileName}".`
}

// A collaborative playlist someone else made: Spotify doesn't say whether this user is one of its
// collaborators, so try it, and treat a 403 as "not yours to read" instead of failing the export.
async function getItemsUnlessForbidden(
    accessToken: string,
    playlist: Playlist,
    userId: string,
    apiOptions: SpotifyApiOptions
) {
    try {
        return await getPlaylistItems(accessToken, playlist.id, apiOptions)
    } catch (error) {
        const mightNotBeACollaborator = playlist.owner.id !== userId
        if (mightNotBeACollaborator && error instanceof SpotifyApiError && error.status === 403) {
            return undefined
        }
        throw error
    }
}

// Spotify's `total` and the number of items it sent differ when the list changed during the
// export, e.g. a track added on your phone meanwhile. The file is still fine, just not complete.
function warnIfCountChanged(
    what: string,
    total: number,
    received: number,
    onProgress: (message: string) => void
) {
    if (total !== received) {
        onProgress(
            `Warning: ${what} changed during the export. Spotify counted ${total} items, the export has ${received}.`
        )
    }
}

// For local test runs: export only the first N playlists, set in web/.env.local. Unset (or empty)
// means all playlists. Read on every export instead of once, so tests can change it.
export function readPlaylistLimit(): number | undefined {
    const value = import.meta.env.VITE_EXPORT_PLAYLIST_LIMIT
    if (value === undefined || value === '') {
        return undefined
    }
    const limit = Number(value)
    if (!Number.isInteger(limit) || limit < 1) {
        throw new Error(
            `VITE_EXPORT_PLAYLIST_LIMIT must be a whole number of 1 or more, not "${value}". Fix it in web/.env.local, or remove it to export all playlists.`
        )
    }
    return limit
}

function plural(count: number, one: string, many = `${one}s`): string {
    return `${count} ${count === 1 ? one : many}`
}
