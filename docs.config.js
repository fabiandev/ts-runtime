const path = require('path');
const webpack = require('webpack');
const pkg = require('./package.json');
const config = {};

config.version = pkg.version;

config.paths = {
  src: 'src/docs',
  dest: 'docs'
};

config.monaco = {
  version: pkg.devDependencies['monaco-editor'],
  entry: 'vs/editor/editor.main',
  get base() {
    return `https://unpkg.com/monaco-editor@${this.version}/min`;
  },
  get location() {
    return `https://unpkg.com/monaco-editor@${this.version}/min/vs`
  },
  get loader() {
    return `${this.location}/loader.js`
  }
};

config.bundleName = 'app.js';

config.typescript = {
  configFileName: 'src/docs/tsconfig.json'
};

config.replace = {
  VERSION: config.version,
  BUNDLE_NAME: config.bundleName,
  MONACO_VERSION: config.monaco.version,
  MONACO_ENTRY: config.monaco.entry,
  MONACO_BASE: config.monaco.base,
  MONACO_LOCATION: config.monaco.location,
  MONACO_LOADER: config.monaco.loader
};

config.webpack = [{
  entry: {
    bundle: path.join(__dirname, `${config.paths.src}/index.ts`)
  },
  output: {
    filename: config.bundleName,
    path: path.join(__dirname, config.paths.dest)
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.tsx']
  },
  module: {
    rules: [
      {
        test: /^rimraf$/,
        use: 'null-loader'
      }, {
        test: /^pretty-time$/,
        use: 'null-loader'
      }, {
        test: /\.js$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.tsx?$/,
        exclude: /\.d\.ts$/,
        use: ["source-map-loader"],
        enforce: "pre"
      }, {
        test: /\.tsx?$/,
        exclude: /\.d\.ts$/,
        loader: 'ts-loader',
        options: config.typescript
      }, {
        test: /\.html/,
        use: 'raw-loader'
      }
    ]
  },
  node: {
    path: true,
    fs: 'empty',
    module: 'empty'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({sourceMap: true}),
    new webpack.DefinePlugin(Object.keys(config.replace).reduce(function(previous, current) {
      previous[current] = JSON.stringify(config.replace[current]);
      return previous;
    }, {}))
  ]
}, {
  entry: path.join(__dirname, 'src/lib/index.ts'),
  output: {
    filename: 'ts-runtime.lib.js',
    path: path.join(__dirname, 'docs'),
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
  plugins: [
    new webpack.optimize.UglifyJsPlugin({sourceMap: true})
  ]
}];

module.exports = config;
