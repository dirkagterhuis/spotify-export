import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

    it('selects only the log on Ctrl+A or Cmd+A', async () => {
        const user = userEvent.setup()
        render(
            <>
                <p>Rest of the page</p>
                <ProgressLog status={{ kind: 'done' }} messages={['first', 'second']} />
            </>
        )

        await user.click(screen.getByRole('log'))
        await user.keyboard('{Control>}a{/Control}')

        const selected = window.getSelection()?.toString()
        expect(selected).toContain('first')
        expect(selected).toContain('second')
        expect(selected).not.toContain('Rest of the page')

        window.getSelection()?.removeAllRanges()
        await user.keyboard('{Meta>}a{/Meta}')
        expect(window.getSelection()?.toString()).toContain('first')
    })
})
