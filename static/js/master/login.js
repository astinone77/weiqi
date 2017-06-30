
function checkLogin() {
    var form = $('.formBox').find('form');
    var data = getFormData(form);
    var urlParam = getHrefRefs();
    var backToSourcePage = decodeURIComponent(urlParam.url);
    if (!isNull(data.loginName) && !isNull(data.loginPwd)) {
        data.loginPwd = md5(data.loginPwd);
        ajaxModel.postData('/api/login', data).then(function (result) {
            console.log(result);
            if (result.code === 200) {
                layer.msg(result.message);
                if(isNull(backToSourcePage)){
                    window.location = '/';
                }else{
                    window.location.href = backToSourcePage;
                }
            } else {
                layer.msg(result.message);
            }
        });
    } else {
        layer.msg('小主，您还没填完呐~');
    }
}

$('#registerNow').click(checkLogin);

$(window).on('keydown', function (event) {
    var e = event || window.event;
    var code = e.keyCode || e.which || e.charCode;
    if (code && code === 13) {
        checkLogin();
    }
});