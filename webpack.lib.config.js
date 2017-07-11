const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, 'src/lib/index.ts'),
  output: {
    filename: 'ts-runtime.lib.js',
    path: path.join(__dirname, 'docs/assets'),
    library: 't',
    libraryTarget: 'window'
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      }, {
        test: /\.tsx?$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.tsx?$/,
        exclude: /\.d\.ts$/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            sourceMap: true,
            rootDir: 'docs',
            declaration: false,
            "module": "commonjs"
          }
        }
      }
    ]
  },
  plugins: [
    new UglifyJsPlugin({sourceMap: true})
  ]
};
