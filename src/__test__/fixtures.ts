import type { Client } from '../types'

export const mockTrack = {
    id: 'tr1',
    name: 'Song One',
    artists: [{ name: 'Artist A' }],
    album: { name: 'Album X' },
    href: 'https://example.com/tr1',
}

export const mockPlaylistItem = { track: mockTrack }

export const mockPlaylist = {
    id: 'pl1',
    name: 'My Playlist',
    owner: { display_name: 'Alice', type: 'user' },
    collaborative: false,
    href: 'https://api.spotify.com/v1/playlists/pl1',
    description: 'A playlist',
    items: [mockPlaylistItem],
}

export const mockClient: Client = {
    socketId: 'sock1',
    sessionId: 'sess1',
    state: 'abc123',
    fileType: 'json',
}
