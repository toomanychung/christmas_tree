/* eslint-disable global-require */
const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: {
    main: './src/main-prebuild.js',
    admin: './src/admin-prebuild.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public/javascripts')
  },
  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm.js',
      vue$: 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
    }
  },
  plugins: [
    new Dotenv()
  ],
  module: {
    rules: [
      {
        test: /\.s(c|a)ss$|\.css$/,
        use: [
          'vue-style-loader',
          'style-loader',
          'css-loader',
          'sass-loader'
        ],
      },
    ],
  }

};
