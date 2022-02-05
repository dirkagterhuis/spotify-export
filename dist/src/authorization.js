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
exports.getAuthToken = exports.getSpotifyLoginUrl = exports.generateState = void 0;
// Uses Spotify OAuth flow for web apps: https://developer.spotify.com/documentation/general/guides/authorization/code-flow/
var config_1 = require("../config");
var axios_1 = __importDefault(require("axios"));
var url_1 = require("url");
var redirect_uri = 'http://localhost:8000/spotify-app-callback'; //TODO: make this dependent on environment // the redirect uri should be added to the allowed redirect URI's on https://developer.spotify.com/
function generateState() {
    return (Math.random() + 1).toString(36).substring(7);
}
exports.generateState = generateState;
function getSpotifyLoginUrl(state) {
    var loginUrl = 'https://accounts.spotify.com/authorize?' +
        new url_1.URLSearchParams({
            response_type: 'code',
            client_id: config_1.config.spotifyClientId,
            scope: 'playlist-read-private',
            redirect_uri: redirect_uri,
            state: state
        });
    return loginUrl;
}
exports.getSpotifyLoginUrl = getSpotifyLoginUrl;
function getAuthToken(code) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBody, getTokenResponse, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestBody = new url_1.URLSearchParams({
                        code: code,
                        redirect_uri: redirect_uri,
                        grant_type: 'authorization_code'
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, axios_1["default"].post('https://accounts.spotify.com/api/token', requestBody.toString(), {
                            method: 'post',
                            headers: {
                                Authorization: 'Basic ' +
                                    Buffer.from(config_1.config.spotifyClientId + ':' + config_1.config.spotifyClientSecret).toString('base64'),
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        })];
                case 2:
                    getTokenResponse = _a.sent();
                    if (getTokenResponse.status === 200) {
                        data = getTokenResponse.data;
                        console.log('token: ' + JSON.stringify(data));
                        return [2 /*return*/, data.access_token];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.log("Error: ".concat(JSON.stringify(error_1.message)));
                    throw new Error(error_1);
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.getAuthToken = getAuthToken;
