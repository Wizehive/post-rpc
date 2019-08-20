/* global __dirname, require, module*/

const webpack = require('webpack')
const path = require('path')

const libraryName = 'PostRPC'
const { POSTRPC_SERVER_OUTPUT_PATH } = process.env

module.exports = ({ env = 'dev', name }) => {
  const outputPath = (name === 'server' && POSTRPC_SERVER_OUTPUT_PATH) || path.join(__dirname, 'packages', name, 'dist')
  const suffix = env === 'prod' ? '.min.js' : '.js'

  return {
    mode: env === 'prod' ? 'production' : 'development',
    entry: path.join(__dirname, 'packages', name, 'src', name) + '.js',
    devtool: env !== 'prod' && 'source-map',
    optimization: {
      minimize: env === 'prod'
    },
    output: {
      path: outputPath,
      filename: `${libraryName}.${capitalize(name)}${suffix}`,
      library: [libraryName, capitalize(name)],
      libraryExport: 'default',
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
      modules: [
        path.resolve('../../node_modules'),
        path.resolve('./node_modules'),
        path.resolve('./src'),
        path.resolve(`./packages/${name}/node_modules`)
      ],
      extensions: ['.json', '.js']
    },
    plugins: []
  }
}

/**
 * 
 * @param {string} string
 * 
 * @returns {string} capitalized string
 */
function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
