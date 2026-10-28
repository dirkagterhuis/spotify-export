import type { FileType } from './fileType'

export type ExportPlaylists = (
    accessToken: string,
    fileType: FileType,
    onProgress: (message: string) => void
) => Promise<void>

const fakePlaylists = [
    'Liked Songs',
    'Road trip 2019',
    'Sunday morning',
    'Running',
    'Dinner with friends',
    'Focus',
    'Summer 2023',
    'Throwbacks',
    'Rainy day',
    'Workout',
    'Wedding',
    'Discover Weekly finds',
]

// Stand-in for the real export until PKCE (step 7) and client-side fetching (step 8) land.
// It reports progress with the same messages the Express app sends over Socket.io, so the real
// export can take its place behind the same `onProgress` callback.
export async function fakeExport(
    _accessToken: string,
    _fileType: FileType,
    onProgress: (message: string) => void,
    stepMs = 250
): Promise<void> {
    await wait(stepMs)
    onProgress(`Retrieved ${fakePlaylists.length} playlists from your Spotify Account`)
    for (const [index, name] of fakePlaylists.entries()) {
        await wait(stepMs)
        const number = (index + 1).toString().padStart(3, '0')
        onProgress(`Getting tracks for playlist #${number} out of ${fakePlaylists.length}: ${name}`)
    }
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
