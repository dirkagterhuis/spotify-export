import { downloadFile, exportFileName } from './downloadFile'

describe('exportFileName', () => {
    it('names the file after the local date and time, with _ instead of :', () => {
        // Month 10 is November: JavaScript counts months from 0.
        const date = new Date(2026, 10, 5, 9, 3, 7)
        expect(exportFileName('json', date)).toBe(
            'spotify playlists export 2026-11-05 09_03_07.json'
        )
        expect(exportFileName('csv', date)).toBe('spotify playlists export 2026-11-05 09_03_07.csv')
    })
})

describe('downloadFile', () => {
    const blobUrl = 'blob:http://127.0.0.1:5173/1234'
    let createObjectURL: ReturnType<typeof vi.fn<(blob: Blob) => string>>
    let revokeObjectURL: ReturnType<typeof vi.fn<(url: string) => void>>

    beforeEach(() => {
        vi.useFakeTimers()
        // jsdom has no object URLs, so stand in for them.
        createObjectURL = vi.fn(() => blobUrl)
        revokeObjectURL = vi.fn()
        URL.createObjectURL = createObjectURL
        URL.revokeObjectURL = revokeObjectURL
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('saves the content as a Blob with the MIME type', async () => {
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

        downloadFile({ content: '{"a":1}', mimeType: 'application/json;charset=utf-8' }, 'x.json')

        const blob = createObjectURL.mock.calls[0][0]
        expect(blob.type).toBe('application/json;charset=utf-8')
        expect(await blob.text()).toBe('{"a":1}')
    })

    it('clicks a temporary download link that is in the document', () => {
        // jsdom can't navigate, so record the link at the moment it is clicked instead.
        const clicked: { href: string; download: string; isInDocument: boolean }[] = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
            this: HTMLAnchorElement
        ) {
            clicked.push({
                href: this.href,
                download: this.download,
                isInDocument: this.isConnected,
            })
        })

        downloadFile({ content: 'a,b', mimeType: 'text/csv;charset=utf-8' }, 'export.csv')

        expect(clicked).toEqual([{ href: blobUrl, download: 'export.csv', isInDocument: true }])
        expect(document.querySelector('a')).toBeNull()
    })

    it('revokes the URL a while after the download started', () => {
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

        downloadFile({ content: 'a,b', mimeType: 'text/csv;charset=utf-8' }, 'export.csv')

        expect(revokeObjectURL).not.toHaveBeenCalled()
        vi.runAllTimers()
        expect(revokeObjectURL).toHaveBeenCalledWith(blobUrl)
    })
})
