const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background-with-nillion.js',
    popup: './src/popup-with-nillion.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser.js'),
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      assert: require.resolve('assert'),
      util: require.resolve('util'),
      url: require.resolve('url'),
      'node:crypto': require.resolve('crypto-browserify'),
      'node:stream': require.resolve('stream-browserify'),
      'node:buffer': require.resolve('buffer'),
      'node:process': require.resolve('process/browser.js'),
      'node:worker_threads': require.resolve('./src/stubs.js'),
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      worker_threads: false,
      'node:fs': false,
      'node:net': false,
      vm: false,
      'pino-pretty': false,
      pino: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, '');
      switch (mod) {
        case 'crypto':
          resource.request = 'crypto-browserify';
          break;
        case 'stream':
          resource.request = 'stream-browserify';
          break;
        case 'buffer':
          resource.request = 'buffer';
          break;
        case 'process':
          resource.request = 'process/browser.js';
          break;
        case 'worker_threads':
          resource.request = require.resolve('./src/stubs.js');
          break;
      }
    }),
    new webpack.NormalModuleReplacementPlugin(
      /^pino(-pretty)?$/,
      require.resolve('./src/stubs.js')
    ),

    // Copy static files to dist
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup-passwords.html', to: 'popup-passwords.html' },
        { from: 'popup-passwords.js', to: 'popup-passwords.js' },
        { from: 'content-script.js', to: 'content-script.js' },
        { from: 'pdm.png', to: 'pdm.png' },
      ],
    }),

    // Ignore all test files and key files from node_modules
    new webpack.IgnorePlugin({
      resourceRegExp: /test.*\.pem$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /.*\.pem$/,
      contextRegExp: /node_modules/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /test/,
      contextRegExp: /node_modules/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /\.test\./,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /__tests__/,
    }),
  ],
  mode: 'development',
};
