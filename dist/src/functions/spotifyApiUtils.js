"use strict";
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
exports.getItemsByPlaylists = exports.getPlaylists = void 0;
var axios_1 = __importDefault(require("axios"));
var config_1 = require("../../config");
var rateLimitingTimeout = 100;
function getPlaylists(token, url, playlists) {
    return __awaiter(this, void 0, void 0, function () {
        var totalToGet, getPlaylistResponse, next, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].get(url, {
                            headers: {
                                Authorization: 'Bearer ' + token,
                                Origin: config_1.config.baseUrl
                            },
                            params: {
                                limit: 50
                            }
                        })];
                case 1:
                    getPlaylistResponse = _a.sent();
                    if (getPlaylistResponse.status === 200) {
                        playlists.push.apply(playlists, getPlaylistResponse.data.items);
                        totalToGet = getPlaylistResponse.data.total;
                    }
                    next = getPlaylistResponse.data.next;
                    if (next === null) {
                        if (totalToGet !== playlists.length) {
                            throw new Error("Expected: ".concat(totalToGet, " playlists; retrieved: ").concat(playlists.length));
                        }
                        return [2 /*return*/, playlists];
                    }
                    console.log("Getting new page of playlists. Current size: ".concat(playlists.length));
                    return [4 /*yield*/, getPlaylists(token, next, playlists)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.log("Error: ".concat(JSON.stringify(error_1.message)));
                    throw new Error(error_1);
                case 4: return [2 /*return*/, playlists];
            }
        });
    });
}
exports.getPlaylists = getPlaylists;
function getItemsByPlaylists(token, playlists, sendMessageToClient, socketId) {
    return __awaiter(this, void 0, void 0, function () {
        var numberOfPlaylistsToGet, i, playlistId, url, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("Getting all tracks for ".concat(playlists.length, " playlists."));
                    numberOfPlaylistsToGet = process.env.PORT ? playlists.length : 10;
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < numberOfPlaylistsToGet)) return [3 /*break*/, 4];
                    console.log("Getting tracks for playlist #".concat((i + 1).toString().padStart(3, '0'), " out of ").concat(playlists.length, ": ").concat(playlists[i].name));
                    sendMessageToClient(socketId, "Getting tracks for playlist #".concat((i + 1).toString().padStart(3, '0'), " out of ").concat(playlists.length, ": ").concat(playlists[i].name));
                    playlistId = playlists[i].id;
                    url = "https://api.spotify.com/v1/playlists/".concat(playlistId, "/tracks");
                    _a = playlists[i];
                    return [4 /*yield*/, getItemsByPlaylist(token, url, [])];
                case 2:
                    _a.items = _b.sent();
                    _b.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("Done.");
                    return [2 /*return*/];
            }
        });
    });
}
exports.getItemsByPlaylists = getItemsByPlaylists;
function getItemsByPlaylist(token, url, playlistItems) {
    return __awaiter(this, void 0, void 0, function () {
        var totalToGet, getPlaylistItemResponse, next, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, axios_1["default"].get(url, {
                            headers: {
                                Authorization: 'Bearer ' + token,
                                Origin: config_1.config.baseUrl
                            },
                            params: {
                                limit: 50,
                                // See https://developer.spotify.com/documentation/web-api/reference/#/operations/get-track for all fields.
                                // Test fields here with token: https://developer.spotify.com/console/get-playlist-tracks/.
                                fields: 'total,next,items(track(id,name,album.name,artists(name),href))'
                            }
                        })];
                case 1:
                    getPlaylistItemResponse = _a.sent();
                    if (getPlaylistItemResponse.status === 200) {
                        playlistItems.push.apply(playlistItems, getPlaylistItemResponse.data.items);
                        totalToGet = getPlaylistItemResponse.data.total;
                    }
                    next = getPlaylistItemResponse.data.next;
                    if (next === null) {
                        if (totalToGet !== playlistItems.length) {
                            throw new Error("Expected: ".concat(totalToGet, " playlist items; retrieved: ").concat(playlistItems.length));
                        }
                        return [2 /*return*/, playlistItems];
                    }
                    // Timeout needed to prevent rate limiting issues enforced by Spotify.
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, rateLimitingTimeout); })];
                case 2:
                    // Timeout needed to prevent rate limiting issues enforced by Spotify.
                    _a.sent();
                    return [4 /*yield*/, getItemsByPlaylist(token, next, playlistItems)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    console.log("Error: ".concat(JSON.stringify(error_2.message)));
                    console.log("Error response headers: ".concat(JSON.stringify(error_2.response.headers)));
                    throw new Error(error_2);
                case 5: return [2 /*return*/, playlistItems];
            }
        });
    });
}
