import { createExportFile, decodeHtmlEntities, escapeCsvValue, toCsv } from './exportFile'
import type { PlaylistItem, PlaylistWithItems } from './spotify/schemas'

const trackItem: PlaylistItem = {
    is_local: false,
    item: {
        type: 'track',
        id: 'tr1',
        name: 'Song One',
        album: { name: 'Album X' },
        artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
        href: 'https://api.spotify.com/v1/tracks/tr1',
    },
}

const playlist: PlaylistWithItems = {
    id: 'pl1',
    name: 'My Playlist',
    owner: { id: 'alice', display_name: 'Alice', type: 'user' },
    collaborative: false,
    href: 'https://api.spotify.com/v1/playlists/pl1',
    description: 'A playlist',
    items: [trackItem],
}

// Splits the CSV back into rows of values. Good enough for these tests, which have no quoted values.
function csvRows(csv: string): string[][] {
    return csv.split('\r\n').map((row) => row.split(','))
}

describe('decodeHtmlEntities', () => {
    it.each([
        ['AC&#x2F;DC', 'AC/DC'],
        ['AC&#47;DC', 'AC/DC'],
        ['Rock &amp; Roll', 'Rock & Roll'],
        ['&lt;3 &quot;you&quot; &#39;n me', '<3 "you" \'n me'],
        ['Party &#x1F389;', 'Party 🎉'],
    ])('decodes %s', (input, expected) => {
        expect(decodeHtmlEntities(input)).toBe(expected)
    })

    it('decodes only once', () => {
        expect(decodeHtmlEntities('&amp;#x2F;')).toBe('&#x2F;')
    })

    it('leaves unknown entities and plain ampersands alone', () => {
        expect(decodeHtmlEntities('&bogus; & Co')).toBe('&bogus; & Co')
    })
})

describe('escapeCsvValue', () => {
    it('leaves a plain value alone', () => {
        expect(escapeCsvValue('plain')).toBe('plain')
    })

    it.each([
        ['hello, world', '"hello, world"'],
        ['say "hi", Bob', '"say ""hi"", Bob"'],
        ['12" vinyl', '"12"" vinyl"'],
        ['line one\nline two', '"line one\nline two"'],
    ])('quotes %j', (input, expected) => {
        expect(escapeCsvValue(input)).toBe(expected)
    })
})

describe('toCsv', () => {
    it('writes a header and one row per track', () => {
        const csv = toCsv([playlist])

        expect(csv.split('\r\n')).toEqual([
            'playlist id,playlist name,playlist owner name,playlist owner type,playlist is collaborative,playlist href,playlist description,playlist tracks skipped because,item type,item id,item name,item artist name(s),item album name,item show name,item href,item is local',
            'pl1,My Playlist,Alice,user,false,https://api.spotify.com/v1/playlists/pl1,A playlist,,track,tr1,Song One,"Artist A, Artist B",Album X,,https://api.spotify.com/v1/tracks/tr1,false',
        ])
    })

    it('writes the show for an episode, and no artists or album', () => {
        const episode: PlaylistItem = {
            is_local: false,
            item: {
                type: 'episode',
                id: 'ep1',
                name: 'Episode One',
                show: { name: 'The Show' },
                href: 'https://api.spotify.com/v1/episodes/ep1',
            },
        }

        const csv = toCsv([{ ...playlist, items: [episode] }])

        expect(csv).toContain(
            'episode,ep1,Episode One,,,The Show,https://api.spotify.com/v1/episodes/ep1,false'
        )
    })

    it('writes empty columns for what a local file lacks', () => {
        const localFile: PlaylistItem = {
            is_local: true,
            item: {
                type: 'track',
                id: null,
                name: 'My Recording',
                album: { name: '' },
                artists: [{ name: 'Me' }],
                href: null,
            },
        }

        const csv = toCsv([{ ...playlist, items: [localFile] }])

        expect(csv).toContain('track,,My Recording,Me,,,,true')
    })

    it('skips items that are no longer available', () => {
        const csv = toCsv([
            { ...playlist, items: [trackItem, { is_local: false, item: null }, trackItem] },
        ])

        expect(csvRows(csv)).toHaveLength(3)
    })

    it('writes one row with empty item columns for a playlist without items', () => {
        const [header, row] = csvRows(toCsv([{ ...playlist, items: [] }]))

        expect(row).toHaveLength(header.length)
        expect(row.slice(0, 8)).toEqual([
            'pl1',
            'My Playlist',
            'Alice',
            'user',
            'false',
            playlist.href,
            'A playlist',
            '',
        ])
        expect(row.slice(8).every((value) => value === '')).toBe(true)
    })

    it('says why the tracks of a playlist were skipped', () => {
        const skipped = { ...playlist, items: [], items_skipped: 'Not yours' }

        const [, row] = csvRows(toCsv([skipped]))

        expect(row[7]).toBe('Not yours')
    })

    it('writes an empty owner name when Spotify has none', () => {
        const owner = { id: 'bob', display_name: null, type: 'user' }

        const [, row] = csvRows(toCsv([{ ...playlist, owner }]))

        expect(row[2]).toBe('')
    })
})

describe('createExportFile', () => {
    const escaped = { ...playlist, name: 'AC&#x2F;DC', description: 'Rock &amp; Roll' }

    it('creates pretty-printed JSON with decoded names and descriptions', () => {
        const file = createExportFile([escaped], 'json')

        expect(file.mimeType).toBe('application/json;charset=utf-8')
        expect(JSON.parse(file.content)).toEqual([
            { ...playlist, name: 'AC/DC', description: 'Rock & Roll' },
        ])
    })

    it('creates CSV that starts with a BOM, with decoded names and descriptions', () => {
        const file = createExportFile([escaped], 'csv')

        expect(file.mimeType).toBe('text/csv;charset=utf-8')
        expect(file.content.startsWith('\uFEFFplaylist id,')).toBe(true)
        expect(file.content).toContain('pl1,AC/DC,Alice')
        expect(file.content).toContain('Rock & Roll')
    })

    it('does not change the playlists it was given', () => {
        createExportFile([escaped], 'json')

        expect(escaped.name).toBe('AC&#x2F;DC')
    })
})
