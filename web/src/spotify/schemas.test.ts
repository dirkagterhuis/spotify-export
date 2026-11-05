import { PlaylistItemPageSchema, PlaylistPageSchema } from './schemas'

const track = {
    type: 'track',
    id: 'tr1',
    name: 'Song One',
    album: { name: 'Album X' },
    artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
    href: 'https://api.spotify.com/v1/tracks/tr1',
}

const playlist = {
    id: 'pl1',
    name: 'My Playlist',
    owner: { id: 'alice', display_name: 'Alice', type: 'user' },
    collaborative: false,
    href: 'https://api.spotify.com/v1/playlists/pl1',
    description: 'A playlist',
}

function itemPage(...items: unknown[]) {
    return { items, total: items.length, next: null }
}

describe('PlaylistPageSchema', () => {
    it('parses a page of playlists and drops the fields the export does not use', () => {
        const page = PlaylistPageSchema.parse({
            items: [
                {
                    ...playlist,
                    images: [],
                    items: { href: 'https://api.spotify.com/v1/playlists/pl1/items', total: 3 },
                },
            ],
            total: 51,
            next: 'https://api.spotify.com/v1/me/playlists?offset=50&limit=50',
            limit: 50,
        })

        expect(page).toEqual({
            items: [playlist],
            total: 51,
            next: 'https://api.spotify.com/v1/me/playlists?offset=50&limit=50',
        })
    })

    it.each([null, undefined, ''])('turns a %s description into an empty string', (description) => {
        const page = PlaylistPageSchema.parse({
            items: [{ ...playlist, description }],
            total: 1,
            next: null,
        })

        expect(page.items[0].description).toBe('')
    })

    it('accepts an owner without a display name', () => {
        const owner = { id: 'bob', display_name: null, type: 'user' }
        const page = PlaylistPageSchema.parse({
            items: [{ ...playlist, owner }],
            total: 1,
            next: null,
        })

        expect(page.items[0].owner).toEqual(owner)
    })
})

describe('PlaylistItemPageSchema', () => {
    it('parses a track and ignores the deprecated `track` copy of it', () => {
        const page = PlaylistItemPageSchema.parse(
            itemPage({ is_local: false, item: track, track, added_at: '2026-01-01T00:00:00Z' })
        )

        expect(page.items).toEqual([{ is_local: false, item: track }])
    })

    it('accepts a local file, which has no Spotify id or link', () => {
        const localTrack = { ...track, id: null, href: null, album: { name: '' } }
        const page = PlaylistItemPageSchema.parse(itemPage({ is_local: true, item: localTrack }))

        expect(page.items[0].item).toEqual(localTrack)
    })

    it('accepts a podcast episode', () => {
        const episode = {
            type: 'episode',
            id: 'ep1',
            name: 'Episode One',
            show: { name: 'The Show' },
            href: 'https://api.spotify.com/v1/episodes/ep1',
        }
        const page = PlaylistItemPageSchema.parse(itemPage({ is_local: false, item: episode }))

        expect(page.items[0].item).toEqual(episode)
    })

    it('accepts an episode in the track-like shape, with the show under album', () => {
        const trackLikeEpisode = {
            type: 'episode',
            id: 'ep1',
            name: 'Episode One',
            album: { name: 'The Show' },
            artists: [{ name: 'The Publisher' }],
            href: 'https://api.spotify.com/v1/episodes/ep1',
        }
        const page = PlaylistItemPageSchema.parse(
            itemPage({ is_local: false, item: trackLikeEpisode })
        )

        expect(page.items[0].item).toEqual({
            type: 'episode',
            id: 'ep1',
            name: 'Episode One',
            show: { name: 'The Show' },
            href: 'https://api.spotify.com/v1/episodes/ep1',
        })
    })

    it('accepts an item that is no longer available', () => {
        const page = PlaylistItemPageSchema.parse(itemPage({ is_local: false, item: null }))

        expect(page.items[0].item).toBeNull()
    })

    it('rejects an item of an unknown type', () => {
        const result = PlaylistItemPageSchema.safeParse(
            itemPage({ is_local: false, item: { ...track, type: 'audiobook' } })
        )

        expect(result.success).toBe(false)
    })
})
