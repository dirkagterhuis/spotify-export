"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.config = void 0;
var fs_1 = __importDefault(require("fs"));
var js_yaml_1 = __importDefault(require("js-yaml"));
// Only set localConfig in dev
var localConfig;
if (process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'dev') {
    try {
        localConfig = js_yaml_1["default"].load(fs_1["default"].readFileSync('./local.yml', 'utf8'));
    }
    catch (e) {
        throw new Error("In dev environment, localConfig isn't configured correctly: ".concat(e.message));
    }
}
exports.config = {
    env: process.env.NODE_ENV || 'dev',
    baseUrl: process.env.NODE_ENV ? 'http://spotifyexport.com' : 'http://localhost:8000',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret: process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret
};
