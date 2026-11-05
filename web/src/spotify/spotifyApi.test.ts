import { z } from 'zod'
import {
    getCurrentUserId,
    getPlaylistItems,
    getPlaylists,
    spotifyGet,
    SpotifyApiError,
} from './spotifyApi'

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    })
}

// A fake fetch that answers each request with the next response from the list.
function fakeFetch(...responses: Response[]) {
    const fetchFn = vi.fn<typeof fetch>()
    for (const response of responses) {
        fetchFn.mockResolvedValueOnce(response)
    }
    return fetchFn
}

const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined)
const NameSchema = z.object({ name: z.string() })
const url = 'https://api.spotify.com/v1/test'

const playlist = {
    id: 'pl1',
    name: 'My Playlist',
    owner: { id: 'alice', display_name: 'Alice', type: 'user' },
    collaborative: false,
    href: 'https://api.spotify.com/v1/playlists/pl1',
    description: 'A playlist',
}

function playlistItem(name: string) {
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

afterEach(() => {
    sleep.mockClear()
})

describe('spotifyGet', () => {
    it('sends the access token and returns the parsed body', async () => {
        const fetchFn = fakeFetch(jsonResponse({ name: 'Alice', extra: true }))

        const data = await spotifyGet(url, 'token-xyz', NameSchema, { fetchFn })

        expect(data).toEqual({ name: 'Alice' })
        expect(fetchFn).toHaveBeenCalledWith(url, {
            headers: { Authorization: 'Bearer token-xyz' },
        })
    })

    it.each([
        [401, /login has expired/],
        [403, /Development Mode/],
    ])('turns a %i into a readable error that keeps the status', async (status, message) => {
        const fetchFn = fakeFetch(jsonResponse({ error: { status, message: 'x' } }, status))

        const error = await spotifyGet(url, 'token', NameSchema, { fetchFn }).catch((e) => e)

        expect(error).toBeInstanceOf(SpotifyApiError)
        expect(error.status).toBe(status)
        expect(error.message).toMatch(message)
    })

    it("passes on Spotify's own message for other errors", async () => {
        const fetchFn = fakeFetch(
            jsonResponse({ error: { status: 500, message: 'Server error' } }, 500)
        )

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn })).rejects.toThrow(
            'Spotify API error: Server error'
        )
    })

    it('falls back to the status code when the error has no body', async () => {
        const fetchFn = fakeFetch(new Response(null, { status: 502 }))

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn })).rejects.toThrow(
            'Spotify API error: HTTP 502'
        )
    })

    it('waits as long as Retry-After says after a 429, then tries again', async () => {
        const fetchFn = fakeFetch(
            jsonResponse({}, 429, { 'Retry-After': '2' }),
            jsonResponse({ name: 'Alice' })
        )

        const data = await spotifyGet(url, 'token', NameSchema, { fetchFn, sleep })

        expect(data).toEqual({ name: 'Alice' })
        expect(sleep).toHaveBeenCalledWith(2000)
        expect(fetchFn).toHaveBeenCalledTimes(2)
    })

    it('gives up after three retries', async () => {
        const tooMany = () => jsonResponse({}, 429, { 'Retry-After': '1' })
        const fetchFn = fakeFetch(tooMany(), tooMany(), tooMany(), tooMany())

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn, sleep })).rejects.toThrow(
            /too many requests/
        )
        expect(fetchFn).toHaveBeenCalledTimes(4)
    })

    it("doesn't wait when Spotify asks to wait longer than a minute", async () => {
        const fetchFn = fakeFetch(jsonResponse({}, 429, { 'Retry-After': '3600' }))

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn, sleep })).rejects.toThrow(
            /too many requests/
        )
        expect(sleep).not.toHaveBeenCalled()
    })

    it("explains that Spotify can't be reached when fetch itself fails", async () => {
        const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'))

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn })).rejects.toThrow(
            "Couldn't reach Spotify"
        )
    })

    it('rejects a response that does not match the schema', async () => {
        const fetchFn = fakeFetch(jsonResponse({ name: 42 }))

        await expect(spotifyGet(url, 'token', NameSchema, { fetchFn })).rejects.toThrow(
            "Spotify sent data the export doesn't understand (name: Invalid input: expected string, received number)"
        )
    })
})

