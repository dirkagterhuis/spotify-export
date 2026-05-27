import axios from 'axios'

vi.mock('axios')

import { login, getAuthToken, validateState } from './authorization'
import { mockClient } from '../__test__/fixtures'

describe('login', () => {
    it('sets a state string on the client', () => {
        const client = { ...mockClient }
        login(client)
        expect(typeof client.state).toBe('string')
        expect(client.state!.length).toBeGreaterThan(0)
    })

    it('returns a Spotify authorize URL with required params', () => {
        const client = { ...mockClient }
        const url = login(client)
        expect(url).toContain('https://accounts.spotify.com/authorize')
        expect(url).toContain('client_id=test-client-id')
        expect(url).toContain('response_type=code')
        expect(url).toContain('scope=playlist-read-private')
    })

    it('includes the generated state in the URL', () => {
        const client = { ...mockClient }
        const url = login(client)
        expect(url).toContain(`state=${client.state}`)
    })
})

describe('getAuthToken', () => {
    beforeEach(() => vi.clearAllMocks())

    it('returns the access token on a 200 response', async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({
            status: 200,
            data: { access_token: 'tok_abc' },
        })
        const token = await getAuthToken('auth-code')
        expect(token).toBe('tok_abc')
    })

    it('posts to the Spotify token endpoint', async () => {
        vi.mocked(axios.post).mockResolvedValueOnce({
            status: 200,
            data: { access_token: 'tok_abc' },
        })
        await getAuthToken('auth-code')
        expect(vi.mocked(axios.post).mock.calls[0][0]).toBe(
            'https://accounts.spotify.com/api/token'
        )
    })

    it('throws on network error', async () => {
        vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network error'))
        await expect(getAuthToken('bad-code')).rejects.toThrow()
    })
})

describe('validateState', () => {
    it('does not call sendLoadingMessageToClient when states match', () => {
        const send = vi.fn()
        validateState({ ...mockClient, state: 'xyz' }, 'xyz', send)
        expect(send).not.toHaveBeenCalled()
    })

    it('calls sendLoadingMessageToClient with an error message on state mismatch', () => {
        const send = vi.fn()
        validateState({ ...mockClient, state: 'xyz' }, 'wrong', send)
        expect(send).toHaveBeenCalledWith(
            mockClient.socketId,
            expect.stringContaining('state_mismatch')
        )
    })
})
