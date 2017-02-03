var webpack = require('webpack');
var UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var path = require('path');
var env = require('yargs').argv.mode;

var libraryName = 'PostRPC';

var plugins = [], outputSuffix;

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({
  	minimize: true,
  	mangle: {
  		except: ['$super', '$', 'exports', 'require']
  	}
  }));
  outputSuffix = '.min.js';
} else {
  outputSuffix = '.js';
}

var config = {
	entry: {
		Client: __dirname + "/src/client.js",
		Server: __dirname + "/src/server.js"
	},
	devtool: 'source-map',
	output: {
		path: path.join(__dirname, "/lib"),
        filename: libraryName + ".[name]" + outputSuffix,
        library: [libraryName, "[name]"],
	   	libraryTarget: 'umd',
    	umdNamedDefine: true
	},
  module: {
    loaders: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    root: path.resolve('./src'),
    extensions: ['', '.js']
  },
  plugins: plugins
};

module.exports = config;
