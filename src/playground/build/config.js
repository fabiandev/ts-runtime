const path = require('path');
const webpack = require('webpack');
const pkg = require('../../../package.json');
const config = {};

config.version = pkg.version;

config.paths = {
  src: '../',
  dest: '../../../docs',
  root: '../../../',
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
  app: {
    allowTsInNodeModules: true,
    configFile: path.resolve(__dirname, '../tsconfig.json'),
    transpileOnly: true
  },
  lib: {
    configFile: path.resolve(__dirname, '../tsconfig.lib.json'),
    transpileOnly: true
  }
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
  mode: 'production',
  stats: {
    children: true
  },
  entry: {
    bundle: path.normalize(path.join(__dirname, config.paths.src, 'index.ts'))
  },
  output: {
    filename: config.bundleName,
    chunkFilename: '[chunkhash].[name].js',
    path: path.join(__dirname, config.paths.dest)
  },
  performance: {
    maxEntrypointSize: 250000,
    maxAssetSize: 2560000
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.tsx'],
    alias: {
      'rimraf': false,
      'pretty-time': false,
      'commondir': path.resolve(__dirname, '../shims/commondir.js'),
    },
    fallback: {
      path: require.resolve('path-browserify'),
      fs: false,
      module: false,
      events: require.resolve('events/'),
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /\.d\.ts$/,
        loader: 'ts-loader',
        options: config.typescript.app
      },
      {
        test: /\.(js|d\.ts)$/,
        use: ['source-map-loader'],
        enforce: 'pre',
        exclude: /node_modules/
      },
      {
        test: /\.html/,
        type: 'asset/source'
      },
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.DefinePlugin(Object.keys(config.replace).reduce(function(previous, current) {
      previous[current] = JSON.stringify(config.replace[current]);
      return previous;
    }, {})),
    new webpack.ContextReplacementPlugin(
      /node_modules(\\|\/)typescript(\\|\/)lib/,
      path.join(__dirname, config.paths.src),
      {}
  )
  ],
}, {
  mode: 'production',
  stats: {
    children: true
  },
  entry: path.normalize(path.join(__dirname, config.paths.root, 'src/lib/index.ts')),
  output: {
    filename: 'ts-runtime.lib.js',
    path: path.normalize(path.join(__dirname, config.paths.root, 'docs')),
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
        test: /\.tsx?$/,
        exclude: /\.d\.ts$/,
        loader: 'ts-loader',
        options: config.typescript.lib
      },
      {
        test: /\.(js|tsc)$/,
        use: ['source-map-loader'],
        enforce: 'pre',
        exclude: /node_modules/
      }
    ]
  }
}];

module.exports = config;
