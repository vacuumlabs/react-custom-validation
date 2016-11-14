const path = require('path')
const webpack = require('webpack')

const ABSOLUTE_BASE = path.normalize(path.join(__dirname, '..'))
const NODE_MODULES_DIR = path.join(ABSOLUTE_BASE, 'node_modules')

module.exports = {
  entry: [
    './index.js',
    'webpack-hot-middleware/client',
  ],
  devtool: 'cheap-source-map',
  output: {
    path: __dirname,
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: NODE_MODULES_DIR,
        loader: 'babel',
        query: {
          cacheDirectory: false,
          presets: ['es2015', 'react', 'stage-0'],
        }
      },
    ]
  }
}
