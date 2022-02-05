"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var authorization_1 = require("./src/authorization");
var spotifyApiUtils_1 = require("./src/spotifyApiUtils");
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = require("socket.io");
var cors_1 = __importDefault(require("cors"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var url_1 = require("url");
// can be removed if not used in any html files
var ejs = __importStar(require("ejs"));
var generateReturnFile_1 = require("./src/generateReturnFile");
var app = (0, express_1["default"])();
var port = process.env.PORT || 8000;
var server = http_1["default"].createServer(app); //express does this behind the scenes anyways.
var io = new socket_io_1.Server(server); //but you need the 'server' variable because socket.io needs it as param
// This is probably a bad idea if this thing scales. Probably better use npm-cache or Redis, or a database, when that happens
var clients = [];
// Setup static directory to serve
app.use(express_1["default"].static(path_1["default"].join(__dirname, './public')));
// To do: add domain of app
app.use((0, cors_1["default"])({
    origin: 'http://localhost:8000'
}));
// Only want to use html with some variables -> using EJS
app.engine('html', ejs.renderFile);
// remember: static website uses ~/index.html; dynamic website uses ~/public/views/index.html
app.get('/', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname + '/public/views/spotify-app.html'));
});
app.get('/spotify-app', function (req, res) {
    res.render(path_1["default"].join(__dirname + '/public/views/spotify-app.html'), {
        showLoading: false
    });
    console.log("# Clients @ /spotify-app: ".concat(clients.length));
});
app.get('/login', function (req, res) {
    console.log('CLICK!');
    var sessionId = req.query.sessionId;
    var state = (0, authorization_1.generateState)();
    var loginUrl = (0, authorization_1.getSpotifyLoginUrl)(state);
    var client = clients.find(function (obj) {
        return obj.sessionId === sessionId;
    });
    if (!client) {
        throw new Error("Request not coming from an active session.");
    }
    client.state = state;
    client.fileType = req.query.fileType;
    res.redirect(loginUrl);
});
app.get('/spotify-app-callback', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var code, state, error, authToken, client, playlists, dataStr;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // use 'redirect', not 'render', as to remove the code from the url
                    res.redirect('/spotify-app');
                    console.log('code', req.query.code);
                    console.log('state', req.query.state);
                    console.log('error', req.query.error);
                    code = req.query.code || null;
                    state = req.query.state || null;
                    error = req.query.error || null;
                    return [4 /*yield*/, (0, authorization_1.getAuthToken)(code)
                        // this is a bit dodgy as socket.io creating the client will race with getting the auth token
                        // also, ideally, you'd also get the sessionId in the callback and get the client.state from there
                    ];
                case 1:
                    authToken = _a.sent();
                    client = clients.find(function (client) {
                        return client.state === state;
                    });
                    if (!client) {
                        res.redirect('/#' +
                            new url_1.URLSearchParams({
                                error: 'state_mismatch: no active client found with received state'
                            }));
                    }
                    sendMessageToClient(client.socketId, "Succesfully signed in to your Spotify Account");
                    return [4 /*yield*/, (0, spotifyApiUtils_1.getPlaylists)(authToken, 'https://api.spotify.com/v1/me/playlists', [])];
                case 2:
                    playlists = _a.sent();
                    sendMessageToClient(client.socketId, "Retrieved ".concat(playlists.length, " playlists from your Spotify Account"));
                    return [4 /*yield*/, (0, spotifyApiUtils_1.getItemsByPlaylists)(authToken, playlists, sendMessageToClient, client.socketId)
                        // Only do this when developing locally; you don't want this when it's a live server
                    ];
                case 3:
                    _a.sent();
                    // Only do this when developing locally; you don't want this when it's a live server
                    if (port === 8000) {
                        fs_1["default"].writeFileSync('./playlists.json', JSON.stringify(playlists, null, 2));
                    }
                    dataStr = io.to(client.socketId).emit('readyForDownload', {
                        body: (0, generateReturnFile_1.generateReturnFile)(playlists, client.fileType),
                        fileType: client.fileType
                    });
                    return [2 /*return*/];
            }
        });
    });
});
io.on('connection', function (socket) {
    console.log("Connected");
    console.log("Socket Id is: ".concat(socket.id));
    var sessionId;
    socket.on('sessionId', function (event) {
        if (!event.body) {
            throw new Error("Incoming sessionId on Server is undefined");
        }
        sessionId = event.body;
        // first check if client exists already based on sessionId
        var matchingClients = clients.filter(function (client) {
            return client.sessionId === sessionId;
        });
        if (matchingClients.length > 1) {
            throw new Error("Multiple clients with the same sessionId");
        }
        if (matchingClients.length === 0) {
            clients.push({
                sessionId: sessionId,
                socketId: socket.id
            });
        }
        else {
            matchingClients[0].socketId = socket.id;
        }
    });
    // clear client after 1 hour
    socket.on('disconnect', function () {
        console.log('user disconnected');
        setTimeout(function () {
            try {
                clients = clients.filter(function (client) {
                    return client.socketId !== socket.id;
                });
            }
            catch (error) {
                console.log("Failed to remove client after timeout; socket Id: ".concat(socket.id));
            }
        }, 3600000);
    });
});
app.get('/weather-app', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname + '/public/views/weather-app.html'));
});
app.get('/chat-app', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname + '/public/views/chat-app.html'));
});
app.get('/about', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname + '/public/views/about.html'));
});
app.get('/help', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname + '/public/views/help.html'));
});
server.listen(port, function () {
    console.log("Server is up on port ".concat(port, "!"));
});
function sendMessageToClient(socketId, message) {
    io.to(socketId).emit('loadingMessage', {
        body: message
    });
}
