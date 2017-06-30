/**
 * Created by zhengpeng on 2017/5/22.
 */
const express = require('express');
const router = express.Router();
//异步
var async = require('async');
//sql
const workSql = require('../sql');
//cache
const cacheData = require('./cache-data');
//日期
const moment = require('moment');
//生成唯一uuid
const uuidV1 = require('uuid/v1');
//数组乱序
const { shuffle } = require('../../configure/util');
//编码识别
const jschardet = require("jschardet");
//buffer转码
const iconv = require('iconv-lite');

// 该路由使用的中间件
router.use(function timeLog(req, res, next) {
    console.log('master-Time: ', moment().format('YYYY-MM-DD HH:mm:ss'));
    next();
});

//book list
router.get('/', function(req, res) {
    cacheData.getBookListData(req, function(result) {
        var goData = {
            result: result.data,
            userID: req.session.userID,
            nickName: req.session.nickName,
        };
        res.render('master/index.ejs', goData);
    });
});

//book catalog(id 章节id  pattern  模式)
router.get('/catalog/:id/:pattern', function(req, res) {
    async.parallel([function(callback) {
        cacheData.getCatalogListData(req, function(result) {
            callback(null, result);
        });
    }, function(callback) {
        workSql.getLastRecord(req, function(result) {
            callback(null, result);
        });
    }], function(err, results) {
        if (results[0].code == 200 || results[1].code == 200) {
            res.render('master/catalog.ejs', {
                result: results[0].data,
                userInformation: results[1].data,
                pattern: req.params.pattern,
                userID: req.session.userID,
                nickName: req.session.nickName
            });
        } else {
            res.redirect('/');
        }
    })
});

//book question
/**
 * @BookId 书id
 * @catalogId 章节id
 * @index  章节下面第几节
 */

//保存答题状态唯一uuid
var missionObj = {

};
router.getMissObj = (function() {
    return function() {
        return missionObj;
    };
})();
//闯关
function throughInformation(req, res) {
    var userID = req.session.userID;
    //获取这个章节信息
    cacheData.getQuestionData({
        params: {
            bookId: req.params.bookId,
            catalogId: req.params.catalogId,
            index: missionObj[userID].order[req.params.index]
        }
    }, function(result) {
        if (result.code == 200) {
            result.data.nextCatalogId = req.params.catalogId;
            result.data.nextIndex = +req.params.index + 1;
            res.render('master/detail.ejs', {
                result: result.data,
                bookId: req.params.bookId,
                questionIndex : missionObj[userID].order[req.params.index],
                catalogId: req.params.catalogId,
                index: req.params.index,
                todayTime: 0,
                zUuid: missionObj[userID].uuid,
                userID: req.session.userID,
                nickName: req.session.nickName
            });
        } else {
            res.redirect('/')
        }

    });
}

router.get('/detail/:bookId/:catalogId/:index', function(req, res) {

    var userID = req.session.userID;
    if (!userID) {
        var href = encodeURIComponent('http://' + req.headers.host + req.originalUrl);
        res.redirect('/login?url=' + href);
        return false;
    }
    if (req.query.pattern == 'through') {
        //闯关
        if (req.query.uuid) {
            if (!missionObj[userID] || req.query.uuid != missionObj[userID].uuid) {
                res.redirect('/');
            } else {
                throughInformation(req, res);
            }
        } else {
            missionObj[userID] = {};
            missionObj[userID].uuid = uuidV1();
            cacheData.getQuestionData(req, function(work) {
                missionObj[userID].order = shuffle(work.data.total);
                throughInformation(req, res);
            });
        }
    } else {
        async.parallel([function(callback) {
            cacheData.getQuestionData(req, function(result) {
                callback(null, result);
            });
        }, function(callback) {
            workSql.getTodayTime(req, function(result) {
                callback(null, result);
            });
        }], function(err, results) {
            if (results[0].code == 200 || results[1].code == 200) {
                res.render('master/detail.ejs', {
                    result: results[0].data,
                    bookId: req.params.bookId,
                    catalogId: req.params.catalogId,
                    index: req.params.index,
                    questionIndex:req.params.index,
                    todayTime: results[1][0].todayTime,
                    zUuid: false,
                    userID: req.session.userID,
                    nickName: req.session.nickName
                });
            } else {
                res.redirect('/');
            }
        });
    }
});


//登陆
router.get('/login', function(req, res) {
    res.render('master/login.ejs');
});
//注册
router.get('/register', function(req, res) {
    res.render('master/register.ejs');
});
// 个人中心
router.get('/personal', function(req, res) {
    var userID = req.session.userID;
    if(userID){
        res.render('master/personal.ejs', req.session.userInformation);
    }else{
        res.redirect('/');
    }
});

//错题记录
router.get('/errorRecord', function(req, res) {
    var userID = req.session.userID;
    if(userID){
        workSql.getErrorRecord(req, function(result) {
            result.data.forEach(function (v,i) {
                let strType = jschardet.detect(v.corrected);
                v.corrected = iconv.decode(v.corrected,strType.encoding) == "\u0001";

                if(v.correctedTime){
                    v.correctedTime = moment(v.correctedTime).format('YYYY年MM月DD日hh:mm:ss');
                }
            });
            var goData = {
                userID   : userID,
                nickName : req.session.nickName,
                data : result.data
            };
            res.render('master/errorRecord.ejs',goData);
        });

    }else{
        res.redirect('/');
    }
});

//练习记录
router.get('/practiceRecord', function(req, res) {
    var userID = req.session.userID;
    if(userID){
        workSql.practiceRecord(req, function(result) {
            result.data.forEach(function (v,i) {

                let strType = jschardet.detect(v.answerRight);
                v.answerRight = iconv.decode(v.answerRight,strType.encoding) == 1;

                if(v.answerTime){
                    v.answerTime = moment(v.answerTime).format('YYYY年MM月DD日hh:mm:ss');
                }
            });
            var goData = {
                userID   : userID,
                nickName : req.session.nickName,
                data : result.data
            };
            res.render('master/practiceRecord.ejs',goData);
        });
    }else{
        res.redirect('/');
    }
});

// 闯关记录
router.get('/throughRecord', function(req, res) {
    var userID = req.session.userID;
    if(userID){
        workSql.throughRecord(req, function(result) {

            var modifyResult = {}

            result.data.forEach(function (v,i) {

                let strType = jschardet.detect(v.answerRight);
                v.answerRight = iconv.decode(v.answerRight,strType.encoding) == 1;

                if(v.answerTime){
                    v.answerTime = moment(v.answerTime).format('YYYY年MM月DD日hh:mm:ss');
                }

                //生成新结构
                if(!modifyResult[v.missionID]){
                    modifyResult[v.missionID] = [];
                }
                modifyResult[v.missionID].push(v);
            });
            var goData = {
                userID   : userID,
                nickName : req.session.nickName,
                data : modifyResult
            };
            res.render('master/throughRecord.ejs',goData);
        });
    }else{
        res.redirect('/');
    }
});

module.exports = router;