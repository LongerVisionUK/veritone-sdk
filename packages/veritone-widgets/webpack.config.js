const path = require('path');

module.exports = {
  entry: { 'veritone-widgets': path.join(__dirname, 'src/build-entry.js') },
  output: {
    filename: 'dist/bundle.js',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  resolve: {
    alias: {
      // helpers: path.join(__dirname, 'src/helpers'),
      // components: path.join(__dirname, 'src/components'),
      // images: path.join(__dirname, 'src/resources/images'),
    },
  },
  module: {
    // noParse: [],
    rules: [
      // JavaScript / ES6
      {
        test: /\.jsx?$/,
        include: path.resolve('./src'),
        loader: 'babel-loader'
      },
      {
        test: /\.scss$/,
        loaders: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[local]--[hash:base64:5]'
            }
          },
          'sass-loader'
        ],
        include: path.resolve('./src')
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        loader: 'url-loader',
        query: {
          limit: 8192,
          name: 'images/[name].[ext]?[hash]'
        }
      }
    ]
  }
};
