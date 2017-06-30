/**
 * Created by zhengpeng on 2017/5/27.
 */
//sql
const workSql = require('../sql');

//缓存列表等,数据更新调用相用的方法

//book 对象
/*
 [ {
 bookID: '00000001025',
 name: '官子专项训练：从业余初段到3段',
 rank: '初段、2段、3段',
 author: '张杰',
 publish: '辽宁科学技术出版社',
 coverTitle: 'http://img3x3.ddimg.cn/39/16/24004173-1_b_6.jpg ',
 fixPrice: 25,
 sellPrice: null,
 abstract: null
 },... ]
 */
var book = false, bookList = []; //排序

//catalog 对象
/*
 {
 '00000001001' : [{ catalogID: 1,
 bookID: '00000001001',
 question: '1',
 name: '第一单元',
 fromPage: 1,
 toPage: 12 },...]
 }
 */
var catalog = {};

//question对象
var question = {};

//缓存bookList数据
exports.cacheBookList = function (req, callback) {
    workSql.getBookList(req, function (data) {
        book = {};
        bookList = [];

        data.forEach(function (v, i) {
            book[v.bookID] = v;
            bookList.push(v.bookID);
        });
        callback({
            code: 200,
            message: '成功',
            data: {book: book, bookList: bookList}
        });
    });
};
exports.getBookListData = function (req, callback) {
    if (book) {
        callback({
            code: 200,
            message: '成功',
            data: {book: book, bookList: bookList}
        });
    } else {
        exports.cacheBookList(req, callback);
    }
};


//缓存CatalogList数据
exports.cacheCatalogList = function (bookId, callback) {
    workSql.getCatalogList(bookId, function (data) {
        data.forEach(function (v, i) {
            if (!question[v.bookID]) {
                question[v.bookID] = {}
            }
            question[v.bookID][v.catalogID] = v;
        });
        catalog[bookId] = data;
        callback({
            code: 200,
            message: '成功',
            data: {catalog: catalog[bookId], book: book[bookId]}
        });
    });
};
exports.getCatalogListData = function (req, callback) {
    var bookId = req.params.id,
        pattern = req.params.pattern;
    if (book[bookId]) {
        getCatalogList(bookId, callback);
    } else {
        exports.cacheBookList(req, function () {
            if (book[bookId]) {
                getCatalogList(bookId, callback);
            } else {
                callback({
                    code: 404,
                    message: '没有数据',
                    data: ""
                });
            }
        });
    }

};

//getCatalogList
function getCatalogList(bookId, callback) {
    if (catalog[bookId]) {
        callback({
            code: 200,
            message: '成功',
            data: {catalog: catalog[bookId], book: book[bookId]}
        });
    } else {
        exports.cacheCatalogList(bookId, callback);
    }
}

//缓存Question数据
exports.cacheQuestion = function (req, work, callback) {
    if (question[work.bookId] && question[work.bookId][work.CatalogId]) {
        getQuestion(req, question[work.bookId][work.CatalogId], work, callback);
    } else {
        exports.cacheCatalogList(work.bookId, function () {
            if (question[work.bookId][work.CatalogId]) {
                getQuestion(req, question[work.bookId][work.CatalogId], work, callback);
            } else {
                callback({
                    code: 404,
                    message: '没有数据',
                    data: ""
                });
            }
        });
    }
};
function getQuestion(req, work, oldWork, callback) {
    workSql.getQuestion(work, function (data) {
        work.questionList = data;

        var judge = judgeNext(data, oldWork.index, oldWork.bookId, oldWork.CatalogId, req);
        /**
         * 修改 修正index
         * @type {any}
         */
        oldWork.index = req.params.index;

        if (work.questionList[oldWork.index]) {
            callback({
                code: 200,
                message: '成功',
                data: {
                    content: data[oldWork.index],
                    total: data.length,
                    nextCatalogId: judge.nextCatalogId,
                    nextIndex: judge.nextIndex
                }
            });
        } else {
            callback({
                code: 404,
                message: '没有数据',
                data: ""
            });
        }

    });
}

exports.getQuestionData = function (req, callback) {
    var bookId = req.params.bookId,
        CatalogId = req.params.catalogId,
        index = req.params.index;
    if (question[bookId] && question[bookId][CatalogId] && question[bookId][CatalogId].questionList && question[bookId][CatalogId].questionList[index]) {
        var questionList = question[bookId][CatalogId].questionList;
        var judge = judgeNext(questionList, index, bookId, CatalogId, req);
        /**
         * 修改 修正index
         * @type {any}
         */
        index = req.params.index;
        callback({
            code: 200,
            message: '成功',
            data: {
                content: questionList[index],
                total: questionList.length,
                nextCatalogId: judge.nextCatalogId,
                nextIndex: judge.nextIndex
            }
        });
    } else {
        exports.cacheQuestion(req, {bookId: bookId, CatalogId: CatalogId, index: index}, callback);
    }
};

//判断是否有下一章
function judgeNext(questionList, index, bookId, CatalogId, req) {
    if (req.query.questionID) {
        if(!questionList[index] || questionList[index].questionID != req.query.questionID){
            //查看答案模式或者修改模式 不对应，修正不对应
            questionList.forEach(function (v, i) {
                if (v.questionID == req.query.questionID) {
                    req.params.index = i;
                    index = i;
                    workSql.correctRecord(req,req.query.questionID,i);
                }
            })
        }

    }
    if (questionList.length - 1 > index) {
        return {
            nextCatalogId: CatalogId,
            nextIndex: ++index
        }
    } else if (questionList.length - 1 <= index) {
        var nextIndex = "";
        catalog[bookId].forEach(function (v, i) {
            if (v.catalogID == CatalogId) {
                nextIndex = ++i;
            }
        });

        //获取第二章信息
        var nextCatalogInformation = catalog[bookId][nextIndex];
        if (nextCatalogInformation) {
            return {
                nextCatalogId: nextCatalogInformation.catalogID,
                nextIndex: 0
            }
        } else {
            return {
                nextCatalogId: false,
                nextIndex: false
            }
        }
    }
}