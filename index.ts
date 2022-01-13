import { generateState, getSpotifyLoginUrl, getAuthToken } from './src/authorization'
import { getPlaylists, getItemsByPlaylists } from './src/spotifyApiUtils'

import express from 'express'
import type { Express } from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
// can be removed if not used in any html files
import * as ejs from 'ejs'

const app: Express = express()
const port: string | number = process.env.PORT || 8000
const server = http.createServer(app) //express does this behind the scenes anyways.
const io = new Server(server) //but you need the 'server' variable because socket.io needs it as param

interface Client {
    socketId: string
    sessionId: string
    state?: string
    fileType?: FileType
}
type FileType = 'json' | 'csv'
let clients: Client[] = []

// Setup static directory to serve
app.use(express.static(path.join(__dirname, './public')))
// To do: add domain of app
app.use(
    cors({
        origin: 'http://localhost:8000',
    })
)

// Only want to use html with some variables -> using EJS
app.engine('html', ejs.renderFile)

// remember: static website uses ~/index.html; dynamic website uses ~/public/views/index.html
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/views/index.html'))
})

app.get('/spotify-app', function (req, res) {
    res.render(path.join(__dirname + '/public/views/spotify-app.html'), {
        showLoading: false,
    })
    console.log(`# Clients @ /spotify-app: ${clients.length}`)
})

app.get('/login', function (req, res) {
    console.log('CLICK!')
    const sessionId: string = req.query.sessionId as string
    const state = generateState()
    const loginUrl: string = getSpotifyLoginUrl(state)
    const client = clients.find((obj) => {
        return obj.sessionId === sessionId
    })
    if (!client) {
        throw new Error(`Request not coming from an active session.`)
    }
    client.state = state
    client.fileType = req.query.fileType as FileType
    res.redirect(loginUrl)
})

app.get('/spotify-app-callback', async function (req, res) {
    // use 'redirect', not 'render', as to remove the code from the url
    res.redirect('/spotify-app')

    console.log('code', req.query.code)
    console.log('state', req.query.state)
    console.log('error', req.query.error)

    const code: string = (req.query.code as string) || null
    const state = req.query.state || null
    const error = req.query.error || null

    const authToken = await getAuthToken(code)

    // this is a bit dodgy as socket.io creating the client will race with getting the auth token
    // also, ideally, you'd also get the sessionId in the callback and get the client.state from there
    const client = clients.find((client) => {
        return client.state === state
    })
    if (!client) {
        res.redirect(
            '/#' +
                new URLSearchParams({
                    error: 'state_mismatch: no active client found with received state',
                })
        )
    }

    sendMessageToClient(client.socketId, `Succesfully signed in to your Spotify Account`)

    const playlists = await getPlaylists(authToken, 'https://api.spotify.com/v1/me/playlists', [])

    sendMessageToClient(
        client.socketId,
        `Retrieved ${playlists.length} playlists from your Spotify Account`
    )

    await getItemsByPlaylists(authToken, playlists, sendMessageToClient, client.socketId)

    // Only do this when developing locally; you don't want this when it's a live server
    if (port === 8000) {
        fs.writeFileSync('./playlists.json', JSON.stringify(playlists, null, 2))
    }

    const dataStr = io.to(client.socketId).emit('readyForDownload', {
        body: generateReturnFile(playlists, client.fileType),
    })
})

function generateReturnFile(playlists, fileType: FileType): string {
    switch (fileType) {
        case 'json':
            return `data:text/json;charset=utf-8, ${encodeURIComponent(
                JSON.stringify(playlists, null, 2)
            )}`
        case 'csv':
            return `date:text/csv;charset=utf-8, ${csvFromJSON(playlists)}`
        default:
            throw new Error(`Unexpected fileType: ${fileType}`)
    }
}

function csvFromJSON(playlists): string {
    let ret: string = `
        playlist id,
        playlist Name,
        playlist owner name,
        playlist owner type,
        playlist is collaborative,
        playlist description,
        track id,track name,
        track artist name(s),
        track album name
    `
    for (let i = 0; i < playlists.length; i++) {
        const playlist = playlists[i]
        const items = playlist.items
        if (!items) {
            console.log(`Undefined items for playlist ${playlist.id}`)
            continue
        }
        // console.log(`Playlist: ${playlist.id}`)
        // console.log(`items: ${JSON.stringify(items)}`)
        for (let j = 0; j < items.length; j++) {
            // console.log(`item: ${JSON.stringify(items[j])}`)
            const track = items[j].track
            if (track === null) {
                continue
            }
            // console.log(`track: ${JSON.stringify(track)}`)
            const artists = track.artists
            let artistNames: string = ''
            for (let k = 0; k < artists.length; k++) {
                artistNames += artists[k].name as string
            }
            ret += `\n,
                ${playlist.id},
                ${playlist.name},
                ${playlist.owner.display_name},
                ${playlist.owner.type},
                ${String(playlist.collaborative)},
                ${playlist.description},
                ${track.id},
                ${track.name},
                ${artistNames},
                ${track.album.name}`
        }
    }
    return ret
}

io.on('connection', (socket) => {
    console.log(`Connected`)
    console.log(`Socket Id is: ${socket.id}`)

    let sessionId: string
    socket.on('sessionId', function (event) {
        if (!event.body) {
            throw new Error(`Incoming sessionId on Server is undefined`)
        }
        sessionId = event.body

        // first check if client exists already based on sessionId
        const matchingClients = clients.filter((client) => {
            return client.sessionId === sessionId
        })
        if (matchingClients.length > 1) {
            throw new Error(`Multiple clients with the same sessionId`)
        }
        if (matchingClients.length === 0) {
            clients.push({
                sessionId,
                socketId: socket.id,
            })
        } else {
            matchingClients[0].socketId = socket.id
        }
    })

    // clear client after 1 hour
    socket.on('disconnect', () => {
        console.log('user disconnected')
        setTimeout(function () {
            try {
                clients = clients.filter(function (client) {
                    return client.socketId !== socket.id
                })
            } catch (error) {
                console.log(`Failed to remove client after timeout; socket Id: ${socket.id}`)
            }
        }, 3600000)
    })
})

app.get('/weather-app', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/views/weather-app.html'))
})

app.get('/chat-app', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/views/chat-app.html'))
})

app.get('/about', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/views/about.html'))
})

app.get('/help', function (req, res) {
    res.sendFile(path.join(__dirname + '/public/views/help.html'))
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

function sendMessageToClient(socketId, message: string) {
    io.to(socketId).emit('loadingMessage', {
        body: message,
    })
}
