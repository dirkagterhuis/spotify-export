import { describe, it, expect } from 'vitest'
import { handleCommas, csvFromJSON, generateReturnFile } from './generateReturnFile'

describe('handleCommas', () => {
    it('wraps values containing commas in double quotes', () => {
        const input = ['hello, world', 'no comma']
        handleCommas(input)
        expect(input[0]).toBe('"hello, world"')
        expect(input[1]).toBe('no comma')
    })

    it('leaves values without commas unchanged', () => {
        const input = ['plain', 'also plain']
        handleCommas(input)
        expect(input).toEqual(['plain', 'also plain'])
    })

    it('escapes double quotes inside comma-containing values', () => {
        const input = ['say "hello", world']
        handleCommas(input)
        expect(input[0]).toBe('"say "hello", world"')
    })
})

describe('csvFromJSON', () => {
    it('returns header row when playlists have no items', () => {
        const result = csvFromJSON([{ id: '1', items: null }])
        const firstLine = result.split('\n')[0]
        expect(firstLine).toContain('playlist id')
        expect(firstLine).toContain('track name')
    })

    it('includes track data in output rows', () => {
        const playlists = [
            {
                id: 'pl1',
                name: 'My Playlist',
                owner: { display_name: 'Alice', type: 'user' },
                collaborative: false,
                href: 'https://example.com/pl1',
                description: 'A playlist',
                items: [
                    {
                        track: {
                            id: 'tr1',
                            name: 'Song One',
                            artists: [{ name: 'Artist A' }],
                            album: { name: 'Album X' },
                            href: 'https://example.com/tr1',
                        },
                    },
                ],
            },
        ]
        const result = csvFromJSON(playlists)
        expect(result).toContain('Song One')
        expect(result).toContain('Artist A')
        expect(result).toContain('Album X')
    })
})

describe('generateReturnFile', () => {
    it('returns a json data URI for fileType json', () => {
        const result = generateReturnFile([{ name: 'test' }], 'json')
        expect(result).toMatch(/^data:text\/json/)
    })

    it('returns a csv data URI for fileType csv', () => {
        const result = generateReturnFile([], 'csv')
        expect(result).toMatch(/^data:text\/csv/)
    })
})
