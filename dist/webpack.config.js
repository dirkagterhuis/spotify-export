"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var path_1 = __importDefault(require("path"));
var config = {
    entry: './index.ts',
    module: {
        rules: [
            {
                test: /\.(ts|js)?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.html']
    },
    output: {
        path: path_1["default"].resolve(__dirname, 'dist'),
        filename: '[name].js'
    }
};
exports["default"] = config;
