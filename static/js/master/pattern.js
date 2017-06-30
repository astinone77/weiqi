/**
 * Created by zhengpeng on 2017/5/30.
 */

//practice: 练习模式
//through:  闯关模式
//answer ： 查看答案模式
var pattern = getHrefRefs().pattern;

$(function(){
    if(pattern == 'practice' || pattern == "through"){
        $(".mynav").show();
        window.wq = new weiqi({
            pattern :2
        });
    }else if(pattern == 'answer'){
        $(".mynav").hide();
        $(".chess-information").show();
        $("#goBack").remove();
        window.wq = new weiqi({
            pattern :1
        });
    }else if(pattern == "modifyError"){
        $(".mynav").hide();
        $("#goBack").remove();
        window.wq = new weiqi({
            pattern :2
        });
    }else{
        window.location.href = '/';
    }

    $("#showNum").click(function(){
        wq.showPlayStep({
            showPlayStep : true
        })
    });
    $("#hideNum").click(function(){
        wq.showPlayStep({
            showPlayStep : false
        })
    })
});



$(function () {
    if(pattern == "practice"){
        //练习模式
        practiceMethod();
    }else if(pattern == "through"){
        //闯关模式
        throughMethod();
    }

    //练习模式
    function practiceMethod() {

        //倒计时
        $("#timeBox").show();
        var lastTime = config.todayTime;

        if(config.todayTime <= 0) {
            alert('今日练习时间结束');
            window.location.href = '/';
        }

        $('#countdown').countDown({
            targetDate: {
                lastTime : lastTime
            }
        });


        var lastSetTime = setInterval(function () {
            config.todayTime -= 3;
            ajaxModel.postData('/api/updateTodayTime',{todayTime : 3},function (res) {});
            if(config.todayTime <= 0){
                alert('今日练习时间结束');
                window.location.href = '/';
                window.clearInterval(lastSetTime);
            }
        },3000);

        //保存记录
        saveThisInformation();

        //浏览器关闭
        if(window.onpagehide !== undefined){
            //ios
            window.onpagehide = function () {
                saveThisInformation();
            }
        }else{
            if(window.onbeforeunload !== undefined){
                //chrome,firefox
                window.onbeforeunload = function () {
                    saveThisInformation();
                }
            }else{
                window.onunload = function () {
                    saveThisInformation();
                }
            }
        }

        function saveThisInformation(){
            ajaxModel.postData('/api/saveLastRecord', {
                bookId : config.bookId,
                catalogId : config.catalogId,
                index : config.index,
                questionId: config.questionId
            }).then(function (res) {
                console.log(res)
            });
        }
    }

    //闯关模式
    function throughMethod() {

    }
});