/* global __dirname, require, module*/

const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2

var libraryName = 'PostRPC';

let outputFile;

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({ minimize: true }));
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

const config = {
	entry: {
		Client: __dirname + "/src/client.js",
		Server: __dirname + "/src/server.js"
	},
  devtool: 'source-map',
  output: {
		path: path.join(__dirname, "/lib"),
		filename: libraryName + ".[name].js",
		library: [libraryName, "[name]"],
		libraryTarget: 'umd',
		umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
	plugins: [
		// new webpack.DefinePlugin({
		// 	ENV: require(path.join(__dirname, './env/', env))
		// })
	]
};

module.exports = config;