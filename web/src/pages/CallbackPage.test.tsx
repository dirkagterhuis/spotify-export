import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { exportAfterLoginState } from '../auth/exportAfterLogin'
import type { SpotifyToken } from '../auth/spotifyCallback'
import { CallbackPage } from './CallbackPage'

const token: SpotifyToken = { accessToken: 'token-xyz', expiresAt: 1_000 }

function renderCallback(
    completeLoginFn: (search: string) => Promise<SpotifyToken>,
    onLogin = vi.fn()
) {
    render(
        <StrictMode>
            <MemoryRouter initialEntries={['/callback?code=code-1&state=state-123']}>
                <Routes>
                    <Route path="/" element={<HomeStub />} />
                    <Route
                        path="/callback"
                        element={
                            <CallbackPage onLogin={onLogin} completeLoginFn={completeLoginFn} />
                        }
                    />
                </Routes>
            </MemoryRouter>
        </StrictMode>
    )
    return { onLogin }
}

// Shows the location state it was navigated to with, so the test can check what the home page gets.
function HomeStub() {
    const { state } = useLocation()
    return <p>home page {JSON.stringify(state)}</p>
}

describe('CallbackPage', () => {
    it('completes the login once, even under StrictMode, then goes to the home page', async () => {
        const completeLoginFn = vi.fn().mockResolvedValue(token)
        const { onLogin } = renderCallback(completeLoginFn)

        expect(
            await screen.findByText(`home page ${JSON.stringify(exportAfterLoginState)}`)
        ).toBeInTheDocument()
        expect(completeLoginFn).toHaveBeenCalledTimes(1)
        expect(completeLoginFn).toHaveBeenCalledWith('?code=code-1&state=state-123')
        expect(onLogin).toHaveBeenCalledWith(token)
    })

    it('shows why the login failed, with a way back', async () => {
        const completeLoginFn = vi.fn().mockRejectedValue(new Error('Access denied'))
        const { onLogin } = renderCallback(completeLoginFn)

        expect(await screen.findByText('Access denied')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Back to spotify export' })).toHaveAttribute(
            'href',
            '/'
        )
        expect(onLogin).not.toHaveBeenCalled()
    })
})
