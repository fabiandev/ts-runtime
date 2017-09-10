const path = require('path');
const webpack = require('webpack');

const config = {};

config.paths = {
  src: '../',
  dest: '../../../dist/lib'
};

config.typescript = {
  configFile: './tsconfig.json'
};

config.webpack = [
  {
    entry: {
      'ts-runtime.lib': path.normalize(path.join(__dirname, config.paths.src, 'index.ts')),
      'ts-runtime.lib.min': path.normalize(path.join(__dirname, config.paths.src, 'index.ts'))
    },
    output: {
      filename: '[name].js',
      path: path.normalize(path.join(__dirname, config.paths.dest)),
      library: {
        root: 'tsr',
        amd: 'ts-runtime/lib',
        commonjs: 'ts-runtime/lib'
      },
      libraryTarget: 'umd'
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
          test: /\.tsx?$/,
          use: ["source-map-loader"],
          enforce: "pre"
        }, {
          test: /\.tsx?$/,
          exclude: /\.d\.ts$/,
          loader: 'ts-loader',
          options: config.typescript
        }
      ]
    },
    plugins: [new webpack.optimize.UglifyJsPlugin({include: /\.min\.js$/, sourceMap: true})]
  }
];

module.exports = config.webpack;
