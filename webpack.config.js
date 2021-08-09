const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        main: path.resolve(__dirname, './index.js'),
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
          { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] },
          { test: /\.(js)$/, use: 'babel-loader', exclude: /(node_modules)/ },
        ],
      },
    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
        }),
    ],
}