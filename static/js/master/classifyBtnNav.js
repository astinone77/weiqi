/**
 * Created by astin on 2017/6/12.
 */

$('.classify-btn-js').find('li').click(function () {
    var thisUrl = $(this).attr('data-url');
    console.log(thisUrl);
    $(this).siblings('li').removeClass('active');
    $(this).addClass('active');
    window.location = thisUrl;
})