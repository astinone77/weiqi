/**
 * Created by zhengpeng on 2017/5/22.
 */

//数据库
const workSql = require('./connect-sql.js');
//定时任务
var schedule = require('node-schedule');
//常量
const reloadTodayTime = 3600;  //一个小时

//定时任务
schedule.scheduleJob('59 59 23 * * *', function(){
    workSql.reloadTodayTime(reloadTodayTime);
});

module.exports = workSql;