/**
 * Created by zhengpeng on 2017/5/22.
 */
const express = require('express');
const router = express.Router();
//日期
const moment = require('moment');

// 该路由使用的中间件
router.use(function timeLog(req, res, next) {
    console.log('log-Time: ', moment().format('YYYY-MM-DD HH:mm:ss'));
    next();
});

// 定义后台管理主页的路由
router.get('/', function(req, res) {
    res.render('ops/ops.ejs');
});

module.exports = router;