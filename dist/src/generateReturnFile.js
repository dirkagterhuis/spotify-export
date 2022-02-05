"use strict";
exports.__esModule = true;
exports.generateReturnFile = void 0;
function generateReturnFile(playlists, fileType) {
    switch (fileType) {
        case 'json':
            return "data:text/json;charset=utf-8, ".concat(encodeURIComponent(JSON.stringify(playlists, null, 2)));
        case 'csv':
            return "data:text/csv;charset=utf-8, ".concat(encodeURIComponent(csvFromJSON(playlists)));
        default:
            throw new Error("Unexpected fileType: ".concat(fileType));
    }
}
exports.generateReturnFile = generateReturnFile;
function csvFromJSON(playlists) {
    var headers = [
        'playlist id',
        'playlist Name',
        'playlist owner name',
        'playlist owner type',
        'playlist is collaborative',
        'playlist href',
        'playlist description',
        'track id,track name',
        'track artist name(s)',
        'track album name',
        'track href',
    ];
    var ret = headers.join(',');
    for (var i = 0; i < playlists.length; i++) {
        var playlist = playlists[i];
        var items = playlist.items;
        // in dev, not all playlists have items because not all tracks are retrieved for all playlists
        if (!items) {
            continue;
        }
        for (var j = 0; j < items.length; j++) {
            var track = items[j].track;
            if (track === null) {
                continue;
            }
            var artists = track.artists;
            var artistNames = '';
            for (var k = 0; k < artists.length; k++) {
                artistNames += artists[k].name;
            }
            var retNewLine = [
                playlist.id,
                playlist.name,
                playlist.owner.display_name,
                playlist.owner.type,
                String(playlist.collaborative),
                playlist.href,
                playlist.description,
                track.id,
                track.name,
                artistNames,
                track.album.name,
                track.href,
            ];
            // Escape comma's in .csv
            for (var l = 0; l < retNewLine.length; l++) {
                // TODO: replaceAll not always supported. Read up on: https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
                // retNewLine[l].replaceAll(',', '","')
            }
            ret += "\n".concat(retNewLine.join(','));
        }
    }
    return ret;
}
