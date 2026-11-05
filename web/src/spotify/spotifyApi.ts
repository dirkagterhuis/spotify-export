// Reads the user's playlists straight from the Spotify Web API, with the access token from the
// PKCE login. Replaces the axios calls of the Express app (src/functions/spotifyApiUtils.ts in
// git tag express-app-final).
import type { z } from 'zod'
import {
    ApiErrorSchema,
    CurrentUserSchema,
    PlaylistItemPageSchema,
    PlaylistPageSchema,
    type Playlist,
    type PlaylistItem,
} from './schemas'

const apiUrl = 'https://api.spotify.com/v1'
// The most Spotify sends per page, for both lists.
const pageSize = 50
// How often to try again after a 429 (too many requests) before giving up.
const maxRetries = 3
// Spotify can ask to wait for hours. Rather than leave the page hanging, give up past this.
const maxRetryAfterSeconds = 60

// Keeps the HTTP status, so callers can act on it: log in again on a 401, skip a playlist on a 403.
export class SpotifyApiError extends Error {
    readonly status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'SpotifyApiError'
        this.status = status
    }
}

export type SpotifyApiOptions = {
    // Both injectable so tests don't call Spotify or really wait.
    fetchFn?: typeof fetch
    sleep?: (ms: number) => Promise<void>
}

// One GET request: sends the token, waits and tries again on a 429, and checks the response
// against `schema`. The return type follows from the schema you pass in.
export async function spotifyGet<Schema extends z.ZodType>(
    url: string,
    accessToken: string,
    schema: Schema,
    { fetchFn = fetch, sleep = wait }: SpotifyApiOptions = {}
): Promise<z.output<Schema>> {
    for (let attempt = 0; ; attempt++) {
        let response: Response
        try {
            response = await fetchFn(url, { headers: { Authorization: `Bearer ${accessToken}` } })
        } catch (error) {
            // fetch only throws when there is no response at all, e.g. when you're offline.
            throw new Error(
                "Couldn't reach Spotify. Check your internet connection and try again.",
                {
                    cause: error,
                }
            )
        }

        if (response.status === 429 && attempt < maxRetries) {
            const seconds = retryAfterSeconds(response)
            if (seconds <= maxRetryAfterSeconds) {
                await sleep(seconds * 1000)
                continue
            }
        }
        if (!response.ok) {
            throw await toApiError(response)
        }

        const result = schema.safeParse(await response.json())
        if (!result.success) {
            throw new Error(`Spotify sent data the export doesn't understand, from ${url}`, {
                cause: result.error,
            })
        }
        return result.data
    }
}

// The logged-in user's Spotify id, to tell their own playlists from the ones they only follow.
export async function getCurrentUserId(
    accessToken: string,
    options: SpotifyApiOptions = {}
): Promise<string> {
    const user = await spotifyGet(`${apiUrl}/me`, accessToken, CurrentUserSchema, options)
    return user.id
}

// All playlists in the user's library: their own and the ones they follow.
export function getPlaylists(
    accessToken: string,
    options: SpotifyApiOptions = {}
): Promise<AllPages<Playlist>> {
    const params = new URLSearchParams({ limit: String(pageSize) })
    return getAllPages(`${apiUrl}/me/playlists?${params}`, accessToken, PlaylistPageSchema, options)
}

// Only ask for the fields the schema reads, which keeps the responses small.
const itemFields =
    'next,total,items(is_local,item(type,id,name,href,album(name),artists(name),show(name)))'

// All tracks and episodes of one playlist. Gives a 403 for a playlist the user neither owns
// nor collaborates on: Development Mode apps may only read those.
export function getPlaylistItems(
    accessToken: string,
    playlistId: string,
    options: SpotifyApiOptions = {}
): Promise<AllPages<PlaylistItem>> {
    const params = new URLSearchParams({
        limit: String(pageSize),
        // Without this, Spotify leaves episodes out.
        additional_types: 'track,episode',
        fields: itemFields,
    })
    const url = `${apiUrl}/playlists/${encodeURIComponent(playlistId)}/items?${params}`
    return getAllPages(url, accessToken, PlaylistItemPageSchema, options)
}

type Page<Item> = { items: Item[]; total: number; next: string | null }

// `total` is how many items Spotify says there are. It can differ from `items.length` when the
// list changes during the export; the caller decides whether to warn about that.
export type AllPages<Item> = { items: Item[]; total: number }

// Follows `next` from page to page until the last one. A loop instead of the recursion of the
// Express app: same result, but no growing chain of nested calls for a long playlist.
async function getAllPages<Item>(
    firstUrl: string,
    accessToken: string,
    pageSchema: z.ZodType<Page<Item>>,
    options: SpotifyApiOptions
): Promise<AllPages<Item>> {
    const items: Item[] = []
    let total = 0
    let url: string | null = firstUrl
    while (url !== null) {
        const page: Page<Item> = await spotifyGet(url, accessToken, pageSchema, options)
        items.push(...page.items)
        // The last page's count is the most recent one.
        total = page.total
        url = page.next
    }
    return { items, total }
}

// Spotify says how many seconds to wait in the Retry-After header. If it's missing, wait a second.
function retryAfterSeconds(response: Response): number {
    const seconds = Number(response.headers.get('Retry-After'))
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 1
}

async function toApiError(response: Response): Promise<SpotifyApiError> {
    const { status } = response
    switch (status) {
        case 401:
            return new SpotifyApiError('Your Spotify login has expired. Log in again.', status)
        case 403:
            return new SpotifyApiError(
                "Spotify doesn't let this app read that. In Development Mode, an app can only read playlists you own or collaborate on, and only for users added to the app in the Spotify dashboard.",
                status
            )
        case 429:
            return new SpotifyApiError(
                'Spotify is getting too many requests. Wait a few minutes and try again.',
                status
            )
    }
    // Spotify's own explanation if there is one, the status code otherwise.
    const body = ApiErrorSchema.safeParse(await response.json().catch(() => undefined))
    const reason = body.success ? body.data.error.message : `HTTP ${status}`
    return new SpotifyApiError(`Spotify API error: ${reason}`, status)
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
