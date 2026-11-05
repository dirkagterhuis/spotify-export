import type { ExportFile } from './exportFile'
import { spotifyExport, type SpotifyExportOptions } from './spotifyExport'

const userId = 'alice'

function playlist(id: string, name: string, { owner = userId, collaborative = false } = {}) {
    return {
        id,
        name,
        owner: { id: owner, display_name: owner, type: 'user' },
        collaborative,
        href: `https://api.spotify.com/v1/playlists/${id}`,
        description: '',
    }
}

function track(name: string) {
    return {
        is_local: false,
        item: {
            type: 'track',
            id: name,
            name,
            album: { name: 'Album' },
            artists: [{ name: 'Artist' }],
            href: `https://api.spotify.com/v1/tracks/${name}`,
        },
    }
}

function page(items: unknown[], total = items.length) {
    return { items, total, next: null }
}

// A fake Spotify: answers by URL path, so the order of the requests doesn't matter.
// A number instead of a body answers with that error status.
function fakeSpotify(routes: Record<string, unknown>) {
    return vi.fn<typeof fetch>(async (input) => {
        const path = new URL(String(input)).pathname.replace('/v1', '')
        if (!(path in routes)) {
            throw new Error(`No fake response for ${path}`)
        }
        const body = routes[path]
        if (typeof body === 'number') {
            return new Response(JSON.stringify({ error: { status: body, message: 'x' } }), {
                status: body,
            })
        }
        return new Response(JSON.stringify(body), { status: 200 })
    })
}

// Runs an export and collects everything it reports and downloads.
async function runExport(routes: Record<string, unknown>, fileType: 'json' | 'csv' = 'json') {
    const messages: string[] = []
    const downloads: { file: ExportFile; fileName: string }[] = []
    const options: SpotifyExportOptions = {
        fetchFn: fakeSpotify(routes),
        download: (file, fileName) => downloads.push({ file, fileName }),
    }
    await spotifyExport('token-xyz', fileType, (message) => messages.push(message), options)
    return { messages, downloads }
}

// A user with two playlists of their own.
const twoPlaylists = {
    '/me': { id: userId },
    '/me/playlists': page([playlist('pl1', 'Road trip'), playlist('pl2', 'AC&#x2F;DC')]),
    '/playlists/pl1/items': page([track('One'), track('Two')]),
    '/playlists/pl2/items': page([track('Three')]),
}

