/**
 * Created by zhengpeng on 2017/5/22.
 */

//上传插件
const multer = require('../../configure/upload');
//sql
const workSql = require('../sql');

const express = require('express');
const router = express.Router();
//日期
const moment = require('moment');
//missionWork
const {getMissObj} = require('../router/master');

// 该路由使用的中间件
router.use(function timeLog(req, res, next) {
    console.log('ajax-Time: ', moment().format('YYYY-MM-DD HH:mm:ss'));
    next();
});

//上传
router.post('/sgfUpload',multer.any(), function(req, res) {
    workSql.saveQuestion(req,function (str) {
        res.send({sgf:str});
    });
});

//请求sgf数据
router.post('/getSgf', function(req, res) {
    workSql.getQuestionContent(req,function (str) {
        res.send({code:200,message:'成功',data:str});
    });
});

//保存练习记录
router.post('/saveLastRecord', function(req, res) {
    workSql.saveLastRecord(req,function (str) {
        res.send({code:200,message:'成功',data:str});
    });
});

//更新剩余时间
router.post('/updateTodayTime', function(req, res) {
    workSql.updateTodayTime(req,function (str) {
        res.send({code:200,message:'成功',data:str});
    });
});

//保存答题记录
router.post('/saveHomeWork', function(req, res) {
    workSql.saveHomeWork(req,function (str) {
        if(str.answerRight == 0){
            workSql.saveMistake(req,str,function () {});
        }
        res.send({code:200,message:'成功',data:""});
    });
});

//闯关模式答题记录
router.post('/saveMissionWork',function (req,res) {
    var userID = req.session.userID;
    var missObj = getMissObj();
    if(userID && missObj[userID] && missObj[userID].uuid) {
        var missionID  = missObj[userID].uuid;
        workSql.saveMissionWork(req,missionID, function (str) {
            if (str.answerRight == 0) {
                workSql.saveMistake(req, str, function () {
                });
            }
            res.send({code: 200, message: '成功', data: ""});
        });
    }
});

//注册
router.post('/register',function (req,res) {
    workSql.register(req,function (str) {
        res.send(str);
    });
});

//登陆
router.post('/login',function (req,res) {
    workSql.login(req,function (str) {
        res.send(str);
    });
});

//退出登陆
router.get('/loginOut',function (req,res) {
     delete req.session.userID;
     res.send({
         code : 200,
         message : '退出成功',
         data : ""
     })
});

//修改错题
router.post('/modifyError',function (req,res) {
    workSql.modifyError(req,function (str) {
        res.send(str);
    });
});


//更新用户信息
router.post('/updateUserInformation',function (req,res) {
    workSql.updateUserInformation(req,function (str) {
        res.send(str);
    });
});

module.exports = router;