import { handleCommas, csvFromJSON, generateReturnFile } from './generateReturnFile'
import type { FileType } from '../types'
import { mockPlaylist } from '../__test__/fixtures'

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

    it('wraps values that contain both commas and double quotes', () => {
        const input = ['say "hello", world']
        handleCommas(input)
        // Double quotes inside are not escaped — known limitation in the current implementation
        expect(input[0]).toBe('"say "hello", world"')
    })
})

describe('csvFromJSON', () => {
    it('returns only the header row when playlist has no items', () => {
        const result = csvFromJSON([{ ...mockPlaylist, items: null }])
        const lines = result.split('\n')
        expect(lines).toHaveLength(1)
        expect(lines[0]).toContain('playlist id')
        expect(lines[0]).toContain('track name')
    })

    it('includes track data in output rows', () => {
        const result = csvFromJSON([mockPlaylist])
        expect(result).toContain('Song One')
        expect(result).toContain('Artist A')
        expect(result).toContain('Album X')
    })

    it('skips null tracks', () => {
        const result = csvFromJSON([{ ...mockPlaylist, items: [{ track: null }] }])
        expect(result.split('\n')).toHaveLength(1)
    })

    it('joins multiple artist names with a comma and space', () => {
        const multiArtistPlaylist = {
            ...mockPlaylist,
            items: [
                {
                    track: {
                        ...mockPlaylist.items[0].track,
                        artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
                    },
                },
            ],
        }
        const result = csvFromJSON([multiArtistPlaylist])
        expect(result).toContain('Artist A, Artist B')
    })
})

describe('generateReturnFile', () => {
    it('returns a json data URI for fileType json', () => {
        const result = generateReturnFile([mockPlaylist], 'json')
        expect(result).toMatch(/^data:text\/json/)
    })

    it('returns a csv data URI for fileType csv', () => {
        const result = generateReturnFile([mockPlaylist], 'csv')
        expect(result).toMatch(/^data:text\/csv/)
    })

    it('throws for an unrecognised fileType', () => {
        expect(() => generateReturnFile([], 'xml' as unknown as FileType)).toThrow(
            'Unexpected fileType'
        )
    })
})
