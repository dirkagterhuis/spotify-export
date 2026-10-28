import { render, screen } from '@testing-library/react'
import { ProgressLog } from './ProgressLog'

describe('ProgressLog', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders nothing before an export starts', () => {
        const { container } = render(<ProgressLog status={{ kind: 'idle' }} messages={[]} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('scrolls to the newest message', () => {
        // jsdom doesn't do layout, so pretend the content is taller than the box.
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(500)
        const { rerender } = render(
            <ProgressLog status={{ kind: 'exporting' }} messages={['first']} />
        )
        const log = screen.getByRole('log')
        log.scrollTop = 0

        rerender(<ProgressLog status={{ kind: 'exporting' }} messages={['first', 'second']} />)

        expect(log.scrollTop).toBe(500)
    })
})
