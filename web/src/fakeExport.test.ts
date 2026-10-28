import { fakeExport } from './fakeExport'

describe('fakeExport', () => {
    it('reports the playlist count, then one line per playlist', async () => {
        const messages: string[] = []

        await fakeExport('token', 'json', (message) => messages.push(message), 0)

        expect(messages[0]).toBe('Retrieved 12 playlists from your Spotify Account')
        expect(messages).toHaveLength(13)
        expect(messages[1]).toBe('Getting tracks for playlist #001 out of 12: Liked Songs')
    })
})
