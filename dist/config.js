"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.config = void 0;
var fs_1 = __importDefault(require("fs"));
var js_yaml_1 = __importDefault(require("js-yaml"));
//TODO only do this when localy.yml is there
var localConfig;
try {
    localConfig = js_yaml_1["default"].load(fs_1["default"].readFileSync('./local.yml', 'utf8'));
}
catch (e) {
    console.log(e);
}
exports.config = {
    env: process.env.NODE_ENV || 'dev',
    spotifyClientId: process.env.SPOTIFY_APP_CLIENT_ID || localConfig.localSpotifyAppClientId,
    spotifyClientSecret: process.env.SPOTIFY_APP_CLIENT_SECRET || localConfig.localSpotifyAppClientSecret
};
