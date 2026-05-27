import axios from 'axios'

vi.mock('axios')

import { getPlaylists, getItemsByPlaylists } from './spotifyApiUtils'
import { mockPlaylist, mockPlaylistItem } from '../__test__/fixtures'

const token = 'test-token'
const playlistsUrl = 'https://api.spotify.com/v1/me/playlists'

describe('getPlaylists', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns playlists for a single page', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({
            status: 200,
            data: { items: [mockPlaylist], total: 1, next: null },
        })
        const result = await getPlaylists(token, playlistsUrl, [])
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe('pl1')
    })

    it('fetches all pages recursively', async () => {
        const page2 = { ...mockPlaylist, id: 'pl2' }
        vi.mocked(axios.get)
            .mockResolvedValueOnce({
                status: 200,
                data: { items: [mockPlaylist], total: 2, next: `${playlistsUrl}?offset=1` },
            })
            .mockResolvedValueOnce({
                status: 200,
                data: { items: [page2], total: 2, next: null },
            })
        const result = await getPlaylists(token, playlistsUrl, [])
        expect(result).toHaveLength(2)
        expect(result[1].id).toBe('pl2')
    })

    it('throws when retrieved count does not match total', async () => {
        vi.mocked(axios.get).mockResolvedValueOnce({
            status: 200,
            data: { items: [mockPlaylist], total: 5, next: null },
        })
        await expect(getPlaylists(token, playlistsUrl, [])).rejects.toThrow()
    })

    it('throws on network error', async () => {
        vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'))
        await expect(getPlaylists(token, playlistsUrl, [])).rejects.toThrow()
    })
})

describe('getItemsByPlaylists', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        process.env.PORT = '8000'
    })

    afterEach(() => {
        delete process.env.PORT
    })

    it('attaches fetched tracks to each playlist', async () => {
        vi.mocked(axios.get).mockResolvedValue({
            status: 200,
            data: { items: [mockPlaylistItem], total: 1, next: null },
        })
        const playlists = [{ ...mockPlaylist }]
        await getItemsByPlaylists(token, playlists, vi.fn(), 'sock1')
        expect(playlists[0].items).toHaveLength(1)
        expect(playlists[0].items[0].track.name).toBe('Song One')
    })

    it('sends a progress message per playlist', async () => {
        vi.mocked(axios.get).mockResolvedValue({
            status: 200,
            data: { items: [], total: 0, next: null },
        })
        const playlists = [
            { ...mockPlaylist },
            { ...mockPlaylist, id: 'pl2', name: 'Playlist 2' },
        ]
        const sendMessage = vi.fn()
        await getItemsByPlaylists(token, playlists, sendMessage, 'sock1')
        expect(sendMessage).toHaveBeenCalledTimes(2)
    })

    it('fetches at most 10 playlists in dev mode (no PORT)', async () => {
        delete process.env.PORT
        vi.mocked(axios.get).mockResolvedValue({
            status: 200,
            data: { items: [], total: 0, next: null },
        })
        const playlists = Array.from({ length: 15 }, (_, i) => ({
            ...mockPlaylist,
            id: `pl${i}`,
            name: `Playlist ${i}`,
        }))
        await getItemsByPlaylists(token, playlists, vi.fn(), 'sock1')
        expect(axios.get).toHaveBeenCalledTimes(10)
    })

    it('fetches all playlists in production (PORT is set)', async () => {
        vi.mocked(axios.get).mockResolvedValue({
            status: 200,
            data: { items: [], total: 0, next: null },
        })
        const playlists = Array.from({ length: 15 }, (_, i) => ({
            ...mockPlaylist,
            id: `pl${i}`,
            name: `Playlist ${i}`,
        }))
        await getItemsByPlaylists(token, playlists, vi.fn(), 'sock1')
        expect(axios.get).toHaveBeenCalledTimes(15)
    })
})
