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
var config_1 = require("../config");
var authorization_1 = require("./functions/authorization");
var spotifyApiUtils_1 = require("./functions/spotifyApiUtils");
var generateReturnFile_1 = require("./functions/generateReturnFile");
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var socket_io_1 = require("socket.io");
var cors_1 = __importDefault(require("cors"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var ejs = __importStar(require("ejs"));
var app = (0, express_1["default"])();
var port = process.env.PORT || 8000;
var server = http_1["default"].createServer(app);
var io = new socket_io_1.Server(server);
// TODO This is probably a bad idea if this thing scales. Probably better use npm-cache or Redis, or a database, when that happens.
// This implementation also inhibits making this file more modular
var clients = [];
// Setup static directory to serve.
app.use(express_1["default"].static(path_1["default"].join(__dirname, '../public')));
app.use((0, cors_1["default"])({
    origin: config_1.config.baseUrl
}));
// Only want to use html with some variables -> using EJS.
app.engine('html', ejs.renderFile);
app.get('/', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname, '../public/views/index.html'));
});
app.get('/login', function (req, res) {
    var client = clients.find(function (client) {
        return client.sessionId === req.query.sessionId;
    });
    if (!client) {
        throw new Error("Request not coming from an active session.");
    }
    client.fileType = req.query.fileType;
    res.redirect((0, authorization_1.login)(client));
});
app.get('/spotify-app-callback', function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var code, state, error, authToken, client, playlists;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // In order to remove the code from the url.
                    res.redirect('/');
                    code = req.query.code || null;
                    state = req.query.state || null;
                    error = req.query.error || null;
                    return [4 /*yield*/, (0, authorization_1.getAuthToken)(code)
                        // Ideally, you'd also get the sessionId in the callback and get the client.state from there (not possible), 
                        // or redirect to a new page and get the session id. But, then the user would have to click again -> use State to match.
                    ];
                case 1:
                    authToken = _a.sent();
                    client = clients.find(function (client) {
                        return client.state === state;
                    });
                    io.to(client.socketId).emit('initiateLoadingMessages');
                    (0, authorization_1.validateState)(client, state, sendLoadingMessageToClient);
                    sendLoadingMessageToClient(client.socketId, "Succesfully signed in to your Spotify Account");
                    return [4 /*yield*/, (0, spotifyApiUtils_1.getPlaylists)(authToken, 'https://api.spotify.com/v1/me/playlists', [])];
                case 2:
                    playlists = _a.sent();
                    sendLoadingMessageToClient(client.socketId, "Retrieved ".concat(playlists.length, " playlists from your Spotify Account"));
                    return [4 /*yield*/, (0, spotifyApiUtils_1.getItemsByPlaylists)(authToken, playlists, sendLoadingMessageToClient, client.socketId)
                        // Only do this when running locally in order to store the file directly.
                    ];
                case 3:
                    _a.sent();
                    // Only do this when running locally in order to store the file directly.
                    if (port === 8000) {
                        fs_1["default"].writeFileSync('../playlists.json', JSON.stringify(playlists, null, 2));
                    }
                    io.to(client.socketId).emit('readyForDownload', {
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
    socket.on('sessionId', function (event) {
        if (event.body === undefined) {
            newClient(socket.id);
            return;
        }
        var sessionId = event.body;
        var matchingClients = clients.filter(function (client) {
            return client.sessionId === sessionId;
        });
        if (matchingClients.length > 1) {
            var errorMessage = "Multiple clients with the same sessionId: ".concat(sessionId);
            console.log(errorMessage);
            throw new Error(errorMessage);
        }
        if (matchingClients.length === 0) {
            newClient(socket.id);
            return;
        }
        matchingClients[0].socketId = socket.id;
    });
    // Clear client after 1 hour.
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
app.get('/about', function (req, res) {
    res.sendFile(path_1["default"].join(__dirname, '../public/views/about.html'));
});
server.listen(port, function () {
    console.log("Server is up on port ".concat(port, "!"));
});
function sendLoadingMessageToClient(socketId, message) {
    io.to(socketId).emit('loadingMessage', {
        body: message
    });
}
function newClient(socketId) {
    var sessionId = (Math.random() + 1).toString(36).substring(7);
    console.log("Getting new session id: ".concat(sessionId));
    clients.push({
        sessionId: sessionId,
        socketId: socketId
    });
    io.to(socketId).emit('newSessionId', {
        body: sessionId
    });
}
