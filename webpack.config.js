const path = require('path');
//const fs = require('fs');

// var entryFileObj = {},outputFileObj = {};
// //读取文件目录
// var filePath = path.resolve()+'/static/js/master';
//
// readFire(function(){
//
// });
// function readFire(callback) {
//     fs.readdir(filePath,function(err,files) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         var filesLength =  files.length,filesIndex = 0;
//         files.forEach(function(filename){
//             fs.stat(path.join(filePath,filename),function(err, stats){
//                 filesIndex++;
//                 if(stats.isFile()){
//                     var name = filename.split('.')[0];
//                     entryFileObj[name] = path.join(filePath,filename);
//                 }
//                 if(filesIndex >= filesLength){
//                     callback();
//                 }
//             })
//
//         });
//         outputFileObj = {
//             filename: '[name].min.js',
//             path: path.join(filePath)
//         }
//     });
// }
module.exports = () => ({
    entry: './modules/exports/sgf.js',

    output: {
        filename: 'static/js/sgf.min.js',
        path: __dirname
    },

    module: {
        loaders: [
            {
                loader: 'babel-loader',
                exclude: /node_modules/,
                test: /\.js$/,
                query: {
                    presets: [
                        'es2015', 'stage-0'
                    ],
                    plugins: ['transform-runtime']
                }
            }
        ]
    },

    resolve: {
        alias: {
            'fs$': path.join(__dirname, 'modules/shims/fs'),
            'electron$': path.join(__dirname, 'modules/shims/electron'),
            'iconv-lite$': path.join(__dirname, 'modules/shims/iconv-lite'),
            'jschardet$': path.join(__dirname, 'modules/shims/jschardet'),
            'moment$': path.join(__dirname, 'modules/shims/empty'),
            'argv-split$': path.join(__dirname, 'modules/shims/empty'),
            '../modules/gtp$': path.join(__dirname, 'modules/shims/empty'),
            '../data/menu$': path.join(__dirname, 'modules/shims/empty'),

            './LeftSidebar$': path.join(__dirname, 'modules/shims/noop'),
            './drawers/PreferencesDrawer$': path.join(__dirname, 'modules/shims/noop'),
            './drawers/CleanMarkupDrawer$': path.join(__dirname, 'modules/shims/noop'),
            './bars/AutoplayBar$': path.join(__dirname, 'modules/shims/noop'),
            './bars/GuessBar$': path.join(__dirname, 'modules/shims/noop')
        }
    }
});
