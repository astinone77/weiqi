/**
 * Created by zhengpeng on 2017/5/20.
 */

//数组扩展
if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function (searchElement, fromIndex) {

            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If len is 0, return false.
            if (len === 0) {
                return false;
            }

            // 4. Let n be ? ToInteger(fromIndex).
            //    (If fromIndex is undefined, this step produces the value 0.)
            var n = fromIndex | 0;

            // 5. If n ≥ 0, then
            //  a. Let k be n.
            // 6. Else n < 0,
            //  a. Let k be len + n.
            //  b. If k < 0, let k be 0.
            var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            // 7. Repeat, while k < len
            while (k < len) {
                // a. Let elementK be the result of ? Get(O, ! ToString(k)).
                // b. If SameValueZero(searchElement, elementK) is true, return true.
                // c. Increase k by 1.
                // NOTE: === provides the correct "SameValueZero" comparison needed here.
                if (o[k] === searchElement) {
                    return true;
                }
                k++;
            }

            // 8. Return false
            return false;
        }
    });
}

//ajax扩展
var ajaxModel = {
    _ajax: function (type, url, data, custom) {
        return $.ajax({
            url: url,
            data: data,
            type: custom.type || type,
            content: "application/json",
            dataType: "json",
            cache: false,
            traditional: custom.traditional || false,
            beforeSend: function () {
                // 防止表单重复提交
                custom.btn && custom.btn.prop('disabled', true);
                custom.beforeSend && custom.beforeSend(arguments);
            },
            success: function () {
                custom.success && custom.success(arguments);
            },
            complete: function () {
                // 防止表单重复提交
                custom.btn && custom.btn.prop('disabled', false);
                custom.complete && custom.complete(arguments);
            },
            error: function (xhr, status) {
                custom.error && custom.error(arguments);
            }
        }).then(function (res) {
            if (res.code === 301) {
                res.data && (location.href = res.data);
                return;
            }
            return res;
        });
    },
    getData: function (url, data, custom) {
        return this._ajax("GET", url, data, custom || {});
    },
    postData: function (url, data, custom) {
        return this._ajax("POST", url, data, custom || {});
    },
    putData: function (url, data, custom) {
        return this._ajax("PUT", url, data, custom || {});
    },
    deleteData: function (url, data, custom) {
        return this._ajax("DELETE", url, data, custom || {});
    }
};
//获得url param
function getHrefRefs() {
    var refes = location.search.substring(1),
        opts = {},
        index = 0,
        file = "";
    refes = refes.split("&");
    for (var i = 0; i < refes.length; i++) {
        file = refes[i];
        file = file.split("=");
        if (file[1]) {
            index = file[1].indexOf("#");
            if (index == -1) {
                opts[file[0]] = file[1];
            } else {
                opts[file[0]] = file[1].substring(0, file[1].indexOf("#"));
            }
        }
    }
    return opts;
}

// by liYang start

function setParamAfterUrl() {
    var originUrl = window.location.href;
    $('a[href="/login"]').attr('href', '/login?url=' + encodeURIComponent(originUrl));
    $('a[href="/register"]').attr('href', '/register?url=' + encodeURIComponent(originUrl));
}
// 验证变量是否为空
function isNull(params) {
    switch (typeof (params)) {
        case 'object':
            return isObjNull(params); //|| (JSON.stringify(params) === "{}");
            break;
        default:
            return params === '' || params === null || params === 'undefined' || params === undefined;
            break;
    }
}
function isObjNull(obj) {
    for (key in obj){
        return false;
    }
    return true;
}

// 获取表单value
function getFormData($form) {
    var data = {};
    var key = null;
    var iValue = null;
    if ($('select', $form)) {
        $('select', $form).each(function () {
            key = $(this).attr('name');
            iValue = $(this).val();
            if (!isNull(key) && !isNull(iValue)) {
                data[key] = iValue;
            }
        });
    }
    if ($('input', $form)) {
        $('input', $form).each(function () {
            var type = $(this).attr('type');
            if (type === 'radio' || type === 'checkbox') {
                if ($(this).prop('checked')) {
                    key = $(this).attr('name');
                    iValue = $(this).val();
                    if (!isNull(key) && !isNull(iValue)) {
                        data[key] = iValue;
                    }
                }
            } else {
                key = $(this).attr('name');
                iValue = $(this).val();
                if (!isNull(key) && !isNull(iValue)) {
                    data[key] = iValue;
                }
            }
        });
    }
    return data;
}

// by liYang end