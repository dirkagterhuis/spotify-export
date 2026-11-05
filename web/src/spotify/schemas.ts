// The shapes we read from the Spotify Web API, after its February 2026 changes for Development
// Mode apps: https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
// Zod drops every key a schema doesn't list, so these only describe what the export uses.
import { z } from 'zod'

const ArtistSchema = z.object({ name: z.string() })
const AlbumSchema = z.object({ name: z.string() })

const TrackSchema = z.object({
    type: z.literal('track'),
    // Local files (songs you added from your own computer) have no Spotify id or API link.
    id: z.string().nullable(),
    name: z.string(),
    album: AlbumSchema,
    artists: z.array(ArtistSchema),
    href: z.string().nullable(),
})

// Playlists can hold podcast episodes too. They have a show instead of an album and artists.
const EpisodeSchema = z.object({
    type: z.literal('episode'),
    id: z.string(),
    name: z.string(),
    show: z.object({ name: z.string() }),
    href: z.string(),
})

// One entry of a playlist. Spotify renamed `track` to `item`, since it isn't always a track.
const PlaylistItemSchema = z.object({
    is_local: z.boolean(),
    // `type` tells zod which of the two schemas to check, and TypeScript which shape you have.
    // null when the track or episode is no longer available on Spotify.
    item: z.discriminatedUnion('type', [TrackSchema, EpisodeSchema]).nullable(),
})

const OwnerSchema = z.object({
    id: z.string(),
    // null when Spotify has no name for the owner.
    display_name: z.string().nullable(),
    type: z.string(),
})

// A playlist in the list of the user's playlists. Its tracks come from a separate request.
// The API's `items` field here is only a summary (link + count) and is left out on purpose:
// the export puts the real items under that name, see `PlaylistWithItems`.
const PlaylistSchema = z.object({
    id: z.string(),
    name: z.string(),
    owner: OwnerSchema,
    collaborative: z.boolean(),
    href: z.string(),
    // Spotify sends null or '' for a playlist without a description. Both mean the same to us,
    // so it is always a string after parsing.
    description: z
        .string()
        .nullish()
        .transform((description) => description ?? ''),
})

// Spotify splits long lists into pages; `next` is the URL of the next page, null on the last one.
function pageSchema<Item extends z.ZodType>(item: Item) {
    return z.object({
        items: z.array(item),
        total: z.number(),
        next: z.string().nullable(),
    })
}

export const PlaylistPageSchema = pageSchema(PlaylistSchema)
export const PlaylistItemPageSchema = pageSchema(PlaylistItemSchema)

// The logged-in user (`/me`). Only the id: to tell which playlists are the user's own.
export const CurrentUserSchema = z.object({ id: z.string() })

// The body Spotify sends along with an error status, e.g. `{ "error": { "status": 403, "message": "Forbidden" } }`.
export const ApiErrorSchema = z.object({
    error: z.object({ message: z.string() }),
})

export type Track = z.infer<typeof TrackSchema>
export type Episode = z.infer<typeof EpisodeSchema>
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>
export type Playlist = z.infer<typeof PlaylistSchema>
// What the export file is made of: a playlist plus all its items. When Spotify didn't let the app
// read the items, `items` is empty and `items_skipped` says why, so the playlist still shows up.
// Snake case, like the rest of the file, which follows Spotify's field names.
export type PlaylistWithItems = Playlist & { items: PlaylistItem[]; items_skipped?: string }
