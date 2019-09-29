const path = require('path');

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
      vue: 'vue/dist/vue.esm.js'
    }
  }
};
