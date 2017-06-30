/**
 * Created by zhengpeng on 2017/5/22.
 */
function opsPa() {
    this.init();
}
opsPa.prototype = {
    init : function () {
        //初始化
        this.bindEvents();
    },
    bindEvents: function(){
        //上传文件
        $('#fileupload').fileupload({
            dataType: 'json',
            progressall: function (e, data) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#progress').css('width', progress + '%').find('span').text(progress);
            },
            done: function (e, data) {
                $('#progress').removeClass('active');
                notify.success('上传成功～');
            }
        });
    }
};
$(function () {
   new opsPa();
});