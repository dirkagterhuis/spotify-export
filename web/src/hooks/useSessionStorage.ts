import { useState } from 'react'
import type { z } from 'zod'

// Like useState, but the value survives a page reload (e.g. the redirect back from Spotify's login)
// by mirroring it into sessionStorage. The schema guards against stale or hand-edited values.
export function useSessionStorage<T>(key: string, schema: z.ZodType<T>, initialValue: T) {
    // Lazy initial state: only read sessionStorage on the first render, not on every render.
    const [value, setValue] = useState<T>(() => readValue(key, schema) ?? initialValue)

    function setAndStore(newValue: T) {
        setValue(newValue)
        try {
            sessionStorage.setItem(key, JSON.stringify(newValue))
        } catch {
            // Storage can be full or blocked (e.g. some private modes); the in-memory state still works.
        }
    }

    return [value, setAndStore] as const
}

function readValue<T>(key: string, schema: z.ZodType<T>): T | undefined {
    try {
        const raw = sessionStorage.getItem(key)
        if (raw === null) {
            return undefined
        }
        const result = schema.safeParse(JSON.parse(raw))
        return result.success ? result.data : undefined
    } catch {
        return undefined
    }
}
