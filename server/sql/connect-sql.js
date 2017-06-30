/**
 * Created by zhengpeng on 2017/5/22.
 */

//引入mysql api
const mysql = require('mysql');

//解析流
const {parseReceivedData,isUtilNull} = require('../../configure/util');
//编码识别
const jschardet = require("jschardet");
//buffer转码
const iconv = require('iconv-lite');
//日期
const moment = require('moment');

//链接数据库配置
const db_config = {
    host:    '123.57.149.123',
    user:    'root',
    password:'thinkme',
    database:'island'
};

//connect-first
var db;
handleDisconnect();

//数据库增删查改

//读取书的list
exports.getBookList = function(req,callback){
    db.query(
        "SELECT * from book ",
        function(err,rows){
            if(err) throw err;
            callback(rows);
        }
    )
};

//读取catalogList
exports.getCatalogList = function (bookId,callback) {
    db.query(
        "SELECT * from catalog where bookID = ?",
        [bookId],
        function(err,rows){
            if(err) throw err;
            callback(rows);
        }
    )
};

//读取题目
exports.getQuestion = function(work,callback){

    var sqlStr = 'SELECT'+
        ' b.*,c.name,d.chapter,d.catalogName'+
        ' FROM'+
        ' question AS b'+
        ' JOIN book AS c on b.bookID = c.bookID'+
        ' JOIN catalog AS d on b.bookID=d.bookID and b.page>=d.fromPage and d.toPage>=b.page'+
        ' WHERE'+
        ' b.bookID = ? AND b.page >= ? and b.page <= ?';

    db.query(
        //"SELECT * from question where bookID = ? AND page >= ? and page <= ?",
        sqlStr,
        [work.bookID,work.fromPage,work.toPage],
        function(err,rows){
            if(err) throw err;
            callback(rows);

        }
    )
};

//保存题目
exports.saveQuestion = function(req,callback){
    let buffer = req.files[0].buffer;
    let strType = jschardet.detect(buffer);
    let str = iconv.decode(buffer,strType.encoding);
    //插入数据
    db.query(
        "INSERT INTO question (content,bookID,page,questionNo,rank,knowledgeID) "+
        "VALUES (?,?,?,?,?,?)",
        [str,1,2,3,4,5],
        function(err){
            if(err) throw err;
            callback(str);
        }
    )
};

//获取one
exports.getQuestionContent = function(req,callback){
    parseReceivedData(req,function(work){
        //添加工作记录的sql
        db.query(
            "SELECT content from question where questionID = ?",
            [work.questionId],
            function(err,rows){
                if(err) throw err;
                callback(rows);
            }
        )
    })

};

