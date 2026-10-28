import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileTypePicker } from './FileTypePicker'

describe('FileTypePicker', () => {
    it('checks the radio button of the given value', () => {
        render(<FileTypePicker value="csv" onChange={() => {}} />)
        expect(screen.getByRole('radio', { name: 'csv' })).toBeChecked()
        expect(screen.getByRole('radio', { name: 'json' })).not.toBeChecked()
    })

    it('reports the selected file type', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<FileTypePicker value="json" onChange={onChange} />)

        await user.click(screen.getByRole('radio', { name: 'csv' }))

        expect(onChange).toHaveBeenCalledWith('csv')
    })

    it('disables all options when disabled', () => {
        render(<FileTypePicker value="json" onChange={() => {}} disabled />)
        for (const radio of screen.getAllByRole('radio')) {
            expect(radio).toBeDisabled()
        }
    })
})
