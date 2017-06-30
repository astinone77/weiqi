/**
 * Created by astin on 2017/6/14.
 */
function getThisHours() {
    var myDate = new Date();
    var hour = parseInt(myDate.getHours());
    var words = null;
    if (0 <= hour && hour < 6){
        words = '凌晨了，赶快睡了吧~';
    }else if (6 <= hour && hour < 9){
        words = '清晨好，一天之计在于晨哦~';
    }else if (9 <= hour && hour < 12){
        words = '上午好~';
    }else if (12 <= hour && hour < 13){
        words = '中午好~';
    }else if (13 <= hour && hour < 18){
        words = '下午好~';
    }else if (18 <= hour && hour < 22){
        words = '晚上好~';
    }else if (22 <= hour && hour < 24){
        words = '夜深了，早点休息哦~';
    }
    // console.log(hour,words);
    $('.thisHour').text(words);
}