/* global __dirname, require, module*/

const webpack = require('webpack')
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
const path = require('path')
const env = require('yargs').argv.env // use --env with webpack 2

var libraryName = 'PostRPC'

let suffix
let plugins = []

module.exports = function(env) {
	env = env || 'dev'
	if (env === 'prod') {
	  plugins.push(new UglifyJsPlugin({ minimize: true }))
	  suffix = '.min.js'
	} else {
	  suffix = '.js'
	}

  return {
		entry: {
			Client: __dirname + "/src/client.js",
			Server: __dirname + "/src/server.js"
		},
	  devtool: 'source-map',
	  output: {
			path: path.join(__dirname, "/lib"),
			filename: libraryName + ".[name]"+suffix,
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
		plugins: plugins
	}
}
