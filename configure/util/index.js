/**
 * Created by zhengpeng on 2017/5/16.
 */
const  querystring = require('querystring')

//解析http post数据
exports.parseReceivedData = function(req,cb){
    var body = '';
    req.setEncoding('utf8');
    req.on('data',function(chunk){body += chunk});
    req.on('end',function(){
        var data = querystring.parse(body);
        cb(data);
    })
};

//判断是否为空
exports.isUtilNull = function (val,message,cb) {
    if(val && val != ""){
        return false
    }else{
        cb({
            code:304,
            message : message,
            data : ""
        });
        return true
    }

};

//生成随机一个数组
exports.shuffle = function(total){
     var totalA = [];
     for(let i = 0 ;i < total;i++){
         totalA.push(i)
     }
    var a = totalA.slice(0);
    for(var j, x, i = a.length; i; j = parseInt(Math.random() * i), x = a[--i], a[i] = a[j], a[j] = x);
    if(a.length > 10){
        a.length = 10;
    }
    return a;
};