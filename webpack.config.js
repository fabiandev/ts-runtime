const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const pkg = require("./package.json");

module.exports = [
  {
    entry: {
      bundle: path.join(__dirname, 'docs/src/index.ts')
    },
    output: {
      filename: '[name].js',
      path: path.join(__dirname, 'docs')
    },
    devtool: 'source-map',
    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    },
    module: {
      rules: [
        {
          test: /^rimraf$/,
          use: 'null-loader'
        },
        {
          test: /^pretty-time$/,
          use: 'null-loader'
        },
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
          to: 'editor/min/vs'
        }, {
          from: 'node_modules/monaco-editor/min-maps/vs',
          to: 'editor/min-maps/vs'
        }
      ]),
      new UglifyJsPlugin({sourceMap: true}),
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(pkg.tsr.docs.version)
      })
    ],
    node: {
      path: true,
      fs: 'empty',
      module: 'empty'
    }
  }, {
    entry: {
      version: path.join(__dirname, 'docs/src/version.ts')
    },
    output: {
      library: 'VERSION',
      libraryTarget: 'window',
      filename: '[name].js',
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
      new UglifyJsPlugin({sourceMap: true}),
      new webpack.DefinePlugin({
        VERSION: JSON.stringify(pkg.tsr.docs.version)
      })
    ]
  }, {
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
    plugins: [new UglifyJsPlugin({sourceMap: true})]
  }
];
