import type { Client, FileType} from './types'
import { config } from '../config'
import { login, getAuthToken, validateState} from './functions/authorization'
import { getPlaylists, getItemsByPlaylists } from './functions/spotifyApiUtils'
import { generateReturnFile } from './functions/generateReturnFile'

import type { Express } from 'express'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { URLSearchParams } from 'url'
import * as ejs from 'ejs'

const app: Express = express()
const port: string | number = process.env.PORT || 8000
const server = http.createServer(app)
const io = new Server(server)

//TODO This is probably a bad idea if this thing scales. Probably better use npm-cache or Redis, or a database, when that happens.
let clients: Client[] = []

// Setup static directory to serve.
app.use(express.static(path.join(__dirname, '../public')))

app.use(
    cors({
        origin: config.baseUrl,
    })
)

// Only want to use html with some variables -> using EJS.
app.engine('html', ejs.renderFile)

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/views/index.html'))
})

app.get('/login', function (req, res) {
    const client = clients.find((client) => {
        return client.sessionId === req.query.sessionId as string
    })
    if (!client) {
        throw new Error(`Request not coming from an active session.`)
    }
    client.fileType = req.query.fileType as FileType
    res.redirect(login(client))
})

app.get('/spotify-app-callback', async function (req, res) {
    // In order to remove the code from the url.
    res.redirect('../')

    const code: string = req.query.code as string || null
    const state = req.query.state as string || null
    const error = req.query.error || null

    const authToken = await getAuthToken(code)

    // Ideally, you'd also get the sessionId in the callback and get the client.state from there (not possible), 
    // or redirect to a new page and get the session id. But, then the user would have to click again -> use State to match.
    const client = clients.find((client) => {
        return client.state === state
    })
    validateState(client, state, sendLoadingMessageToClient)
    sendLoadingMessageToClient(client.socketId, `Succesfully signed in to your Spotify Account`)

    const playlists = await getPlaylists(authToken, 'https://api.spotify.com/v1/me/playlists', [])
    sendLoadingMessageToClient(
        client.socketId,
        `Retrieved ${playlists.length} playlists from your Spotify Account`
    )

    await getItemsByPlaylists(authToken, playlists, sendLoadingMessageToClient, client.socketId)
    // Only do this when running locally in order to store the file directly.
    if (port === 8000) {
        fs.writeFileSync('../playlists.json', JSON.stringify(playlists, null, 2))
    }
    io.to(client.socketId).emit('readyForDownload', {
        body: generateReturnFile(playlists, client.fileType),
        fileType: client.fileType,
    })
})

io.on('connection', (socket) => {
    console.log(`Connected`)
    console.log(`Socket Id is: ${socket.id}`)

    socket.on('sessionId', function (event) {
        if (event.body === undefined) {
            newClient(socket.id)
            return
        } 
        const sessionId: string = event.body
        const matchingClients: Client[] = clients.filter((client) => {
            return client.sessionId === sessionId
        })
        if (matchingClients.length > 1) {
            const errorMessage: string = `Multiple clients with the same sessionId: ${sessionId}`
            console.log(errorMessage)
            throw new Error(errorMessage)
        }
        if (matchingClients.length === 0) {
            newClient(socket.id)
            return
        } 
        matchingClients[0].socketId = socket.id
    })

    // Clear client after 1 hour.
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

app.get('/about', function (req, res) {
    res.sendFile(path.join(__dirname, '../public/views/about.html'))
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})

function sendLoadingMessageToClient(socketId, message: string) {
    io.to(socketId).emit('loadingMessage', {
        body: message,
    })
}

function newClient(socketId: string) {
    const sessionId: string = (Math.random() + 1).toString(36).substring(7)
    console.log(`Getting new session id: ${sessionId}`)
    clients.push({
        sessionId,
        socketId: socketId,
    })
    io.to(socketId).emit('newSessionId', {
        body: sessionId
    })
}