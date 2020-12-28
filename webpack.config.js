const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    entry: {
        main: './app.js',
        menu: './js/menu.js',

    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    resolve: {
        alias: {
         //   images: path.resolve(__dirname, 'src/img/')
        }
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                exclude: [
                    path.resolve(__dirname, './node_modules'),
                ],
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                    },
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'resolve-url-loader',
                    {
                        loader: 'sass-loader',
                        options: {
                            // Prefer `dart-sass`
                            implementation: require('sass'),
                        },
                    },
                ],
            }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            filename: 'index.html',
            template: './index.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'about.html',
            template: './about.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'foundry.html',
            template: './foundry.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'mechanical.html',
            template: './mechanical.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'modal.html',
            template: './modal.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'term.html',
            template: './term.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'control.html',
            template: './control.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'delivery.html',
            template: './delivery.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'cert.html',
            template: './cert.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'career.html',
            template: './career.html'
        }),
        new HTMLWebpackPlugin({
            filename: '15_120.html',
            template: './15_120.html'
        }),
        new HTMLWebpackPlugin({
            filename: '5_15.html',
            template: './5_15.html'
        }),
        new HTMLWebpackPlugin({
            filename: '5.html',
            template: './5.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'snaps.html',
            template: './snaps.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'blog.html',
            template: './blog.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'contacts.html',
            template: './contacts.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'leaders.html',
            template: './leaders.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'managers.html',
            template: './managers.html'
        }),
        new HTMLWebpackPlugin({
            filename: 'article.html',
            template: './article.html'
        }),


        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
               from: path.resolve(__dirname, 'src/img'),
               to: path.resolve(__dirname, 'dist/img')
          }
        ]),
        new MiniCssExtractPlugin({
            filename: 'style.css'
        })
    ]
    //надо как-то так переделать plugins: [
    //     ...PAGES.map((page) => new HtmlWebpackPlugin({
    //       template: `${PAGES_DIR}/${page}`,
    //       filename: `./${page}`,
    //       inject: true,
    //     })),
    //   ],
};