describe('spotifyExport', () => {
    beforeEach(() => {
        // Don't let a limit in your own web/.env.local change the tests.
        vi.stubEnv('VITE_EXPORT_PLAYLIST_LIMIT', '')
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('reports progress like the Express app did and downloads one file', async () => {
        const { messages, downloads } = await runExport(twoPlaylists)

        expect(messages).toEqual([
            'Retrieved 2 playlists from your Spotify Account',
            'Getting tracks for playlist #001 out of 2: Road trip',
            'Getting tracks for playlist #002 out of 2: AC/DC',
            expect.stringMatching(/^Exported 2 playlists with 3 tracks and episodes to "spotify/),
        ])
        expect(downloads).toHaveLength(1)
        expect(downloads[0].fileName).toMatch(/^spotify playlists export .+\.json$/)
        const exported = JSON.parse(downloads[0].file.content)
        expect(exported.map((p: { name: string }) => p.name)).toEqual(['Road trip', 'AC/DC'])
        expect(exported[0].items).toHaveLength(2)
    })

    it('downloads the chosen file type', async () => {
        const { downloads } = await runExport(twoPlaylists, 'csv')

        expect(downloads[0].file.mimeType).toBe('text/csv;charset=utf-8')
        expect(downloads[0].fileName).toMatch(/\.csv$/)
    })

    it('lists followed playlists without their items, without asking Spotify for them', async () => {
        const { messages, downloads } = await runExport({
            '/me': { id: userId },
            '/me/playlists': page([
                playlist('pl1', 'Followed', { owner: 'bob' }),
                playlist('pl2', 'Mine'),
            ]),
            '/playlists/pl2/items': page([track('One')]),
            // No route for pl1: asking for it would throw.
        })

        expect(messages[1]).toMatch(/^Skipping the tracks of 1 playlist you follow but didn't make/)
        expect(messages[2]).toBe('Getting tracks for playlist #001 out of 1: Mine')
        expect(messages[3]).toMatch(
            /^Exported 1 playlist with 1 track or episode, plus the names of 1 playlist without their tracks, to /
        )
        // In the order of the library, the followed one included.
        const [followed, mine] = JSON.parse(downloads[0].file.content)
        expect(followed).toMatchObject({ name: 'Followed', items: [] })
        expect(followed.items_skipped).toMatch(/^You follow this playlist/)
        expect(mine).toMatchObject({ name: 'Mine', items: [expect.anything()] })
        expect(mine).not.toHaveProperty('items_skipped')
    })

    it('tries a collaborative playlist of someone else and lists it without items on a 403', async () => {
        const { messages, downloads } = await runExport({
            '/me': { id: userId },
            '/me/playlists': page([
                playlist('pl1', 'Shared', { owner: 'bob', collaborative: true }),
                playlist('pl2', 'Also shared', { owner: 'carol', collaborative: true }),
            ]),
            '/playlists/pl1/items': 403,
            '/playlists/pl2/items': page([track('One')]),
        })

        expect(messages).toContainEqual(expect.stringMatching(/^Skipped the tracks of "Shared"/))
        const [shared, alsoShared] = JSON.parse(downloads[0].file.content)
        expect(shared).toMatchObject({ name: 'Shared', items: [] })
        expect(shared.items_skipped).toMatch(
            /not one of this collaborative playlist's collaborators/
        )
        expect(alsoShared.items).toHaveLength(1)
    })

    it('fails on a 403 for a playlist of your own', async () => {
        const routes = { ...twoPlaylists, '/playlists/pl1/items': 403 }

        await expect(runExport(routes)).rejects.toThrow(/Development Mode/)
    })

    it('fails with a status of 401 when the login expired, so the page can log in again', async () => {
        const routes = { ...twoPlaylists, '/playlists/pl2/items': 401 }

        await expect(runExport(routes)).rejects.toMatchObject({ status: 401 })
    })

    it('warns and carries on when a list changed during the export', async () => {
        const { messages, downloads } = await runExport({
            ...twoPlaylists,
            '/playlists/pl1/items': page([track('One'), track('Two')], 3),
        })

        expect(messages).toContain(
            'Warning: "Road trip" changed during the export. Spotify counted 3 items, the export has 2.'
        )
        expect(downloads).toHaveLength(1)
    })

    it('exports only the first playlists when VITE_EXPORT_PLAYLIST_LIMIT is set, and says so', async () => {
        vi.stubEnv('VITE_EXPORT_PLAYLIST_LIMIT', '1')

        const { messages, downloads } = await runExport(twoPlaylists)

        expect(messages[1]).toBe(
            'VITE_EXPORT_PLAYLIST_LIMIT is set, so this exports only the first 1 playlist of 2.'
        )
        expect(messages[2]).toBe('Getting tracks for playlist #001 out of 1: Road trip')
        expect(JSON.parse(downloads[0].file.content)).toHaveLength(1)
    })

    it.each(['0', '-3', '2.5', 'ten'])(
        'rejects a limit of "%s" before calling Spotify',
        async (limit) => {
            vi.stubEnv('VITE_EXPORT_PLAYLIST_LIMIT', limit)
            const fetchFn = fakeSpotify(twoPlaylists)

            await expect(spotifyExport('token', 'json', () => {}, { fetchFn })).rejects.toThrow(
                /VITE_EXPORT_PLAYLIST_LIMIT must be a whole number/
            )
            expect(fetchFn).not.toHaveBeenCalled()
        }
    )

    it('works a second time after a finished export', async () => {
        const first = await runExport(twoPlaylists)
        const second = await runExport(twoPlaylists)

        // All but the last message, which has the time in the file name.
        expect(second.messages.slice(0, -1)).toEqual(first.messages.slice(0, -1))
        expect(second.downloads[0].file).toEqual(first.downloads[0].file)
    })
})
