/**
 * Created by zhengpeng on 2017/5/15.
 */

//引入express
var express = require('express');
//path
var path = require('path');
//cookieParser
var cookieParser = require('cookie-parser');
//session
var session = require('express-session');
//日志模块
var  morgan = require('morgan');
//app
var app = express();


//中间件
app.set('views','./views');
app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'static')));
app.use(cookieParser());
app.use(session({
    secret: 'weiqi cat',
    resave: false,
    saveUninitialized: true
}));
//日志
app.use(morgan('dev'));


//前台用户页面
const master = require('./server/router/master');
app.use('/', master);

//后台管理系统
const ops = require('./server/router/ops');
app.use('/ops', ops);

//ajax
const api = require('./server/ajax/index');
app.use('/api', api);

app.get('*', function(req, res){
    res.redirect('/')
});

var server = app.listen(8080,function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});