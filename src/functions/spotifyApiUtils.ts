import axios from 'axios'
import { config } from '../../config'
import { Playlist, PlaylistItem, PlaylistPageSchema, PlaylistItemPageSchema } from '../types'

const rateLimitingTimeout: number = 100

export async function getPlaylists(
    token: string,
    url: string,
    playlists: Playlist[]
): Promise<Playlist[]> {
    let totalToGet: number
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
                Origin: config.baseUrl,
            },
            params: { limit: 50 },
        })
        const data = PlaylistPageSchema.parse(response.data)
        playlists.push(...data.items)
        totalToGet = data.total

        if (data.next === null) {
            if (totalToGet !== playlists.length) {
                throw new Error(`Expected: ${totalToGet} playlists; retrieved: ${playlists.length}`)
            }
            return playlists
        }
        console.log(`Getting new page of playlists. Current size: ${playlists.length}`)
        await getPlaylists(token, data.next, playlists)
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error.message)}`)
        throw new Error(error)
    }
    return playlists
}

export async function getItemsByPlaylists(
    token: string,
    playlists: Playlist[],
    sendMessageToClient: (socketId: string, message: string) => void,
    socketId: string
): Promise<void> {
    console.log(`Getting all tracks for ${playlists.length} playlists.`)

    const numberOfPlaylistsToGet: number = process.env.PORT ? playlists.length : 10
    for (let i = 0; i < numberOfPlaylistsToGet; i++) {
        console.log(
            `Getting tracks for playlist #${(i + 1).toString().padStart(3, '0')} out of ${playlists.length}: ${playlists[i].name}`
        )
        sendMessageToClient(
            socketId,
            `Getting tracks for playlist #${(i + 1).toString().padStart(3, '0')} out of ${playlists.length}: ${playlists[i].name}`
        )
        const playlistId = playlists[i].id
        const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
        playlists[i].items = await getItemsByPlaylist(token, url, [])
    }
    console.log(`Done.`)
}

async function getItemsByPlaylist(
    token: string,
    url: string,
    playlistItems: PlaylistItem[]
): Promise<PlaylistItem[]> {
    let totalToGet: number
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
                Origin: config.baseUrl,
            },
            params: {
                limit: 50,
                fields: 'total,next,items(track(id,name,album.name,artists(name),href))',
            },
        })
        const data = PlaylistItemPageSchema.parse(response.data)
        playlistItems.push(...data.items)
        totalToGet = data.total

        if (data.next === null) {
            if (totalToGet !== playlistItems.length) {
                throw new Error(
                    `Expected: ${totalToGet} playlist items; retrieved: ${playlistItems.length}`
                )
            }
            return playlistItems
        }
        await new Promise((resolve) => setTimeout(resolve, rateLimitingTimeout))
        await getItemsByPlaylist(token, data.next, playlistItems)
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error.message)}`)
        throw new Error(error)
    }
    return playlistItems
}
