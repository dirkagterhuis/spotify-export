import path from 'path'
import { Configuration } from 'webpack'

const config: Configuration = {
  entry: './index.ts',
  module: {
    rules: [
      {
        test: /\.(ts|js)?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.html'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  }
}

export default config