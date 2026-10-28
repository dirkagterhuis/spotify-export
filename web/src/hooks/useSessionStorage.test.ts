import { act, renderHook } from '@testing-library/react'
import { z } from 'zod'
import { useSessionStorage } from './useSessionStorage'

const schema = z.enum(['a', 'b'])

describe('useSessionStorage', () => {
    afterEach(() => {
        sessionStorage.clear()
    })

    it('returns the initial value when nothing is stored', () => {
        const { result } = renderHook(() => useSessionStorage('key', schema, 'a'))
        expect(result.current[0]).toBe('a')
    })

    it('stores updates and reads them back on the next mount', () => {
        const first = renderHook(() => useSessionStorage('key', schema, 'a'))
        act(() => first.result.current[1]('b'))
        expect(first.result.current[0]).toBe('b')
        first.unmount()

        const second = renderHook(() => useSessionStorage('key', schema, 'a'))
        expect(second.result.current[0]).toBe('b')
    })

    it('falls back to the initial value when the stored value is invalid', () => {
        sessionStorage.setItem('key', JSON.stringify('xml'))
        const { result } = renderHook(() => useSessionStorage('key', schema, 'a'))
        expect(result.current[0]).toBe('a')
    })

    it('falls back to the initial value when the stored value is not json', () => {
        sessionStorage.setItem('key', 'not json')
        const { result } = renderHook(() => useSessionStorage('key', schema, 'a'))
        expect(result.current[0]).toBe('a')
    })
})
