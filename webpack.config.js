// utils and node.js api
const fs = require('fs')
const sh = require('shelljs')
const _ = require('lodash')
const os = require('os')
const path = require('path')
// webpack import
const webpack = require('webpack')
const compiler = webpack.compiler
const HappyPack = require('happypack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
// webpack init
const happyThreadPool = HappyPack.ThreadPool({
  size: os.cpus().length
})
// function declare
const utils = {
  getCrtPath: relativePath => {
    return path.join(__dirname, relativePath)
  }
}
function createStyleUseObject (isModule = true) {
  return [
		{ loader: MiniCssExtractPlugin.loader },
    {
      loader: 'css-loader',
      query: isModule
				? { modules: true, localIdentName: '[name]__[local]___[hash:base64:5]' }
				: { modules: false }
    },
		{ loader: 'less-loader' }
  ]
}
// variables declare
var babelrc = JSON.parse(fs.readFileSync(utils.getCrtPath('.babelrc'),'UTF-8'));
var entryobj = {}
var htmlPlugins = []
var distdir = utils.getCrtPath('dist')
// add page by read dir
var pagesPath = utils.getCrtPath('./pages')
var pagesArr = fs.readdirSync(pagesPath)
_.forEach(pagesArr, eachPage => {
  var chunkName = eachPage
  var indexHtmlPath = utils.getCrtPath(`./pages/${chunkName}/index.html`)
  var indexPageArg = {
    template: indexHtmlPath,
    filename: utils.getCrtPath(`./dist/${chunkName}/index.html`),
    chunks: [chunkName]
  }
  var indexPagePlugin = new HtmlWebpackPlugin(indexPageArg)
  htmlPlugins.push(indexPagePlugin)
  entryobj[chunkName] = utils.getCrtPath(`./pages/${chunkName}/index.js`)
})

module.exports = mode => {
  var isDev = mode === 'dev'
  // environment
  process.env.NODE_ENV = isDev ? 'development' : 'production'
  var contentHashValue = isDev ? 'hash' : 'contenthash'
  var webpackConfig = {
    devServer: {
      inline: true,
      hot: true,
      inline: true,
      progress: true,
      publicPath: '/',
      contentBase: utils.getCrtPath('dist'),
      compress: true,
      port: 1234
    },
    entry: entryobj,
    resolve: {
      extensions: ['.js', '.vue', '.json', '.ts'],
      alias: {}
    },
    plugins: _.filter(
      [
        new VueLoaderPlugin(),
        new CleanWebpackPlugin([distdir], {
          allowExternal: true
        }),
        ...htmlPlugins,
        new MiniCssExtractPlugin({
          filename: '[name].[' + contentHashValue + '].css'
        }),
        new HappyPack({
          id: 'happybabel',
          loaders: ['babel-loader', 'xml-loader'],
          threadPool: happyThreadPool,
          verbose: true
        })
      ],
			(x, d, n) => {
  return !_.isNil(x)
}
		),
    output: {
      filename: '[name].[' + contentHashValue + '].js',
      publicPath: '../',
      path: distdir
    },
    optimization: {},
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.(ts|tsx)$/,
          use: [
            {
              loader: 'babel-loader',
              options: babelrc
            },
            {
              loader: 'ts-loader'
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader
            },
            {
              loader: 'css-loader'
            }
          ]
        },
        {
          test: /\.less$/,
          exclude: /antd/,
          use: createStyleUseObject()
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /(node_modules|bower_components|link_react)/,
          use: [
            {
              loader: 'babel-loader',
              options: babelrc
            }
          ]
        },
        {
          test: /\.(png|svg|jpg|gif|jpeg)$/,
          use: ['file-loader']
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '../[name].[ext]'
              }
            }
          ]
        }
      ]
    }
  }

  return webpackConfig
}
