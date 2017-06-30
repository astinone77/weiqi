/**
 * 所有页面的基类&工具类 by jason.chen
 */

/**
 * 命名空间
 * @param  {[type]} str  'xm.componet'
 * @return {[type]}     [description]
 */
function namespace(str) {
	var parts = str.split('.'),
		parent = window;
	for (var i = 0; i < parts.length; i++) {
		if (typeof parent[parts[i]] == 'undefined') {
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}
	return parent;
}

namespace('xm.component');

/* jquery ajax ,notify 封装 */
(function (component, $) {
	window.notify = component.notify = {
		_create:function(p,option){
			var def = {
				text        : '',
				type        : 'alert',
				dismissQueue: true,
				timeout     : 6000,
				width		: '300px',
				closeWith   : ['click'],
				layout      : 'topCenter',
				theme       : 'cms-theme',
				maxVisible  : 10,
				animation: {
		       		open  : 'animated bounceInDown',
                    close : 'animated fadeOut',
                    easing: 'swing',
                    speed : 100
			    }
			},
			opt = $.extend(def,p,option);
			return noty(opt);
		},
		alert: function(txt, opt) {
			var p = $.extend({
				title:'提示',
			    btnOKLabel:'确认',
			    btnOKClass:'btn-primary',
				btnCancelClass: null,
			    type:'type-default',
			    message:txt,
			    callback:function(result){}
			},opt);
			return noty.Dialog.alert(p);
		 },
		confirm: function(txt, opt) {
			var p = $.extend({
				title:'提示',
			    btnOKLabel:'确认',
				btnCancelLabel:'取消',
				btnOKClass:'btn-primary',
				btnCancelClass: null,
			    type:'type-default',
			    message:txt,
			    callback:function(result){}
			},opt);
			return noty.Dialog.confirm(p);
		},
		show:function(txt,opt){
			var p = $.extend({
				title:'提示',
				message:txt
			},opt);
			return noty.Dialog.show(p);
		},
		info: function(txt, opt) {
			return this._create({
				text: txt,
				type: 'information'
			},opt);
		},
		error: function(txt, opt) {
			return this._create({
				text: txt,
				type: 'error'
			},opt);
		},
		warn: function(txt, opt) {
			return this._create({
				text: txt,
				type: 'warning'
			}, opt);
		},
		notification: function(txt, opt) {
			return this._create({
				text: txt,
				type: 'notification'
			}, opt);
		},
		success: function(txt, opt) {
			return this._create({
				text: txt,
				type: 'success'
			},opt);
		},

		get:function(id){
			$.noty.get(id);
		},
		close:function(id){
			$.noty.close(id);
		},
		closeAll:function(){
			$.noty.closeAll()
		},
		clearQueue:function(){
			$.noty.clearQueue();
		},
		setText:function(id,text){
			$.noty.setText(id, text);
		},
		setType:function(id,type){
			$.noty.setType(id, type);
		}
	};

	// model
	component.ajaxModel = {
		_ajax: function (type, url, data, custom) {
			return $.ajax({
				url: '/ops-focus'+url,
				data: data,
				type: custom.type || type,
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
				error: function (xhr,status) {
					custom.error && custom.error(arguments);
					notify.error('网络或服务异常:' + status.toUpperCase());
				}
			}).then(function(res){
				if(res.code === 301){
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


	/* dialog 封装  -> xDialog*/
	component.dialog = function (option) {
		var opt = {
			title: '',
			content: '',
			// quickClose: false,
			okValue: '确定',
			opacity: 0.3,
			cancelValue: '取消',
			width: "280px",
			backdropOpacity: 0.4,
			cancel: function (argument) {
				this.hide();
			}
		};
		return new Dialog($.extend(opt, option));
	};


	// 封装jquery validator 插件
	component.validate = function (formSelector, opt, callback) {
		var option = {
			debug: true,
			submitHandler: function (form) {
				if ($(formSelector).valid()) {
					callback && callback();
					return false;
				}
			},
			ignore: '.ignore,:hidden',
			rules: opt.rules,
			messages: opt.messages || {},
			highlight: function (element, errorClass, validClass) {
				$(element).closest(opt.tipElCls || 'li').addClass(errorClass).removeClass(validClass);
			},
			unhighlight: function (element, errorClass, validClass) {
				$(element).closest(opt.tipElCls || 'li').removeClass(errorClass).addClass(validClass);
			},
			errorPlacement: function (error, element) {
				// error.remove();
			}
		};
		return $(formSelector).validate($.extend(option, opt));
	};


	// 封装滚动条
	component.Scroller = function (selecter, options) {
		var self = this;
		this.options = {
			scrollbars: true,
			fadeScrollbars: true,
			click: self._iScrollClick(),
			preventDefault: false,
			preventDefaultException: {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/}
		}
		this._init(selecter, $.extend(this.options, options || {}));

	};
	component.Scroller.prototype = {
		_init: function (selecter, options) {
			this.scroller = new IScroll(selecter, options);
			this._bindEvents();
		},
		getScroller: function () {
			return this.scroller;
		},
		_bindEvents: function () {
			var self = this,
				opt = self.options;

			document.addEventListener('touchmove', function (e) {
				e.preventDefault();
			}, false);

			this.scroller.on('refresh', function (e) {
				opt.refresh && opt.refresh();
			});

			this.scroller.on('scrollStart', function (e) {
				opt.scrollStart && opt.scrollStart({'x': this.x, 'y': this.y}, {
					'maxScrollX': this.maxScrollX,
					'maxScrollY': this.maxScrollY
				}, this);
			});

			this.scroller.on('scroll', function (e) {
				opt.scroll && opt.scroll({'x': this.x, 'y': this.y}, {
					'maxScrollX': this.maxScrollX,
					'maxScrollY': this.maxScrollY
				}, this);
			});

			this.scroller.on('scrollEnd', function (e) {
				opt.scrollEnd && opt.scrollEnd({'x': this.x, 'y': this.y}, {
					'maxScrollX': this.maxScrollX,
					'maxScrollY': this.maxScrollY
				}, this);

			});
		},
		_iScrollClick: function () {
			if (/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent)) {
				return false;
			}
			if (/Chrome/i.test(navigator.userAgent)) {
				return (/Android/i.test(navigator.userAgent));
			}
			if (/Silk/i.test(navigator.userAgent)) {
				return false;
			}
			if (/Android/i.test(navigator.userAgent)) {
				var s = navigator.userAgent.substr(navigator.userAgent.indexOf('Android') + 8, 3);
				return parseFloat(s[0] + s[3]) < 44 ? false : true
			}
		}

	};

	//分页
	component.pager = function ($ele, option) {
		"use strict";
		var defaults = {
			pageIndex: 0,
			pageSize: 10,
			itemCount: 50,
			maxButtonCount: 7,
			prevText: "上一页",
			nextText: "下一页",
			buildPageUrl: null,
			onPageChanged: null
		};

		function Pager($ele, options) {
			this.$ele = $ele;
			this.options = $.extend(defaults, options || {});
			this.init();
		}

		Pager.prototype = {
			constructor: Pager,
			init: function () {
				this.renderHtml();
				this.bindEvent();
			},
			renderHtml: function () {
				var options = this.options;
				options.pageCount = Math.ceil(options.itemCount / options.pageSize);
				var html = [];
				if (options.pageIndex > 0) {
					html.push("<li><a page='" + (options.pageIndex - 1) + "' href='" + this.buildPageUrl(options.pageIndex) + "'>"
						+ options.prevText + "</li>");
				} else {
					html.push("<li class='disabled'><a href='javascript:void(0)'>" + options.prevText + "</a></li>");
				}

				//临时的起始页码中间页码，当页码数量大于显示的最大按钮数时使用
				var tempStartIndex = options.pageIndex - Math.floor(options.maxButtonCount / 2) + 1;
				var endIndex = Math.min(options.pageCount, Math.max(0, tempStartIndex) + options.maxButtonCount) - 1;

				//计算终止页码，通过max计算一排按钮中的第一个按钮的页码，然后计算出页数量
				var startIndex = Math.max(0, endIndex - options.maxButtonCount + 1);

				// 第一页
				if (startIndex > 0) {
					html.push("<li><a href='" + this.buildPageUrl(1) + "' page='" + 0 + "'>1</a></li>");
					html.push("<li><p class='pull-left' style='margin:10px 5px 10px 3px'>...</p></li>");
				}

				//生成页码按钮
				for (var i = startIndex; i <= endIndex; i++) {
					if (options.pageIndex == i) {
						html.push("<li class='active'><a href='javascript:void(0)'>" + (i + 1) + "</a></li>");
					} else {
						html.push('<li><a page="' + i + '" href="' + this.buildPageUrl(i + 1) + '">' + (i + 1) + '</a></li>');
					}
				}

				// 最后一页
				if (endIndex < options.pageCount - 1) {
					html.push("<li><p class='pull-left' style='margin:10px 5px 10px 3px'>...</p></li>");
					html.push("<li><a href='" + this.buildPageUrl(options.pageCount) + "' page='" + (options.pageCount - 1) + "'>" + options.pageCount + "</a></li>");
				}

				//生成下一页的按钮
				if (options.pageIndex < options.pageCount - 1) {
					html.push('<li><a page="' + (options.pageIndex + 1) + '" href="' + this.buildPageUrl(options.pageIndex + 2) + '">' + options.nextText + '</a></li>');
				} else {
					html.push('<li class="disabled"><a>' + options.nextText + '</a></li>');
				}

				this.$ele.html(html.join(""));
			},
			bindEvent: function () {
				var that = this;
				that.$ele.on("click", "a[page]", function () {
					that.options.pageIndex = parseInt($(this).attr("page"), 10);
					that.renderHtml();
					that.options.onPageChanged && that.options.onPageChanged(that.options.pageIndex);
				})
			},
			buildPageUrl: function (pageIndex) {
				if ($.isFunction(this.options.buildPageUrl)) {
					return this.options.buildPageUrl(pageIndex);
				}
				return "javascript:;";
			},
			getPageIndex: function () {
				return this.options.pageIndex;
			},
			setPageIndex: function (pageIndex) {
				this.options.pageIndex = pageIndex;
				this.renderHtml();
			},
			setItemCount: function (itemCount) {
				this.options.pageIndex = 0;
				this.options.itemCount = itemCount;
				this.renderHtml();
			}
		};

		var options = $.extend(defaults, option || {});

		return new Pager($ele, options);
	}

})(window.xm.component, jQuery);


// helper 一些工具方法
namespace('xm.toolkit');
(function (toolkit, $) {
	$.extend(toolkit, {
		getHrefRefs: function (href) {
			var refes = location.search.substring(1),
				opts = {},
				index = 0,
				file = "";

			if (href) {
				var index = href.indexOf("?");

				if (index > 0) {
					refes = href.substring(index + 1);
				}
			}
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
			;

			return opts;
		},
		integerRange: function (value, param) {
			return /^[1-9]\d*$/.test(value) && (parseInt(value, 10) >= param[0] && parseInt(value, 10) <= param[1] );
		},
		cookie: function (name, value, options) {
			if (typeof value != 'undefined') {
				options = options || {};
				if (value === null) {
					value = '';
					options = $.extend({}, options);
					options.expires = -1;
				}
				var expires = '';
				if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
					var date;
					if (typeof options.expires == 'number') {
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 1000));
					} else {
						date = options.expires;
					}
					expires = '; expires=' + date.toUTCString();
				}
				var path = options.path ? '; path=' + (options.path) : '';
				var domain = options.domain ? '; domain=' + (options.domain) : '';
				var secure = options.secure ? '; secure' : '';
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
			} else {
				var cookieValue = null;
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(';');
					for (var i = 0; i < cookies.length; i++) {
						var cookie = $.trim(cookies[i]);
						if (cookie.substring(0, name.length + 1) == (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				return cookieValue;
			}
		},
		countByte: function (str) {
			var size = 0;
			for (var i = 0, l = str.length; i < l; i++) {
				size += str.charCodeAt(i) > 255 ? 2 : 1;
			}
			return size;
		},
		paramOfUrl: function (url) {
			url = url || window.location.href;
			var paramSuit = url.substring(url.indexOf('?') + 1).split("&");
			var paramObj = {};
			for (var i = 0; i < paramSuit.length; i++) {
				var param = paramSuit[i].split('=');
				if (param.length == 2) {
					var key = decodeURIComponent(param[0]),
						val = decodeURIComponent(param[1]);
					if (paramObj.hasOwnProperty(key)) {
						paramObj[key] = jQuery.makeArray(paramObj[key]);
						paramObj[key].push(val);
					} else {
						paramObj[key] = val;
					}
				}
			}
			return paramObj;
		},
		/**
		 * 双字节计算
		 */
		gblen: function (str) {
			return $.trim(str).replace(/[\u2E80-\u9FFF]/ig, 'xx').length;
		},
		/*
		 * 截取指定长度的字符串 str {String} 原始字符串 len {Number} 长度 s {String} 超过指定长度后加后缀。默认为""。可以加"..."
		 */
		cutStr: function (str, len, s) {
			var newstr = '';
			var len2 = 0;
			for (var i = 0; i < str.length; i++) {
				if (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) {
					len2 += 2;
				} else {
					len2++;
				}
			}
			if (len2 <= len) {
				return str;
			}
			len2 = 0;
			s = s || '';
			len = (len > this.gblen(s)) ? len - this.gblen(s) : len;

			for (var i = 0; i < str.length; i++) {
				if (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) {
					len2 += 2;
				} else {
					len2++;
				}
				if (len2 > len) {
					newstr += s;
					break;
				}
				newstr += str.charAt(i);
			}
			return newstr;
		},
		/**
		 * 添加loading效果
		 * @author jason.chen
		 * @date   2015-06-09
		 * @email  jason.chen@ximalaya.com
		 */
		showLoading: function (el) {
			var el = typeof el === 'string' ? $(el) : el;
			var mask = $('.loading-mask');
			if (mask.length > 0) {

			} else {
				mask = $('<div class="loading-mask"><i class="fa fa-spinner fa-spin fa-5x"></i></div>');
			}
			if (el) {
				if (el.css('position') == 'static') {
					el.css('position', 'relative');
				}
				mask.appendTo(el);
			} else {
				mask.appendTo('body');
			}
			mask.show();
		},
		hideLoading: function () {
			if ($('.loading-mask').length > 0) {
				$('.loading-mask').hide();
			}
		},
		/**
		 * 对用户的信息进行的封装
		 * @type {Object}
		 */
		localStorage: {
			get: function (key, isDecoded) {
				var v = localStorage.getItem(key);
				v = (v === undefined ? null : v);
				if (v !== null) {
					return isDecoded ? decodeURIComponent(v) : v;
				}
				return v;
			},
			getJson: function (key, isDecoded) {
				var v = this.get(key, isDecoded);
				if (v) {
					try {
						return JSON.parse(v);
					} catch (e) {
						console && console.log(e);
					}
				}
				return v;
			},
			set: function (key, value, isEncoded) {
				try {
					this.remove(key);
					var v = isEncoded ? encodeURIComponent(value) : value;
					localStorage.setItem(key, v);
				} catch (e) {
					console && console.log(e)
				}
			},
			setJson: function (key, obj, isEncoded) {
				var str = '';
				try {
					str = JSON.stringify(obj);
				} catch (e) {
					console && console.log(e)
				}
				try {
					this.remove(key);
					var v = isEncoded && false ? encodeURIComponent(str) : str;
					localStorage.setItem(key, v);
				} catch (e) {
					console && console.log(e)
				}
			},
			remove: function (key) {
				localStorage.removeItem(key);
			},
			clear: function () {
				localStorage.clear();
			}
		},
		/**
		 * 对$.cook进行的封装
		 */
		cookie: {
			get: function (key, isDecoded) {
				var v = $.cookie(key);
				v = (v === undefined ? null : v);
				if (v !== null) {
					return isDecoded ? decodeURIComponent(v) : v;
				}
				return v
			},
			getJson: function (key, isDecoded) {
				var v = this.get(key, isDecoded);
				if (v) {
					try {
						return JSON.parse(v);
					} catch (e) {
						console && console.log(e);
					}
				}
				return v;
			},
			set: function (key, value, isEncoded) {
				var v = isEncoded ? encodeURIComponent(value) : value;
				$.cookie(key, v, {expires: 20});

			},
			setJson: function (key, obj, isEncoded) {
				var str = '';
				try {
					str = JSON.stringify(obj);
				} catch (e) {
					console && console.log(e)
				}
				str = isEncoded ? encodeURIComponent(str) : str;
				$.cookie(key, str, {expires: 20});
			},
			remove: function (key) {
				$.cookie(key, '', {expires: -1});
			},
			clear: function () {
				// $.cookie();
			}
		}


	});


})(window.xm.toolkit, jQuery);

jQuery.extend(jQuery.easing, {
    easeOutc: function(x, t, b, c, d) {
         return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    }
});

    // 所有页面的基类
function PageBase() {
    $.extend(this, {
        _doInit: function() {
            this._initShortcut();
            this._fixTableHeader();
        },
        _fixTableHeader:function () {

        	$.fn.stickyTableHeaders && $(".fix-table-header").stickyTableHeaders();
        },
        _initShortcut: function() {
            var self = this,
                str = '<div id="shortcut" class="quick-panel">' +
                '<a class="short-item" data-v="1" title="置顶"><i class="fa fa-rocket"></i></a>' +
                '<a class="short-item" data-v="2" title="刷新"><i class="fa fa-refresh"></i></a>' +
                '<a class="short-item" data-v="3" title="上一页"><i class="fa fa-arrow-left"></i></a>' +
                '<a class="short-item" data-v="4" title="下一页"><i class="fa fa-arrow-right"></i></a>' +
                '</div>';
            $('body').append(str);
            var sp = $('#shortcut');
            sp.show();
            sp.find('a').on('click', function() {
                self._doShortCut($(this).attr('data-v'), sp);
            });

        },
        redirect:function(url,timeout){
        	setTimeout(function(){
        		url && (location.href = url)
        	},timeout || 0);
        },
        _doShortCut: function(cmd, panel) {
            switch (cmd) {
                case '1':

                    $('html,body').animate({
                        'scrollTop': 0
                    }, 500,'easeOutc');
                    break;
                case '2':
                    location.reload();
                    break;
                case '3':
                    history.go(-1);
                    break;
                case '4':
                    history.go(1);
                    break;
                case '5':
                    panel.hide();
                    break;
            }
        }
    });

    this._doInit();
}




