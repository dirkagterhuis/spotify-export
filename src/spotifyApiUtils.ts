import axios from 'axios'

export async function getPlaylists(token: string, url: string, playlists) {
    let totalToGet: number
    try {
        const getPlaylistResponse = await axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
            },
            params: {
                limit: 50,
            },
        })
        if (getPlaylistResponse.status === 200) {
            playlists.push(...getPlaylistResponse.data.items)
            totalToGet = getPlaylistResponse.data.total
        }
        const next: string = getPlaylistResponse.data.next
        if (next === null) {
            if (totalToGet !== playlists.length) {
                throw new Error(`Expected: ${totalToGet} playlists; retrieved: ${playlists.length}`)
            }
            return playlists
        }
        console.log(`Getting new page of playlists. Current size: ${playlists.length}`)
        await getPlaylists(token, next, playlists)
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error.message)}`)
        throw new Error(error)
    }
    return playlists
}

export async function getItemsByPlaylists(
    token: string,
    playlists,
    sendMessageToClient: Function,
    socketId: string
) {
    console.log(`Getting all tracks for ${playlists.length} playlists.`)

    // Get all playlists for production but 10 for dev
    const numberOfPlaylistsToGet: number = process.env.PORT ? playlists.length : 10
    for (let i = 0; i < numberOfPlaylistsToGet; i++) {
        console.log(
            `Getting tracks for playlist #${(i + 1).toString().padStart(3, '0')} out of ${
                playlists.length
            }: ${playlists[i].name}`
        )
        sendMessageToClient(
            socketId,
            `Getting tracks for playlist #${(i + 1).toString().padStart(3, '0')} out of ${
                playlists.length
            }: ${playlists[i].name}`
        )
        const playlistId = playlists[i].id
        const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
        playlists[i].items = await getItemsByPlaylist(token, url, [])
    }
    console.log(`Done.`)
}

async function getItemsByPlaylist(token: string, url: string, playlistItems) {
    let totalToGet: number
    try {
        const getPlaylistItemResponse = await axios.get(url, {
            headers: {
                Authorization: 'Bearer ' + token,
            },
            params: {
                limit: 50,
                // see https://developer.spotify.com/documentation/web-api/reference/#/operations/get-track for all fields
                // test fields here with token: https://developer.spotify.com/console/get-playlist-tracks/
                fields: 'total,next,items(track(id,name,album.name,artists(name)))',
            },
        })
        if (getPlaylistItemResponse.status === 200) {
            playlistItems.push(...getPlaylistItemResponse.data.items)
            totalToGet = getPlaylistItemResponse.data.total
        }
        const next: string = getPlaylistItemResponse.data.next
        if (next === null) {
            if (totalToGet !== playlistItems.length) {
                throw new Error(
                    `Expected: ${totalToGet} playlist items; retrieved: ${playlistItems.length}`
                )
            }
            return playlistItems
        }
        await getItemsByPlaylist(token, next, playlistItems)
    } catch (error) {
        console.log(`Error: ${JSON.stringify(error.message)}`)
        throw new Error(error)
    }
    return playlistItems
}
