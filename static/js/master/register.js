var emailReg = /^([A-Za-z0-9_\-\])+\@([A-Za-z0-9_\-])+\.([A-za-z])/;
var phoneReg = /^1\d{10}$/;
var passwordReg = /^.*(?=.{6,})(?=.*\d)(?=.*[a-z]).*$/;

function checkInput() {
    var params = {};
    var $register = $('#signup');
    var data = getFormData($register);
    if (isNull(data.account)){
        layer.msg('咦~账号是不是没有填呀？');
        // $('#account').focus();
        return;
    }else {
        // var account = parseInt(data.account);
        if (emailReg.test(data.account) || phoneReg.test(data.account)){
            params.loginName = data.account;
        }else {
            layer.msg('手机号或者邮箱格式不正确！');
            // $('#account').focus();
            return;
        }
    }
    if (isNull(data.nickName)){
        layer.msg('快给自己起个炫酷的昵称吧~');
        // $('#nickName').focus();
        return;
    }else {
        params.nickName = data.nickName;
    }
    if (isNull(data.password)){
        layer.msg('给自己设置一个安全的密码哦~');
        // $('#password').focus();
        return;
    } else {
        if (passwordReg.test(data.password)) {
            params.loginPwd = md5(data.password);
        }else {
            layer.msg('Ops~密码最少6位，起码要包含一个字母哦~');
            // $('#password').focus();
            return;
        }
    }
    if (isNull(data.rePassword)){
        layer.msg('要再输入一次密码哦~');
        // $('#rePassword').focus();
        return;
    } else {
        var firstPassword = $('#password').val();
        var secondPassword = $('#rePassword').val();
        if (firstPassword !== secondPassword) {
            layer.msg('输入密码不一致');
            // $('#rePassword').focus();
            return;
        }
    }
    if (isNull(data.agreement)){
        layer.msg('用户协议还是要看看滴~');
    } else {
        if (data.agreement === 'on'){
            return params;
        }
    }
}

function checkInputOnBlur($self) {
    switch($self.attr('name')){
        case 'account':
            if (isNull($self.val())){
                layer.msg('咦~账号是不是没有填呀？');
                // $('#account').focus();
            }else {
                if (!emailReg.test($self.val()) && !phoneReg.test($self.val())){
                    layer.msg('手机号或者邮箱格式不正确！');
                    // $('#account').focus();
                }
            }
            break;
        case 'nickName':
            if (isNull($self.val())){
                layer.msg('快给自己起个炫酷的昵称吧~');
                // $('#nickName').focus();
            }
            break;
        case 'password':
            if (isNull($self.val())){
                layer.msg('给自己设置一个安全的密码哦~');
                // $('#password').focus();
            } else {
                if (!passwordReg.test($self.val())) {
                    layer.msg('欧帕斯~密码格式不正确');
                    // $('#password').focus();
                }
            }
            break;
        case 'rePassword':
            if (isNull($self.val())){
                layer.msg('要再输入一次密码哦~');
                // $('#rePassword').focus();
            } else {
                var firstPassword = $('#password').val();
                var secondPassword = $('#rePassword').val();
                if (firstPassword !== secondPassword) {
                    layer.msg('输入密码不一致');
                    // $('#rePassword').focus();
                }
            }
            break;
        case 'agreement':
            if (!$self.prop('checked')){
                layer.msg('用户协议还是要看看滴~');
            }
            break;
    }
}

function registData(params) {
    ajaxModel.postData('/api/register', params).then(function (result) {
        layer.msg(result.message);
        if (result.code === 200) {
            var backUrl = getHrefRefs().url;
            if (isNull(backUrl)) {
                window.location = '/';
            } else {
                window.location = backUrl;
            }
        }
    });
}

$(function () {
    $('#account').on('blur', function () {
        checkInputOnBlur($(this));
    });
    $('#nickName').on('blur', function () {
        checkInputOnBlur($(this));
    });
    $('#password').on('blur', function () {
        checkInputOnBlur($(this));
    });
    $('#rePassword').on('blur', function () {
        checkInputOnBlur($(this));
    });

    $('#registerNow').click(function () {
        var params = checkInput();
        if (!isNull(params)){
            registData(params);
        }
    });
    $(window).on('keydown', function (event) {
        var e = event || window.event;
        var code = e.keyCode || e.which || e.charCode;
        if (code && code === 13) {
            var params = checkInput();
            if (!isNull(params)){
                registData(params);
            }
        }
    });
})