//获取此用户是否答题
exports.getLastRecord = function (req,callback) {
    var userID = req.session.userID;
    var bookID = req.params.id;
    if(userID){
        db.query(
            "SELECT * from lastrecord where userID = ? AND bookID  = ?",
            [userID,bookID],
            function(err,rows){
                if(err) throw err;
                callback({
                    code : 200,
                    message :'成功',
                    data: rows
                })
            }
        )
    }else{
        callback({
            code : 200,
            message :'没有登陆',
            data: null
        })
    }
};
//保存练习记录
exports.saveLastRecord = function (req,callback) {
    var userID = req.session.userID;
    var lastTime = moment().format('YYYY-MM-DD HH:mm:ss');
    if(userID){
        parseReceivedData(req,function(work){
            //添加工作记录的sql
            db.query(
                "UPDATE lastrecord set questionID = ?,catalogID = ?,questionIndex =?,lastTime = ? where userID = ? AND bookID = ?",
                [work.questionId, work.catalogId, work.index, lastTime, userID, work.bookId],
                function (err, rows) {
                    if (err) throw err;
                    if(rows.changedRows == 0){
                        db.query(
                            "INSERT INTO lastrecord (userID,bookID,questionID,catalogID,questionIndex,lastTime) VALUES (?,?,?,?,?,?)",
                            [userID, work.bookId,work.questionId, work.catalogId, work.index, lastTime],
                            function (err, rows) {
                                if (err) throw err;
                                callback("");
                            }
                        )
                    }else{
                        callback("");
                    }

                }
            )

        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//获得剩下的时间
exports.getTodayTime = function (req,callback) {
    var userID = req.session.userID;
    if(userID){
        db.query(
            "select totalTime,todayTime from user where userID = ?",
            [userID],
            function (err, rows) {
                if (err) throw err;
                req.session.totalTime = rows[0].totalTime;
                req.session.todayTime = rows[0].todayTime;

                callback(rows);
            }
        )
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//更新剩余时间
exports.updateTodayTime = function (req,callback) {
    var userID = req.session.userID;
    if(userID){
        parseReceivedData(req,function(work) {
            req.session.todayTime -= work.todayTime;
            req.session.totalTime += +work.todayTime;
            db.query(
                "UPDATE user set todayTime = ?,totalTime = ?  where userID = ?",
                [req.session.todayTime,req.session.totalTime, userID],
                function (err, rows) {
                    if (err) throw err;
                    callback("");
                }
            )
        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//重置剩余时间
exports.reloadTodayTime = function (valTime) {
    db.query(
        "UPDATE user set todayTime = ?",
        [valTime],
        function (err, rows) {
            if (err) throw err;
        }
    )
};


//保存答题记录
exports.saveHomeWork = function (req,callback) {
    var userID = req.session.userID;
    var lastTime = moment().format('YYYY-MM-DD HH:mm:ss');
    if(userID){
        parseReceivedData(req,function(work){
            //添加工作记录的sql
            db.query(
                "INSERT INTO homework (userID,questionID,questionIndex,answer,answerRight,answerTime) VALUES (?,?,?,?,?,?)",
                [userID,work.questionID,work.questionIndex,work.answer,work.right,lastTime],
                function (err, rows) {
                    if (err) throw err;
                    callback({
                     type : 'H',
                     answerRight: work.right,
                     homeworkId : rows.insertId
                    });
                }
            )

        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//报错闯关答题记录
exports.saveMissionWork = function (req,missionID,callback) {
    var userID = req.session.userID;
    var lastTime = moment().format('YYYY-MM-DD HH:mm:ss');
    if(userID){
        parseReceivedData(req,function(work){
            //添加工作记录的sql
            db.query(
                "INSERT INTO missionwork (missionID,userID,questionID,questionIndex,answer,answerRight,answerTime) VALUES (?,?,?,?,?,?,?)",
                [missionID,userID,work.questionID,work.questionIndex,work.answer,work.right,lastTime],
                function (err, rows) {
                    if (err) throw err;
                    callback({
                        type : 'M',
                        answerRight: work.right,
                        homeworkId : rows.insertId
                    });
                }
            )

        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
}

//保存错误记录
exports.saveMistake = function (req,work,callback) {
    var userID = req.session.userID;
    if(userID){
        db.query(
            "INSERT INTO mistake (userID,detailID,pType,corrected) VALUES (?,?,?,?)",
            [userID,work.homeworkId,work.type,false],
            function (err, rows) {
                if (err) throw err;
                callback("");
            }
        )
    }
};
//注册
exports.register = function (req,callback) {
    parseReceivedData(req,function(work) {
        if(isUtilNull(work.loginName,"账号名不能为空",callback)){
            return false
        }
        if(isUtilNull(work.loginPwd,"密码不能为空",callback)){
            return false
        }
        //开启事物
        db.beginTransaction(function(err) {
            if (err) {
                throw err;
            }
            db.query(
                "select userID from user where loginName = ?",
                [work.loginName],
                function (err, rows) {
                    if (err) {
                        return db.rollback(function () {
                            throw err;
                        });
                    }
                    if(rows[0] && rows[0].userID){
                        return db.rollback(function () {
                            callback({
                                code    : 304,
                                data    : "",
                                message : "此邮箱已经注册"
                            })
                        });
                    }else{
                        db.query(
                            "INSERT INTO user (loginName,loginPwd,nickName,userType,todayTime) VALUES (?,?,?,?,?)",
                            [work.loginName,work.loginPwd,work.nickName,1,3600],
                            function (err, rows) {
                                if (err) {
                                    return db.rollback(function() {
                                        throw err;
                                    });
                                }
                                db.commit(function(err) {
                                    if (err) {
                                        return db.rollback(function() {
                                            throw err;
                                        });
                                    }
                                    req.session.userID = rows.insertId;
                                    req.session.nickName = work.nickName;
                                    req.session.userInformation = {
                                        userID   : req.session.userID,
                                        nickName : req.session.nickName,
                                        gender   : "",
                                        realName : "",
                                        idcard   : "",
                                        phone    : "",
                                        avatar   : ""
                                    };
                                    callback({
                                        code    : 200,
                                        data    : "",
                                        message : "注册成功"
                                    })
                                });

                            }
                        )
                    }

                }
            )
         })
    })
};

//登陆
exports.login = function (req,callback) {
    parseReceivedData(req,function(work) {
        db.query(
            "select userID,nickName,gender,realName,idcard,phone,avatar from user where loginName = ? AND loginPwd = ?",
            [work.loginName,work.loginPwd],
            function (err, rows) {
                if (err) throw err;

                if(rows.length > 0){
                    req.session.userID = rows[0].userID;
                    req.session.nickName = rows[0].nickName;
                    req.session.userInformation = rows[0];
                    callback({
                        code : 200,
                        message : '登陆成功',
                        data : ""
                    })
                }else{
                    callback({
                        code : 404,
                        message : '账号或密码错误',
                        data : ""
                    })
                }

            }
        )
    })
};

//获得练习模式错题记录
exports.getErrorRecord =  function (req,callback) {
    var userID = req.session.userID;
    if(userID){

        var sqlStr = 'SELECT'+
                        ' m.detailID,m.corrected,m.correctedTime,a.questionID,a.questionIndex,a.answer,b.content,b.questionNo,b.knowledgeType,b.knowledgePoint,c.bookID,c.name,d.chapter,d.catalogName'+
                     ' FROM'+
                        ' mistake AS m'+
                        ' JOIN homework AS a on m.detailID = a.homeworkID'+
                        ' JOIN question AS b on a.questionID = b.questionID'+
                        ' JOIN book AS c on b.bookID = c.bookID'+
                        ' JOIN catalog AS d on b.bookID=d.bookID and b.page>=d.fromPage and d.toPage>=b.page'+
                     ' WHERE'+
                        ' pType = "H" and m.userId = ?';

        db.query(
            sqlStr,
            [userID],
            function (err, rows) {
                if (err) throw err;
                callback({
                    code: 200,
                    message: '成功',
                    data: rows
                });
            }
        )
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//获得练习模式做过的题
exports.practiceRecord =  function (req,callback) {
    var userID = req.session.userID;
    if(userID){

        var sqlStr = 'SELECT'+
            ' a.questionID,a.questionIndex,a.answer,a.answerRight,a.answerTime,b.content,b.questionNo,b.knowledgeType,b.knowledgePoint,c.bookID,c.name,d.chapter,d.catalogName'+
            ' FROM'+
            ' homework AS a'+
            ' JOIN question AS b on a.questionID = b.questionID'+
            ' JOIN book AS c on b.bookID = c.bookID'+
            ' JOIN catalog AS d on b.bookID=d.bookID and b.page>=d.fromPage and d.toPage>=b.page'+
            ' WHERE'+
            ' a.userId = ?';

        db.query(
            sqlStr,
            [userID],
            function (err, rows) {
                if (err) throw err;
                callback({
                    code: 200,
                    message: '成功',
                    data: rows
                });
            }
        )
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//闯关记录
exports.throughRecord = function (req,callback) {
    var userID = req.session.userID;
    if(userID){

        var sqlStr = 'SELECT'+
            ' a.missionID,a.questionID,a.questionIndex,a.answer,a.answerRight,a.answerTime,b.content,b.questionNo,b.knowledgeType,b.knowledgePoint,c.bookID,c.name,d.chapter,d.catalogName'+
            ' FROM'+
            ' missionwork AS a'+
            ' JOIN question AS b on a.questionID = b.questionID'+
            ' JOIN book AS c on b.bookID = c.bookID'+
            ' JOIN catalog AS d on b.bookID=d.bookID and b.page>=d.fromPage and d.toPage>=b.page'+
            ' WHERE'+
            ' a.userId = ?';

        db.query(
            sqlStr,
            [userID],
            function (err, rows) {
                if (err) throw err;
                callback({
                    code: 200,
                    message: '成功',
                    data: rows
                });
            }
        )
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//修正index
exports.correctRecord = function (req,questionId,questionIndex) {
    var userID = req.session.userID;
    db.query(
        "UPDATE homework set questionIndex = ?  where questionID = ? and userID  = ?",
        [questionIndex,questionId,userID],
        function (err, rows) {
            if (err) throw err;
        }
    )
    db.query(
        "UPDATE missionwork set questionIndex = ?  where questionID = ? and userID  = ?",
        [questionIndex,questionId,userID],
        function (err, rows) {
            if (err) throw err;
        }
    )
};

//修改错题
exports.modifyError = function (req,callback) {
    var userID = req.session.userID;
    if(userID){
        var lastTime = moment().format('YYYY-MM-DD HH:mm:ss');
        parseReceivedData(req,function(work) {
            db.query(
                "UPDATE mistake set corrected = ?,correctedTime = ?  where detailID = ? and userID  = ?",
                [1,lastTime,work.detailID,userID],
                function (err, rows) {
                    if (err) throw err;
                    callback({
                        code: 200,
                        message: '修改成功',
                        data: ""
                    });
                }
            )
        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};

//更新用户信息
exports.updateUserInformation = function (req,callback) {
    var userID = req.session.userID;
    if(userID){
        parseReceivedData(req,function(work) {
            db.query(
                "UPDATE user set nickName = ?,gender = ? ,realName =?,idcard = ?,phone=?,avatar=? where userID  = ?",
                [work.nickName,work.gender,work.realName,work.idcard,work.phone,work.avatar,userID],
                function (err, rows) {
                    if (err) throw err;
                    req.session.nickName = work.nickName;
                    req.session.userInformation = {
                        userID   : userID,
                        nickName : work.nickName || "",
                        gender   : work.gender || "",
                        realName : work.realName || "",
                        idcard   : work.idcard || "",
                        phone    : work.phone || "",
                        avatar   : work.avatar || ""
                    };
                    callback({
                        code: 200,
                        message: '修改成功',
                        data: ""
                    });
                }
            )
        })
    }else{
        callback({
            code: 404,
            message: '没有此用户',
            data: ""
        });
    }
};


//连接方式
function handleDisconnect() {
    db = mysql.createConnection(db_config);   //Recreate the connection, since the old one cannot be reused.

    db.connect(function(err) {                         //The server is either down
        if(err) {                                      //or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);        // We introduce a delay before attempting to reconnect,
        }                                              // to avoid a hot loop, and to allow our node script to
    });                                                // process asynchronous requests in the meantime.
                                                       // If you're also serving http, display a 503 error.
    db.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {  // Connection to the MySQL server is usually
            handleDisconnect();                        // lost due to either server restart, or a
        } else {                                       // connnection idle timeout (the wait_timeout
            throw err;                                 // server variable configures this)
        }
    });
}

//keep-alive
setInterval(function () {
    db.query('SELECT 1');
}, 5000);