describe('getCurrentUserId', () => {
    it('returns the id of the logged-in user', async () => {
        const fetchFn = fakeFetch(jsonResponse({ id: 'alice', display_name: 'Alice' }))

        expect(await getCurrentUserId('token', { fetchFn })).toBe('alice')
        expect(fetchFn.mock.calls[0][0]).toBe('https://api.spotify.com/v1/me')
    })
})

describe('getPlaylists', () => {
    it('follows `next` until the last page', async () => {
        const second = { ...playlist, id: 'pl2' }
        const nextUrl = 'https://api.spotify.com/v1/me/playlists?offset=50&limit=50'
        const fetchFn = fakeFetch(
            jsonResponse({ items: [playlist], total: 2, next: nextUrl }),
            jsonResponse({ items: [second], total: 2, next: null })
        )

        const playlists = await getPlaylists('token', { fetchFn })

        expect(playlists.items.map((p) => p.id)).toEqual(['pl1', 'pl2'])
        expect(playlists.total).toBe(2)
        expect(fetchFn.mock.calls.map(([calledUrl]) => calledUrl)).toEqual([
            'https://api.spotify.com/v1/me/playlists?limit=50',
            nextUrl,
        ])
    })
})

describe('getPlaylistItems', () => {
    it('asks for tracks and episodes, only the fields the export uses, 50 at a time', async () => {
        const fetchFn = fakeFetch(jsonResponse({ items: [], total: 0, next: null }))

        await getPlaylistItems('token', 'pl1', { fetchFn })

        const calledUrl = new URL(fetchFn.mock.calls[0][0] as string)
        expect(calledUrl.pathname).toBe('/v1/playlists/pl1/items')
        expect(Object.fromEntries(calledUrl.searchParams)).toEqual({
            limit: '50',
            additional_types: 'track,episode',
            fields: 'next,total,items(is_local,item(type,id,name,href,album(name),artists(name),show(name)))',
        })
    })

    it('returns the items of all pages', async () => {
        const fetchFn = fakeFetch(
            jsonResponse({ items: [playlistItem('a')], total: 2, next: `${url}?offset=50` }),
            jsonResponse({ items: [playlistItem('b')], total: 2, next: null })
        )

        const items = await getPlaylistItems('token', 'pl1', { fetchFn })

        expect(items.items.map((entry) => entry.item?.name)).toEqual(['a', 'b'])
    })

    it("keeps asking for episodes on later pages, also when Spotify's next link drops them", async () => {
        const nextUrl =
            'https://api.spotify.com/v1/playlists/pl1/items?offset=50&limit=50&additional_types=track&fields=x&locale=en'
        const fetchFn = fakeFetch(
            jsonResponse({ items: [playlistItem('a')], total: 2, next: nextUrl }),
            jsonResponse({ items: [playlistItem('b')], total: 2, next: null })
        )

        await getPlaylistItems('token', 'pl1', { fetchFn })

        const secondUrl = new URL(fetchFn.mock.calls[1][0] as string)
        expect(secondUrl.searchParams.get('offset')).toBe('50')
        expect(secondUrl.searchParams.get('additional_types')).toBe('track,episode')
        expect(secondUrl.searchParams.get('fields')).toMatch(/^next,total,items/)
        // Parameters only Spotify added stay as they are.
        expect(secondUrl.searchParams.get('locale')).toBe('en')
    })

    it("returns Spotify's latest total, also when it no longer matches the items", async () => {
        // A track was added between the two pages: page 1 said 2, page 2 says 3.
        const fetchFn = fakeFetch(
            jsonResponse({ items: [playlistItem('a')], total: 2, next: `${url}?offset=50` }),
            jsonResponse({ items: [playlistItem('b')], total: 3, next: null })
        )

        const items = await getPlaylistItems('token', 'pl1', { fetchFn })

        expect(items.items).toHaveLength(2)
        expect(items.total).toBe(3)
    })
})
