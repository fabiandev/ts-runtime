const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: path.join(__dirname, 'docs/index.ts'),
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'docs')
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
      }, {
        test: /\.d\.ts$/,
        use: 'raw-loader'
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'node_modules/monaco-editor/min/vs',
        to: 'vs'
      }, {
        from: 'node_modules/monaco-editor/min-maps/vs',
        to: 'min-maps/vs'
      }
    ]),
    new UglifyJsPlugin({sourceMap: true})
  ],
  node: {
    fs: 'empty',
    module: 'empty'
  }
};
