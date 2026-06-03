import { z } from 'zod'

export const ArtistSchema = z.object({ name: z.string() })
export const AlbumSchema = z.object({ name: z.string() })
export const TrackSchema = z.object({
    id: z.string(),
    name: z.string(),
    album: AlbumSchema,
    artists: z.array(ArtistSchema),
    href: z.string(),
})
export const PlaylistItemSchema = z.object({ track: TrackSchema.nullable() })
export const OwnerSchema = z.object({ display_name: z.string(), type: z.string() })

// Shape Spotify actually returns in the playlist list response — no track items yet
const SpotifyPlaylistSchema = z.object({
    id: z.string(),
    name: z.string(),
    owner: OwnerSchema,
    collaborative: z.boolean(),
    href: z.string(),
    description: z.string(),
})

// Our internal type — extends the API shape with items we fetch separately
export const PlaylistSchema = SpotifyPlaylistSchema.extend({
    items: z.array(PlaylistItemSchema).optional(),
})

// Used to parse the paginated playlist list response from Spotify
export const PlaylistPageSchema = z.object({
    items: z.array(SpotifyPlaylistSchema),
    total: z.number(),
    next: z.string().nullable(),
})
export const PlaylistItemPageSchema = z.object({
    items: z.array(PlaylistItemSchema),
    total: z.number(),
    next: z.string().nullable(),
})
export const AuthTokenResponseSchema = z.object({ access_token: z.string() })

export type Artist = z.infer<typeof ArtistSchema>
export type Album = z.infer<typeof AlbumSchema>
export type Track = z.infer<typeof TrackSchema>
export type PlaylistItem = z.infer<typeof PlaylistItemSchema>
export type Owner = z.infer<typeof OwnerSchema>
export type Playlist = z.infer<typeof PlaylistSchema>
