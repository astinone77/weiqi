!function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('jquery'));
    } else {
        factory(root.jQuery);
    }
}(this, function ($) {

    /*!
     @package noty - jQuery Notification Plugin
     @version version: 2.3.7
     @contributors https://github.com/needim/noty/graphs/contributors

     @documentation Examples and Documentation - http://needim.github.com/noty/

     @license Licensed under the MIT licenses: http://www.opensource.org/licenses/mit-license.php
     */

    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {
            }

            F.prototype = o;
            return new F();
        };
    }

    var NotyObject = {

        init: function (options) {

            // Mix in the passed in options with the default options
            this.options = $.extend({}, $.noty.defaults, options);

            this.options.layout = (this.options.custom) ? $.noty.layouts['inline'] : $.noty.layouts[this.options.layout];

            if ($.noty.themes[this.options.theme])
                this.options.theme = $.noty.themes[this.options.theme];
            else
                options.themeClassName = this.options.theme;

            delete options.layout;
            delete options.theme;

            this.options = $.extend({}, this.options, this.options.layout.options);
            this.options.id = 'noty_' + (new Date().getTime() * Math.floor(Math.random() * 1000000));

            this.options = $.extend({}, this.options, options);

            // Build the noty dom initial structure
            this._build();

            // return this so we can chain/use the bridge with less code.
            return this;
        }, // end init

        _build: function () {

            // Generating noty bar
            var $bar = $('<div class="noty_bar noty_type_' + this.options.type + '"></div>').attr('id', this.options.id);
            $bar.append(this.options.template).find('.noty_text').html(this.options.text);
            $bar.find('.noty_confirm_title').html(this.options.title);

            this.$bar = (this.options.layout.parent.object !== null) ? $(this.options.layout.parent.object).css(this.options.layout.parent.css).append($bar) : $bar;

            if (this.options.themeClassName) {
                this.$bar.addClass(this.options.themeClassName).addClass('noty_container_type_' + this.options.type);
            }

            // Set buttons if available
            if (this.options.buttons) {

                if (this.options.type !== 'confirm') {
                    this.options.closeWith = [];
                }
                this.options.timeout = false;

                var $buttons = $('<div/>').addClass('noty_buttons');

                (this.options.layout.parent.object !== null) ? this.$bar.find('.noty_bar').append($buttons) : this.$bar.append($buttons);

                var self = this;

                $.each(this.options.buttons, function (i, button) {
                    var $button = $('<button/>').addClass((button.addClass) ? button.addClass : 'gray').html(button.text).attr('id', button.id ? button.id : 'button-' + i)
                        .attr('title', button.title)
                        .appendTo(self.$bar.find('.noty_buttons'))
                        .on('click', function (event) {
                            if ($.isFunction(button.onClick)) {
                                button.onClick.call($button, self, event);
                            }
                        });
                });
            }

            // For easy access
            this.$message = this.$bar.find('.noty_message');
            this.$closeButton = this.$bar.find('.noty_close');
            this.$buttons = this.$bar.find('.noty_buttons');


            $.noty.store[this.options.id] = this; // store noty for api


        }, // end _build

        show: function () {

            var self = this;

            (self.options.custom) ? self.options.custom.find(self.options.layout.container.selector).append(self.$bar) : $(self.options.layout.container.selector).append(self.$bar);

            if (self.options.theme && self.options.theme.style)
                self.options.theme.style.apply(self);

            var optw = self.options.width,
                addCss = optw ? {width: optw} : {};


            ($.type(self.options.layout.css) === 'function') ? this.options.layout.css.apply(self.$bar) : self.$bar.css($.extend(this.options.layout.css, addCss) || {});

            self.$bar.addClass(self.options.layout.addClass);
            self.options.layout.container.style.apply($(self.options.layout.container.selector), [self.options.within]);

            self.showing = true;

            if (self.options.theme && self.options.theme.style) {
                self.options.theme.callback.onShow.apply(this);
            }

            if ($.inArray('click', self.options.closeWith) > -1) {
                self.$bar.css('cursor', 'pointer').one('click', function (evt) {
                    self.stopPropagation(evt);
                    if (self.options.callback.onCloseClick) {
                        self.options.callback.onCloseClick.apply(self);
                    }
                    self.close();
                });
            }

            if ($.inArray('hover', self.options.closeWith) > -1) {
                self.$bar.one('mouseenter', function () {
                    self.close();
                });
            }

            if ($.inArray('button', self.options.closeWith) > -1) {
                self.$closeButton.one('click', function (evt) {
                    self.stopPropagation(evt);
                    self.close();
                });
            }
            if ($.inArray('button', self.options.closeWith) == -1) {
            }
            self.$closeButton.remove();

            if (self.options.callback.onShow) {
                self.options.callback.onShow.apply(self);
            }

            if (typeof self.options.animation.open == 'string') {
                self.$bar.css('height', self.$bar.innerHeight());
                self.$bar.on('click', function (e) {
                    self.wasClicked = true;
                });
                self.$bar.show().addClass(self.options.animation.open).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                    if (self.options.callback.afterShow) self.options.callback.afterShow.apply(self);
                    self.showing = false;
                    self.shown = true;
                    if (self.hasOwnProperty('wasClicked')) {
                        self.$bar.off('click', function (e) {
                            self.wasClicked = true;
                        });
                        self.close();
                    }
                });

            } else {

                self.$bar.animate(
                    self.options.animation.open,
                    self.options.animation.speed,
                    self.options.animation.easing,
                    function () {
                        if (self.options.callback.afterShow) self.options.callback.afterShow.apply(self);
                        self.showing = false;
                        self.shown = true;
                    });
            }


            // If noty is have a timeout option
            if (self.options.timeout)
                self.$bar.delay(self.options.timeout).promise().done(function () {
                    self.close();
                });

            return this;

        }, // end show

        close: function () {

            if (this.closed) return;
            if (this.$bar && this.$bar.hasClass('i-am-closing-now')) return;

            var self = this;

            if (this.showing) {
                self.$bar.queue(
                    function () {
                        self.close.apply(self);
                    }
                );
                return;
            }

            if (!this.shown && !this.showing) { // If we are still waiting in the queue just delete from queue
                var queue = [];
                $.each($.noty.queue, function (i, n) {
                    if (n.options.id != self.options.id) {
                        queue.push(n);
                    }
                });
                $.noty.queue = queue;
                return;
            }

            self.$bar.addClass('i-am-closing-now');

            if (self.options.callback.onClose) {
                self.options.callback.onClose.apply(self);
            }

            if (typeof self.options.animation.close == 'string') {
                self.$bar.addClass(self.options.animation.close).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function () {
                    if (self.options.callback.afterClose) self.options.callback.afterClose.apply(self);
                    self.closeCleanUp();
                });
            } else {
                self.$bar.clearQueue().stop().animate(
                    self.options.animation.close,
                    self.options.animation.speed,
                    self.options.animation.easing,
                    function () {
                        if (self.options.callback.afterClose) self.options.callback.afterClose.apply(self);
                    })
                    .promise().done(function () {
                        self.closeCleanUp();
                    });
            }

        }, // end close

        closeCleanUp: function () {
            var self = this;

            if (self.options.modal) {
                $.notyRenderer.setModalCount(-1);
                if ($.notyRenderer.getModalCount() == 0) {
                    $('.noty_modal').fadeOut(self.options.animation.fadeSpeed, function () {
                        $(this).remove();
                    });
                }
            }


            // Layout Cleaning
            $.notyRenderer.setLayoutCountFor(self, -1);
            if ($.notyRenderer.getLayoutCountFor(self) == 0) $(self.options.layout.container.selector).remove();

            // Make sure self.$bar has not been removed before attempting to remove it
            if (typeof self.$bar !== 'undefined' && self.$bar !== null) {

                if (typeof self.options.animation.close == 'string') {
                    self.$bar.css('transition', 'all 100ms ease').css('border', 0).css('margin', 0).height(0);
                    self.$bar.one('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', function () {
                        self.$bar.remove();
                        self.$bar = null;
                        self.closed = true;

                        if (self.options.theme.callback && self.options.theme.callback.onClose) {
                            self.options.theme.callback.onClose.apply(self);
                        }
                    });
                } else {
                    self.$bar.remove();
                    self.$bar = null;
                    self.closed = true;
                }
            }

            delete $.noty.store[self.options.id]; // deleting noty from store

            if (self.options.theme.callback && self.options.theme.callback.onClose) {
                self.options.theme.callback.onClose.apply(self);
            }

            if (!self.options.dismissQueue) {
                // Queue render
                $.noty.ontap = true;

                $.notyRenderer.render();
            }

            if (self.options.maxVisible > 0 && self.options.dismissQueue) {
                $.notyRenderer.render();
            }

        }, // end close clean up

        setText: function (text) {
            if (!this.closed) {
                this.options.text = text;
                this.$bar.find('.noty_text').html(text);
            }
            return this;
        },

        setType: function (type) {
            if (!this.closed) {
                this.options.type = type;
                this.options.theme.style.apply(this);
                this.options.theme.callback.onShow.apply(this);
            }
            return this;
        },

        setTimeout: function (time) {
            if (!this.closed) {
                var self = this;
                this.options.timeout = time;
                self.$bar.delay(self.options.timeout).promise().done(function () {
                    self.close();
                });
            }
            return this;
        },

        stopPropagation: function (evt) {
            evt = evt || window.event;
            if (typeof evt.stopPropagation !== "undefined") {
                evt.stopPropagation();
            }
            else {
                evt.cancelBubble = true;
            }
        },

        closed: false,
        showing: false,
        shown: false

    }; // end NotyObject

    $.notyRenderer = {};

    $.notyRenderer.init = function (options) {

        // Renderer creates a new noty
        var notification = Object.create(NotyObject).init(options);
        if (notification.options.killer)
            $.noty.closeAll();

        (notification.options.force) ? $.noty.queue.unshift(notification) : $.noty.queue.push(notification);

        $.notyRenderer.render();

        return ($.noty.returns == 'object') ? notification : notification.options.id;
    };

    $.notyRenderer.render = function () {

        var instance = $.noty.queue[0];

        if ($.type(instance) === 'object') {
            if (instance.options.dismissQueue) {
                if (instance.options.maxVisible > 0) {
                    if ($(instance.options.layout.container.selector + ' > li').length < instance.options.maxVisible) {
                        $.notyRenderer.show($.noty.queue.shift());
                    }
                    else {

                    }
                }
                else {

                    $.notyRenderer.show($.noty.queue.shift());
                }
            }
            else {
                if ($.noty.ontap) {
                    $.notyRenderer.show($.noty.queue.shift());
                    $.noty.ontap = false;
                }
            }
        }
        else {
            $.noty.ontap = true; // Queue is over
        }

    };

    $.notyRenderer.show = function (notification) {

        if (notification.options.modal) {
            $.notyRenderer.createModalFor(notification);
            $.notyRenderer.setModalCount(+1);
        }

        // Where is the container?
        if (notification.options.custom) {
            if (notification.options.custom.find(notification.options.layout.container.selector).length == 0) {
                notification.options.custom.append($(notification.options.layout.container.object).addClass('i-am-new'));
            }
            else {
                notification.options.custom.find(notification.options.layout.container.selector).removeClass('i-am-new');
            }
        }
        else {
            if ($(notification.options.layout.container.selector).length == 0) {
                $('body').append($(notification.options.layout.container.object).addClass('i-am-new'));
            }
            else {
                $(notification.options.layout.container.selector).removeClass('i-am-new');
            }
        }

        $.notyRenderer.setLayoutCountFor(notification, +1);

        notification.show();
    };

    $.notyRenderer.createModalFor = function (notification) {
        if ($('.noty_modal').length == 0) {
            var modal = $('<div/>').addClass('noty_modal').addClass($.trim(notification.options.theme) + '_modal').data('noty_modal_count', 0);

            if (notification.options.theme.modal && notification.options.theme.modal.css)
                modal.css(notification.options.theme.modal.css);

            modal.prependTo($('body')).fadeIn(notification.options.animation.fadeSpeed);

            if ($.inArray('backdrop', notification.options.closeWith) > -1)
                modal.on('click', function (e) {
                    $.noty.closeAll();
                });
        }
    };

    $.notyRenderer.getLayoutCountFor = function (notification) {
        return $(notification.options.layout.container.selector).data('noty_layout_count') || 0;
    };

    $.notyRenderer.setLayoutCountFor = function (notification, arg) {
        return $(notification.options.layout.container.selector).data('noty_layout_count', $.notyRenderer.getLayoutCountFor(notification) + arg);
    };

    $.notyRenderer.getModalCount = function () {
        return $('.noty_modal').data('noty_modal_count') || 0;
    };

    $.notyRenderer.setModalCount = function (arg) {
        return $('.noty_modal').data('noty_modal_count', $.notyRenderer.getModalCount() + arg);
    };

    // This is for custom container
    $.fn.noty = function (options) {
        options.custom = $(this);
        return $.notyRenderer.init(options);
    };

    $.noty = {};
    $.noty.queue = [];
    $.noty.ontap = true;
    $.noty.layouts = {};
    $.noty.themes = {};
    $.noty.returns = 'object';
    $.noty.store = {};

    $.noty.get = function (id) {
        return $.noty.store.hasOwnProperty(id) ? $.noty.store[id] : false;
    };

    $.noty.close = function (id) {
        return $.noty.get(id) ? $.noty.get(id).close() : false;
    };

    $.noty.setText = function (id, text) {
        return $.noty.get(id) ? $.noty.get(id).setText(text) : false;
    };

    $.noty.setType = function (id, type) {
        return $.noty.get(id) ? $.noty.get(id).setType(type) : false;
    };

    $.noty.clearQueue = function () {
        $.noty.queue = [];
    };

    $.noty.closeAll = function () {
        $.noty.clearQueue();
        $.each($.noty.store, function (id, noty) {
            noty.close();
        });
    };

    var windowAlert = window.alert;

    $.noty.consumeAlert = function (options) {
        window.alert = function (text) {
            if (options)
                options.text = text;
            else
                options = {text: text};

            $.notyRenderer.init(options);
        };
    };

    $.noty.stopConsumeAlert = function () {
        window.alert = windowAlert;
    };

    $.noty.defaults = {
        layout: 'top',
        theme: 'defaultTheme',
        type: 'alert',
        text: '',
        title: '提示',
        dismissQueue: true,
        template: '<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>',
        animation: {
            open: {height: 'toggle'},
            close: {height: 'toggle'},
            easing: 'swing',
            speed: 500,
            fadeSpeed: 'fast',
        },
        timeout: false,
        force: false,
        modal: false,
        maxVisible: 5,
        killer: false,
        closeWith: ['click'],
        callback: {
            onShow: function () {
            },
            afterShow: function () {
            },
            onClose: function () {
            },
            afterClose: function () {
            },
            onCloseClick: function () {
            }
        },
        buttons: false
    };

    $(window).on('resize', function () {
        $.each($.noty.layouts, function (index, layout) {
            layout.container.style.apply($(layout.container.selector));
        });
    });

    // Helpers
    window.noty = function noty(options) {
        return $.notyRenderer.init(options);
    };

    $.noty.layouts.bottom = {
        name: 'bottom',
        options: {},
        container: {
            object: '<ul id="noty_bottom_layout_container" />',
            selector: 'ul#noty_bottom_layout_container',
            style: function () {
                $(this).css({
                    bottom: 0,
                    left: '5%',
                    position: 'fixed',
                    width: '90%',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 9999999
                });
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none'
        },
        addClass: ''
    };

    $.noty.layouts.bottomCenter = {
        name: 'bottomCenter',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_bottomCenter_layout_container" />',
            selector: 'ul#noty_bottomCenter_layout_container',
            style: function () {
                $(this).css({
                    bottom: 20,
                    left: 0,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                $(this).css({
                    left: ($(window).width() - $(this).outerWidth(false)) / 2 + 'px'
                });
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };


    $.noty.layouts.bottomLeft = {
        name: 'bottomLeft',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_bottomLeft_layout_container" />',
            selector: 'ul#noty_bottomLeft_layout_container',
            style: function () {
                $(this).css({
                    bottom: 20,
                    left: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                if (window.innerWidth < 600) {
                    $(this).css({
                        left: 5
                    });
                }
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.layouts.bottomRight = {
        name: 'bottomRight',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_bottomRight_layout_container" />',
            selector: 'ul#noty_bottomRight_layout_container',
            style: function () {
                $(this).css({
                    bottom: 20,
                    right: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                if (window.innerWidth < 600) {
                    $(this).css({
                        right: 5
                    });
                }
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.layouts.center = {
        name: 'center',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_center_layout_container" />',
            selector: 'ul#noty_center_layout_container',
            style: function () {
                $(this).css({
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                // getting hidden height
                var dupe = $(this).clone().css({
                    visibility: "hidden",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0
                }).attr('id', 'dupe');
                $("body").append(dupe);
                dupe.find('.i-am-closing-now').remove();
                dupe.find('li').css('display', 'block');
                var actual_height = dupe.height();
                dupe.remove();

                if ($(this).hasClass('i-am-new')) {
                    $(this).css({
                        left: ($(window).width() - $(this).outerWidth(false)) / 2 + 'px',
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    });
                }
                else {
                    $(this).animate({
                        left: ($(window).width() - $(this).outerWidth(false)) / 2 + 'px',
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    }, 500);
                }

            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.layouts.centerLeft = {
        name: 'centerLeft',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_centerLeft_layout_container" />',
            selector: 'ul#noty_centerLeft_layout_container',
            style: function () {
                $(this).css({
                    left: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                // getting hidden height
                var dupe = $(this).clone().css({
                    visibility: "hidden",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0
                }).attr('id', 'dupe');
                $("body").append(dupe);
                dupe.find('.i-am-closing-now').remove();
                dupe.find('li').css('display', 'block');
                var actual_height = dupe.height();
                dupe.remove();

                if ($(this).hasClass('i-am-new')) {
                    $(this).css({
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    });
                }
                else {
                    $(this).animate({
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    }, 500);
                }

                if (window.innerWidth < 600) {
                    $(this).css({
                        left: 5
                    });
                }

            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };

    $.noty.layouts.centerRight = {
        name: 'centerRight',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_centerRight_layout_container" />',
            selector: 'ul#noty_centerRight_layout_container',
            style: function () {
                $(this).css({
                    right: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                // getting hidden height
                var dupe = $(this).clone().css({
                    visibility: "hidden",
                    display: "block",
                    position: "absolute",
                    top: 0,
                    left: 0
                }).attr('id', 'dupe');
                $("body").append(dupe);
                dupe.find('.i-am-closing-now').remove();
                dupe.find('li').css('display', 'block');
                var actual_height = dupe.height();
                dupe.remove();

                if ($(this).hasClass('i-am-new')) {
                    $(this).css({
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    });
                }
                else {
                    $(this).animate({
                        top: ($(window).height() - actual_height) / 2 + 'px'
                    }, 500);
                }

                if (window.innerWidth < 600) {
                    $(this).css({
                        right: 5
                    });
                }

            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.layouts.inline = {
        name: 'inline',
        options: {},
        container: {
            object: '<ul class="noty_inline_layout_container" />',
            selector: 'ul.noty_inline_layout_container',
            style: function () {
                $(this).css({
                    width: '100%',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 9999999
                });
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none'
        },
        addClass: ''
    };
    $.noty.layouts.top = {
        name: 'top',
        options: {},
        container: {
            object: '<ul id="noty_top_layout_container" />',
            selector: 'ul#noty_top_layout_container',
            style: function () {
                $(this).css({
                    top: 0,
                    left: '5%',
                    position: 'fixed',
                    width: '90%',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 9999999
                });
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none'
        },
        addClass: ''
    };
    $.noty.layouts.topCenter = {
        name: 'topCenter',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_topCenter_layout_container" />',
            selector: 'ul#noty_topCenter_layout_container',
            style: function (p) {
                var con = $(this);
                if (p) {
                    con.attr('data-w', p.width);
                }
                $(this).css({
                    top: 20,
                    left: 0,
                    position: 'fixed',
                    width: con.attr('data-w') || '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10001
                });

                $(this).css({
                    left: ($(window).width() - $(this).outerWidth(false)) / 2 + 'px'
                });
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };

    $.noty.layouts.topLeft = {
        name: 'topLeft',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_topLeft_layout_container" />',
            selector: 'ul#noty_topLeft_layout_container',
            style: function () {
                $(this).css({
                    top: 20,
                    left: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                if (window.innerWidth < 600) {
                    $(this).css({
                        left: 5
                    });
                }
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.layouts.topRight = {
        name: 'topRight',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_topRight_layout_container" />',
            selector: 'ul#noty_topRight_layout_container',
            style: function () {
                $(this).css({
                    top: 20,
                    right: 20,
                    position: 'fixed',
                    width: '310px',
                    height: 'auto',
                    margin: 0,
                    padding: 0,
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                if (window.innerWidth < 600) {
                    $(this).css({
                        right: 5
                    });
                }
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {}
        },
        css: {
            display: 'none',
            width: '310px'
        },
        addClass: ''
    };
    $.noty.themes.bootstrapTheme = {
        name: 'bootstrapTheme',
        modal: {
            css: {
                position: 'fixed',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                zIndex: 10000,
                opacity: 0.6,
                display: 'none',
                left: 0,
                top: 0
            }
        },
        style: function () {

            var containerSelector = this.options.layout.container.selector;
            $(containerSelector).addClass('list-group');

            this.$closeButton.append('<span aria-hidden="true">&times;</span><span class="sr-only">Close</span>');
            this.$closeButton.addClass('close');

            this.$bar.addClass("list-group-item").css('padding', '0px');

            switch (this.options.type) {
                case 'alert':
                case 'notification':
                    this.$bar.addClass("list-group-item-info");
                    break;
                case 'warning':
                    this.$bar.addClass("list-group-item-warning");
                    break;
                case 'error':
                    this.$bar.addClass("list-group-item-danger");
                    break;
                case 'information':
                    this.$bar.addClass("list-group-item-info");
                    break;
                case 'success':
                    this.$bar.addClass("list-group-item-success");
                    break;
            }

            this.$message.css({
                fontSize: '13px',
                lineHeight: '16px',
                textAlign: 'center',
                padding: '8px 10px 9px',
                width: 'auto',
                position: 'relative'
            });
        },
        callback: {
            onShow: function () {
            },
            onClose: function () {
            }
        }
    };

    /* default theme */
    $.noty.themes.defaultTheme = {
        name: 'defaultTheme',
        helpers: {
            borderFix: function () {
                if (this.options.dismissQueue) {
                    var selector = this.options.layout.container.selector + ' ' + this.options.layout.parent.selector;
                    switch (this.options.layout.name) {
                        case 'top':
                            $(selector).css({borderRadius: '0px 0px 0px 0px'});
                            $(selector).last().css({borderRadius: '0px 0px 5px 5px'});
                            break;
                        case 'topCenter':
                        case 'topLeft':
                        case 'topRight':
                        case 'bottomCenter':
                        case 'bottomLeft':
                        case 'bottomRight':
                        case 'center':
                        case 'centerLeft':
                        case 'centerRight':
                        case 'inline':
                            $(selector).css({borderRadius: '0px 0px 0px 0px'});
                            $(selector).first().css({
                                'border-top-left-radius': '5px',
                                'border-top-right-radius': '5px'
                            });
                            $(selector).last().css({
                                'border-bottom-left-radius': '5px',
                                'border-bottom-right-radius': '5px'
                            });
                            break;
                        case 'bottom':
                            $(selector).css({borderRadius: '0px 0px 0px 0px'});
                            $(selector).first().css({borderRadius: '5px 5px 0px 0px'});
                            break;
                        default:
                            break;
                    }
                }
            }
        },
        modal: {
            css: {
                position: 'fixed',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                zIndex: 10000,
                opacity: 0.6,
                display: 'none',
                left: 0,
                top: 0
            }
        },
        style: function () {

            this.$bar.css({
                overflow: 'hidden',
                background: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAoCAQAAAClM0ndAAAAhklEQVR4AdXO0QrCMBBE0bttkk38/w8WRERpdyjzVOc+HxhIHqJGMQcFFkpYRQotLLSw0IJ5aBdovruMYDA/kT8plF9ZKLFQcgF18hDj1SbQOMlCA4kao0iiXmah7qBWPdxpohsgVZyj7e5I9KcID+EhiDI5gxBYKLBQYKHAQoGFAoEks/YEGHYKB7hFxf0AAAAASUVORK5CYII=') repeat-x scroll left top #fff"
            });

            this.$message.css({
                fontSize: '13px',
                lineHeight: '16px',
                textAlign: 'center',
                padding: '8px 10px 9px',
                width: 'auto',
                position: 'relative'
            });

            this.$closeButton.css({
                position: 'absolute',
                top: 4, right: 4,
                width: 10, height: 10,
                background: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAxUlEQVR4AR3MPUoDURSA0e++uSkkOxC3IAOWNtaCIDaChfgXBMEZbQRByxCwk+BasgQRZLSYoLgDQbARxry8nyumPcVRKDfd0Aa8AsgDv1zp6pYd5jWOwhvebRTbzNNEw5BSsIpsj/kurQBnmk7sIFcCF5yyZPDRG6trQhujXYosaFoc+2f1MJ89uc76IND6F9BvlXUdpb6xwD2+4q3me3bysiHvtLYrUJto7PD/ve7LNHxSg/woN2kSz4txasBdhyiz3ugPGetTjm3XRokAAAAASUVORK5CYII=)",
                display: 'none',
                cursor: 'pointer'
            });

            this.$buttons.css({
                padding: 5,
                textAlign: 'right',
                borderTop: '1px solid #ccc',
                backgroundColor: '#fff'
            });

            this.$buttons.find('button').css({
                marginLeft: 5
            });

            this.$buttons.find('button:first').css({
                marginLeft: 0
            });

            this.$bar.on({
                mouseenter: function () {
                    $(this).find('.noty_close').stop().fadeTo('normal', 1);
                },
                mouseleave: function () {
                    $(this).find('.noty_close').stop().fadeTo('normal', 0);
                }
            });

            switch (this.options.layout.name) {
                case 'top':
                    this.$bar.css({
                        borderRadius: '0px 0px 5px 5px',
                        borderBottom: '2px solid #eee',
                        borderLeft: '2px solid #eee',
                        borderRight: '2px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
                case 'topCenter':
                case 'center':
                case 'bottomCenter':
                case 'inline':
                    this.$bar.css({
                        borderRadius: '5px',
                        border: '1px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    this.$message.css({fontSize: '13px', textAlign: 'center'});
                    break;
                case 'topLeft':
                case 'topRight':
                case 'bottomLeft':
                case 'bottomRight':
                case 'centerLeft':
                case 'centerRight':
                    this.$bar.css({
                        borderRadius: '5px',
                        border: '1px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    this.$message.css({fontSize: '13px', textAlign: 'left'});
                    break;
                case 'bottom':
                    this.$bar.css({
                        borderRadius: '5px 5px 0px 0px',
                        borderTop: '2px solid #eee',
                        borderLeft: '2px solid #eee',
                        borderRight: '2px solid #eee',
                        boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
                default:
                    this.$bar.css({
                        border: '2px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
            }

            switch (this.options.type) {
                case 'alert':
                case 'notification':
                    this.$bar.css({backgroundColor: '#FFF', borderColor: '#CCC', color: '#444'});
                    break;
                case 'warning':
                    this.$bar.css({backgroundColor: '#FFEAA8', borderColor: '#FFC237', color: '#826200'});
                    this.$buttons.css({borderTop: '1px solid #FFC237'});
                    break;
                case 'error':
                    this.$bar.css({backgroundColor: 'red', borderColor: 'darkred', color: '#FFF'});
                    this.$message.css({fontWeight: 'bold'});
                    this.$buttons.css({borderTop: '1px solid darkred'});
                    break;
                case 'information':
                    this.$bar.css({backgroundColor: '#57B7E2', borderColor: '#0B90C4', color: '#FFF'});
                    this.$buttons.css({borderTop: '1px solid #0B90C4'});
                    break;
                case 'success':
                    this.$bar.css({backgroundColor: 'lightgreen', borderColor: '#50C24E', color: 'darkgreen'});
                    this.$buttons.css({borderTop: '1px solid #50C24E'});
                    break;
                default:
                    this.$bar.css({backgroundColor: '#FFF', borderColor: '#CCC', color: '#444'});
                    break;
            }
        },
        callback: {
            onShow: function () {
                $.noty.themes.defaultTheme.helpers.borderFix.apply(this);
            },
            onClose: function () {
                $.noty.themes.defaultTheme.helpers.borderFix.apply(this);
            }
        }
    };

    $.noty.themes.relax = {
        name: 'relax',
        helpers: {},
        modal: {
            css: {
                position: 'fixed',
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                zIndex: 10000,
                opacity: 0.6,
                display: 'none',
                left: 0,
                top: 0
            }
        },
        style: function () {

            this.$bar.css({
                overflow: 'hidden',
                margin: '4px 0',
                borderRadius: '2px'
            });

            this.$message.css({
                fontSize: '14px',
                lineHeight: '16px',
                textAlign: 'center',
                padding: '10px',
                width: 'auto',
                position: 'relative'
            });

            this.$closeButton.css({
                position: 'absolute',
                top: 4, right: 4,
                width: 10, height: 10,
                background: "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAAxUlEQVR4AR3MPUoDURSA0e++uSkkOxC3IAOWNtaCIDaChfgXBMEZbQRByxCwk+BasgQRZLSYoLgDQbARxry8nyumPcVRKDfd0Aa8AsgDv1zp6pYd5jWOwhvebRTbzNNEw5BSsIpsj/kurQBnmk7sIFcCF5yyZPDRG6trQhujXYosaFoc+2f1MJ89uc76IND6F9BvlXUdpb6xwD2+4q3me3bysiHvtLYrUJto7PD/ve7LNHxSg/woN2kSz4txasBdhyiz3ugPGetTjm3XRokAAAAASUVORK5CYII=)",
                display: 'none',
                cursor: 'pointer'
            });

            this.$buttons.css({
                padding: 5,
                textAlign: 'right',
                borderTop: '1px solid #ccc',
                backgroundColor: '#fff'
            });

            this.$buttons.find('button').css({
                marginLeft: 5
            });

            this.$buttons.find('button:first').css({
                marginLeft: 0
            });

            this.$bar.on({
                mouseenter: function () {
                    $(this).find('.noty_close').stop().fadeTo('normal', 1);
                },
                mouseleave: function () {
                    $(this).find('.noty_close').stop().fadeTo('normal', 0);
                }
            });

            switch (this.options.layout.name) {
                case 'top':
                    this.$bar.css({
                        borderBottom: '2px solid #eee',
                        borderLeft: '2px solid #eee',
                        borderRight: '2px solid #eee',
                        borderTop: '2px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
                case 'topCenter':
                case 'center':
                case 'bottomCenter':
                case 'inline':
                    this.$bar.css({
                        border: '1px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    this.$message.css({fontSize: '13px', textAlign: 'center'});
                    break;
                case 'topLeft':
                case 'topRight':
                case 'bottomLeft':
                case 'bottomRight':
                case 'centerLeft':
                case 'centerRight':
                    this.$bar.css({
                        border: '1px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    this.$message.css({fontSize: '13px', textAlign: 'left'});
                    break;
                case 'bottom':
                    this.$bar.css({
                        borderTop: '2px solid #eee',
                        borderLeft: '2px solid #eee',
                        borderRight: '2px solid #eee',
                        borderBottom: '2px solid #eee',
                        boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
                default:
                    this.$bar.css({
                        border: '2px solid #eee',
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                    });
                    break;
            }

            switch (this.options.type) {
                case 'alert':
                case 'notification':
                    this.$bar.css({backgroundColor: '#FFF', borderColor: '#dedede', color: '#444'});
                    break;
                case 'warning':
                    this.$bar.css({backgroundColor: '#FFEAA8', borderColor: '#FFC237', color: '#826200'});
                    this.$buttons.css({borderTop: '1px solid #FFC237'});
                    break;
                case 'error':
                    this.$bar.css({backgroundColor: '#FF8181', borderColor: '#e25353', color: '#FFF'});
                    this.$message.css({fontWeight: 'bold'});
                    this.$buttons.css({borderTop: '1px solid darkred'});
                    break;
                case 'information':
                    this.$bar.css({backgroundColor: '#78C5E7', borderColor: '#3badd6', color: '#FFF'});
                    this.$buttons.css({borderTop: '1px solid #0B90C4'});
                    break;
                case 'success':
                    this.$bar.css({backgroundColor: '#BCF5BC', borderColor: '#7cdd77', color: 'darkgreen'});
                    this.$buttons.css({borderTop: '1px solid #50C24E'});
                    break;
                default:
                    this.$bar.css({backgroundColor: '#FFF', borderColor: '#CCC', color: '#444'});
                    break;
            }
        },
        callback: {
            onShow: function () {

            },
            onClose: function () {

            }
        }
    };


    return window.noty;

});


(function (root, factory) {

    "use strict";

    // CommonJS module is defined
    if (typeof module !== 'undefined' && module.exports) {
        var isNode = (typeof process !== "undefined");
        var isElectron = isNode && ('electron' in process.versions);
        if (isElectron) {
            root.BootstrapDialog = factory(root.jQuery);
        } else {
            module.exports = factory(require('jquery'), require('bootstrap'));
        }
    }
    // AMD module is defined
    else if (typeof define === "function" && define.amd) {
        define("bootstrap-dialog", ["jquery", "bootstrap"], function ($) {
            return factory($);
        });
    } else {
        // planted over the root!
        root.BootstrapDialog = factory(root.jQuery);
    }

}(this, function ($) {

    "use strict";

    /* ================================================
     * Definition of BootstrapDialogModal.
     * Extend Bootstrap Modal and override some functions.
     * BootstrapDialogModal === Modified Modal.
     * ================================================ */
    var Modal = $.fn.modal.Constructor;
    var BootstrapDialogModal = function (element, options) {
        Modal.call(this, element, options);
    };
    BootstrapDialogModal.getModalVersion = function () {
        var version = null;
        if (typeof $.fn.modal.Constructor.VERSION === 'undefined') {
            version = 'v3.1';
        } else if (/3\.2\.\d+/.test($.fn.modal.Constructor.VERSION)) {
            version = 'v3.2';
        } else if (/3\.3\.[1,2]/.test($.fn.modal.Constructor.VERSION)) {
            version = 'v3.3';  // v3.3.1, v3.3.2
        } else {
            version = 'v3.3.4';
        }

        return version;
    };
    BootstrapDialogModal.ORIGINAL_BODY_PADDING = parseInt(($('body').css('padding-right') || 0), 10);
    BootstrapDialogModal.METHODS_TO_OVERRIDE = {};
    BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.1'] = {};
    BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.2'] = {
        hide: function (e) {
            if (e) {
                e.preventDefault();
            }
            e = $.Event('hide.bs.modal');

            this.$element.trigger(e);

            if (!this.isShown || e.isDefaultPrevented()) {
                return;
            }

            this.isShown = false;

            // Remove css class 'modal-open' when the last opened dialog is closing.
            var openedDialogs = this.getGlobalOpenedDialogs();
            if (openedDialogs.length === 0) {
                this.$body.removeClass('modal-open');
            }

            this.resetScrollbar();
            this.escape();

            $(document).off('focusin.bs.modal');

            this.$element
                .removeClass('in')
                .attr('aria-hidden', true)
                .off('click.dismiss.bs.modal');

            $.support.transition && this.$element.hasClass('fade') ?
                this.$element
                    .one('bsTransitionEnd', $.proxy(this.hideModal, this))
                    .emulateTransitionEnd(300) :
                this.hideModal();
        }
    };
    BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3'] = {
        /**
         * Overrided.
         *
         * @returns {undefined}
         */
        setScrollbar: function () {
            var bodyPad = BootstrapDialogModal.ORIGINAL_BODY_PADDING;
            if (this.bodyIsOverflowing) {
                this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
            }
        },
        /**
         * Overrided.
         *
         * @returns {undefined}
         */
        resetScrollbar: function () {
            var openedDialogs = this.getGlobalOpenedDialogs();
            if (openedDialogs.length === 0) {
                this.$body.css('padding-right', BootstrapDialogModal.ORIGINAL_BODY_PADDING);
            }
        },
        /**
         * Overrided.
         *
         * @returns {undefined}
         */
        hideModal: function () {
            this.$element.hide();
            this.backdrop($.proxy(function () {
                var openedDialogs = this.getGlobalOpenedDialogs();
                if (openedDialogs.length === 0) {
                    this.$body.removeClass('modal-open');
                }
                this.resetAdjustments();
                this.resetScrollbar();
                this.$element.trigger('hidden.bs.modal');
            }, this));
        }
    };
    BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3.4'] = $.extend({}, BootstrapDialogModal.METHODS_TO_OVERRIDE['v3.3']);
    BootstrapDialogModal.prototype = {
        constructor: BootstrapDialogModal,
        /**
         * New function, to get the dialogs that opened by BootstrapDialog.
         *
         * @returns {undefined}
         */
        getGlobalOpenedDialogs: function () {
            var openedDialogs = [];
            $.each(BootstrapDialog.dialogs, function (id, dialogInstance) {
                if (dialogInstance.isRealized() && dialogInstance.isOpened()) {
                    openedDialogs.push(dialogInstance);
                }
            });

            return openedDialogs;
        }
    };

    // Add compatible methods.
    BootstrapDialogModal.prototype = $.extend(BootstrapDialogModal.prototype, Modal.prototype, BootstrapDialogModal.METHODS_TO_OVERRIDE[BootstrapDialogModal.getModalVersion()]);

    /* ================================================
     * Definition of BootstrapDialog.
     * ================================================ */
    var BootstrapDialog = function (options) {
        this.defaultOptions = $.extend(true, {
            id: BootstrapDialog.newGuid(),
            buttons: [],
            data: {},
            onshow: null,
            onshown: null,
            onhide: null,
            onhidden: null
        }, BootstrapDialog.defaultOptions);
        this.indexedButtons = {};
        this.registeredButtonHotkeys = {};
        this.draggableData = {
            isMouseDown: false,
            mouseOffset: {}
        };
        this.realized = false;
        this.opened = false;
        this.initOptions(options);
        this.holdThisInstance();
    };

    BootstrapDialog.BootstrapDialogModal = BootstrapDialogModal;

    /**
     *  Some constants.
     */
    BootstrapDialog.NAMESPACE = 'bootstrap-dialog';
    BootstrapDialog.TYPE_DEFAULT = 'type-default';
    BootstrapDialog.TYPE_INFO = 'type-info';
    BootstrapDialog.TYPE_PRIMARY = 'type-primary';
    BootstrapDialog.TYPE_SUCCESS = 'type-success';
    BootstrapDialog.TYPE_WARNING = 'type-warning';
    BootstrapDialog.TYPE_DANGER = 'type-danger';
    BootstrapDialog.DEFAULT_TEXTS = {};
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_DEFAULT] = 'Information';
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_INFO] = 'Information';
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_PRIMARY] = 'Information';
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_SUCCESS] = 'Success';
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_WARNING] = 'Warning';
    BootstrapDialog.DEFAULT_TEXTS[BootstrapDialog.TYPE_DANGER] = 'Danger';
    BootstrapDialog.DEFAULT_TEXTS['OK'] = 'OK';
    BootstrapDialog.DEFAULT_TEXTS['CANCEL'] = 'Cancel';
    BootstrapDialog.DEFAULT_TEXTS['CONFIRM'] = 'Confirmation';
    BootstrapDialog.SIZE_NORMAL = 'size-normal';
    BootstrapDialog.SIZE_SMALL = 'size-small';
    BootstrapDialog.SIZE_WIDE = 'size-wide';    // size-wide is equal to modal-lg
    BootstrapDialog.SIZE_LARGE = 'size-large';
    BootstrapDialog.BUTTON_SIZES = {};
    BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_NORMAL] = '';
    BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_SMALL] = '';
    BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_WIDE] = '';
    BootstrapDialog.BUTTON_SIZES[BootstrapDialog.SIZE_LARGE] = 'btn-lg';
    BootstrapDialog.ICON_SPINNER = 'glyphicon glyphicon-asterisk';

    /**
     * Default options.
     */
    BootstrapDialog.defaultOptions = {
        type: BootstrapDialog.TYPE_PRIMARY,
        size: BootstrapDialog.SIZE_NORMAL,
        cssClass: '',
        title: null,
        message: null,
        nl2br: true,
        closable: true,
        closeByBackdrop: true,
        closeByKeyboard: true,
        spinicon: BootstrapDialog.ICON_SPINNER,
        autodestroy: true,
        draggable: false,
        animate: true,
        description: '',
        tabindex: -1,
        width: ''
    };

    /**
     * Config default options.
     */
    BootstrapDialog.configDefaultOptions = function (options) {
        BootstrapDialog.defaultOptions = $.extend(true, BootstrapDialog.defaultOptions, options);
    };

    /**
     * Open / Close all created dialogs all at once.
     */
    BootstrapDialog.dialogs = {};
    BootstrapDialog.openAll = function () {
        $.each(BootstrapDialog.dialogs, function (id, dialogInstance) {
            dialogInstance.open();
        });
    };
    BootstrapDialog.closeAll = function () {
        $.each(BootstrapDialog.dialogs, function (id, dialogInstance) {
            dialogInstance.close();
        });
    };

    /**
     * Get dialog instance by given id.
     *
     * @returns dialog instance
     */
    BootstrapDialog.getDialog = function (id) {
        var dialog = null;
        if (typeof BootstrapDialog.dialogs[id] !== 'undefined') {
            dialog = BootstrapDialog.dialogs[id];
        }

        return dialog;
    };

    /**
     * Set a dialog.
     *
     * @returns the dialog that has just been set.
     */
    BootstrapDialog.setDialog = function (dialog) {
        BootstrapDialog.dialogs[dialog.getId()] = dialog;

        return dialog;
    };

    /**
     * Alias of BootstrapDialog.setDialog(dialog)
     *
     * @param {type} dialog
     * @returns {unresolved}
     */
    BootstrapDialog.addDialog = function (dialog) {
        return BootstrapDialog.setDialog(dialog);
    };

    /**
     * Move focus to next visible dialog.
     */
    BootstrapDialog.moveFocus = function () {
        var lastDialogInstance = null;
        $.each(BootstrapDialog.dialogs, function (id, dialogInstance) {
            lastDialogInstance = dialogInstance;
        });
        if (lastDialogInstance !== null && lastDialogInstance.isRealized()) {
            lastDialogInstance.getModal().focus();
        }
    };

    BootstrapDialog.METHODS_TO_OVERRIDE = {};
    BootstrapDialog.METHODS_TO_OVERRIDE['v3.1'] = {
        handleModalBackdropEvent: function () {
            this.getModal().on('click', {dialog: this}, function (event) {
                event.target === this && event.data.dialog.isClosable() && event.data.dialog.canCloseByBackdrop() && event.data.dialog.close();
            });

            return this;
        },
        /**
         * To make multiple opened dialogs look better.
         *
         * Will be removed in later version, after Bootstrap Modal >= 3.3.0, updating z-index is unnecessary.
         */
        updateZIndex: function () {
            var zIndexBackdrop = 1040;
            var zIndexModal = 1050;
            var dialogCount = 0;
            $.each(BootstrapDialog.dialogs, function (dialogId, dialogInstance) {
                dialogCount++;
            });
            var $modal = this.getModal();
            var $backdrop = $modal.data('bs.modal').$backdrop;
            $modal.css('z-index', zIndexModal + (dialogCount - 1) * 20);
            $backdrop.css('z-index', zIndexBackdrop + (dialogCount - 1) * 20);

            return this;
        },
        open: function () {
            !this.isRealized() && this.realize();
            this.getModal().modal('show');
            this.updateZIndex();

            return this;
        }
    };
    BootstrapDialog.METHODS_TO_OVERRIDE['v3.2'] = {
        handleModalBackdropEvent: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['handleModalBackdropEvent'],
        updateZIndex: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['updateZIndex'],
        open: BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']['open']
    };
    BootstrapDialog.METHODS_TO_OVERRIDE['v3.3'] = {};
    BootstrapDialog.METHODS_TO_OVERRIDE['v3.3.4'] = $.extend({}, BootstrapDialog.METHODS_TO_OVERRIDE['v3.1']);
    BootstrapDialog.prototype = {
        constructor: BootstrapDialog,
        initOptions: function (options) {
            this.options = $.extend(true, this.defaultOptions, options);

            return this;
        },
        holdThisInstance: function () {
            BootstrapDialog.addDialog(this);

            return this;
        },
        initModalStuff: function () {
            this.setModal(this.createModal())
                .setModalDialog(this.createModalDialog())
                .setModalContent(this.createModalContent())
                .setModalHeader(this.createModalHeader())
                .setModalBody(this.createModalBody())
                .setModalFooter(this.createModalFooter());

            this.getModal().append(this.getModalDialog());
            this.getModalDialog().append(this.getModalContent());
            this.getModalContent()
                .append(this.getModalHeader())
                .append(this.getModalBody())
                .append(this.getModalFooter());

            return this;
        },
        createModal: function () {
            var $modal = $('<div class="modal" role="dialog" aria-hidden="true"></div>');
            $modal.prop('id', this.getId());
            $modal.attr('aria-labelledby', this.getId() + '_title');

            return $modal;
        },
        getModal: function () {
            return this.$modal;
        },
        setModal: function ($modal) {
            this.$modal = $modal;

            return this;
        },
        createModalDialog: function () {
            var w = this.options.width,
                style = '';
            if (w) {
                style = 'width:' + w;
            }
            return $('<div class="modal-dialog" style="' + (w ? style : '') + '"></div>');
        },
        getModalDialog: function () {
            return this.$modalDialog;
        },
        setModalDialog: function ($modalDialog) {
            this.$modalDialog = $modalDialog;

            return this;
        },
        createModalContent: function () {
            return $('<div class="modal-content"></div>');
        },
        getModalContent: function () {
            return this.$modalContent;
        },
        setModalContent: function ($modalContent) {
            this.$modalContent = $modalContent;

            return this;
        },
        createModalHeader: function () {
            return $('<div class="modal-header"></div>');
        },
        getModalHeader: function () {
            return this.$modalHeader;
        },
        setModalHeader: function ($modalHeader) {
            this.$modalHeader = $modalHeader;
            return this;
        },
        createModalBody: function () {
            return $('<div class="modal-body"></div>');
        },
        getModalBody: function () {
            return this.$modalBody;
        },
        setModalBody: function ($modalBody) {
            this.$modalBody = $modalBody;

            return this;
        },
        createModalFooter: function () {
            return $('<div class="modal-footer"></div>');
        },
        getModalFooter: function () {
            return this.$modalFooter;
        },
        setModalFooter: function ($modalFooter) {
            this.$modalFooter = $modalFooter;

            return this;
        },
        createDynamicContent: function (rawContent) {
            var content = null;
            if (typeof rawContent === 'function') {
                content = rawContent.call(rawContent, this);
            } else {
                content = rawContent;
            }
            if (typeof content === 'string') {
                content = this.formatStringContent(content);
            }
            return content;
        },
        formatStringContent: function (content) {
            if (this.options.nl2br) {
                return content.replace(/\r\n/g, '<br />').replace(/[\r\n]/g, '<br />');
            }

            return content;
        },
        setData: function (key, value) {
            this.options.data[key] = value;

            return this;
        },
        getData: function (key) {
            return this.options.data[key];
        },
        setId: function (id) {
            this.options.id = id;

            return this;
        },
        getId: function () {
            return this.options.id;
        },
        getType: function () {
            return this.options.type;
        },
        setType: function (type) {
            this.options.type = type;
            this.updateType();

            return this;
        },
        updateType: function () {
            if (this.isRealized()) {
                var types = [BootstrapDialog.TYPE_DEFAULT,
                    BootstrapDialog.TYPE_INFO,
                    BootstrapDialog.TYPE_PRIMARY,
                    BootstrapDialog.TYPE_SUCCESS,
                    BootstrapDialog.TYPE_WARNING,
                    BootstrapDialog.TYPE_DANGER];

                this.getModal().removeClass(types.join(' ')).addClass(this.getType());
            }

            return this;
        },
        getSize: function () {
            return this.options.size;
        },
        setSize: function (size) {
            this.options.size = size;
            this.updateSize();

            return this;
        },
        updateSize: function () {
            if (this.isRealized()) {
                var dialog = this;

                // Dialog size
                this.getModal().removeClass(BootstrapDialog.SIZE_NORMAL)
                    .removeClass(BootstrapDialog.SIZE_SMALL)
                    .removeClass(BootstrapDialog.SIZE_WIDE)
                    .removeClass(BootstrapDialog.SIZE_LARGE);
                this.getModal().addClass(this.getSize());

                // Smaller dialog.
                this.getModalDialog().removeClass('modal-sm');
                if (this.getSize() === BootstrapDialog.SIZE_SMALL) {
                    this.getModalDialog().addClass('modal-sm');
                }

                // Wider dialog.
                this.getModalDialog().removeClass('modal-lg');
                if (this.getSize() === BootstrapDialog.SIZE_WIDE) {
                    this.getModalDialog().addClass('modal-lg');
                }

                // Button size
                $.each(this.options.buttons, function (index, button) {
                    var $button = dialog.getButton(button.id);
                    var buttonSizes = ['btn-lg', 'btn-sm', 'btn-xs'];
                    var sizeClassSpecified = false;
                    if (typeof button['cssClass'] === 'string') {
                        var btnClasses = button['cssClass'].split(' ');
                        $.each(btnClasses, function (index, btnClass) {
                            if ($.inArray(btnClass, buttonSizes) !== -1) {
                                sizeClassSpecified = true;
                            }
                        });
                    }
                    if (!sizeClassSpecified) {
                        $button.removeClass(buttonSizes.join(' '));
                        $button.addClass(dialog.getButtonSize());
                    }
                });
            }

            return this;
        },
        getCssClass: function () {
            return this.options.cssClass;
        },
        setCssClass: function (cssClass) {
            this.options.cssClass = cssClass;

            return this;
        },
        getTitle: function () {
            return this.options.title;
        },
        setTitle: function (title) {
            this.options.title = title;
            this.updateTitle();

            return this;
        },
        updateTitle: function () {
            if (this.isRealized()) {
                var title = this.getTitle() !== null ? this.createDynamicContent(this.getTitle()) : this.getDefaultText();
                this.getModalHeader().find('.' + this.getNamespace('title')).html('').append(title).prop('id', this.getId() + '_title');
            }

            return this;
        },
        getMessage: function () {
            return this.options.message;
        },
        setMessage: function (message) {
            this.options.message = message;
            this.updateMessage();

            return this;
        },
        updateMessage: function () {
            if (this.isRealized()) {
                var message = this.createDynamicContent(this.getMessage());
                this.getModalBody().find('.' + this.getNamespace('message')).html('').append(message);
            }

            return this;
        },
        isClosable: function () {
            return this.options.closable;
        },
        setClosable: function (closable) {
            this.options.closable = closable;
            this.updateClosable();

            return this;
        },
        setCloseByBackdrop: function (closeByBackdrop) {
            this.options.closeByBackdrop = closeByBackdrop;

            return this;
        },
        canCloseByBackdrop: function () {
            return this.options.closeByBackdrop;
        },
        setCloseByKeyboard: function (closeByKeyboard) {
            this.options.closeByKeyboard = closeByKeyboard;

            return this;
        },
        canCloseByKeyboard: function () {
            return this.options.closeByKeyboard;
        },
        isAnimate: function () {
            return this.options.animate;
        },
        setAnimate: function (animate) {
            this.options.animate = animate;

            return this;
        },
        updateAnimate: function () {
            if (this.isRealized()) {
                this.getModal().toggleClass('fade', this.isAnimate());
            }

            return this;
        },
        getSpinicon: function () {
            return this.options.spinicon;
        },
        setSpinicon: function (spinicon) {
            this.options.spinicon = spinicon;

            return this;
        },
        addButton: function (button) {
            this.options.buttons.push(button);

            return this;
        },
        addButtons: function (buttons) {
            var that = this;
            $.each(buttons, function (index, button) {
                that.addButton(button);
            });

            return this;
        },
        getButtons: function () {
            return this.options.buttons;
        },
        setButtons: function (buttons) {
            this.options.buttons = buttons;
            this.updateButtons();

            return this;
        },
        /**
         * If there is id provided for a button option, it will be in dialog.indexedButtons list.
         *
         * In that case you can use dialog.getButton(id) to find the button.
         *
         * @param {type} id
         * @returns {undefined}
         */
        getButton: function (id) {
            if (typeof this.indexedButtons[id] !== 'undefined') {
                return this.indexedButtons[id];
            }

            return null;
        },
        getButtonSize: function () {
            if (typeof BootstrapDialog.BUTTON_SIZES[this.getSize()] !== 'undefined') {
                return BootstrapDialog.BUTTON_SIZES[this.getSize()];
            }

            return '';
        },
        updateButtons: function () {
            if (this.isRealized()) {
                if (this.getButtons().length === 0) {
                    this.getModalFooter().hide();
                } else {
                    this.getModalFooter().show().find('.' + this.getNamespace('footer')).html('').append(this.createFooterButtons());
                }
            }

            return this;
        },
        isAutodestroy: function () {
            return this.options.autodestroy;
        },
        setAutodestroy: function (autodestroy) {
            this.options.autodestroy = autodestroy;
        },
        getDescription: function () {
            return this.options.description;
        },
        setDescription: function (description) {
            this.options.description = description;

            return this;
        },
        setTabindex: function (tabindex) {
            this.options.tabindex = tabindex;

            return this;
        },
        getTabindex: function () {
            return this.options.tabindex;
        },
        updateTabindex: function () {
            if (this.isRealized()) {
                this.getModal().attr('tabindex', this.getTabindex());
            }

            return this;
        },
        getDefaultText: function () {
            return BootstrapDialog.DEFAULT_TEXTS[this.getType()];
        },
        getNamespace: function (name) {
            return BootstrapDialog.NAMESPACE + '-' + name;
        },
        createHeaderContent: function () {
            var $container = $('<div></div>');
            $container.addClass(this.getNamespace('header'));

            // title
            $container.append(this.createTitleContent());

            // Close button
            $container.prepend(this.createCloseButton());

            return $container;
        },
        createTitleContent: function () {
            var $title = $('<div></div>');
            $title.addClass(this.getNamespace('title'));

            return $title;
        },
        createCloseButton: function () {
            var $container = $('<div></div>');
            $container.addClass(this.getNamespace('close-button'));
            var $icon = $('<button class="close">&times;</button>');
            $container.append($icon);
            $container.on('click', {dialog: this}, function (event) {
                event.data.dialog.close();
            });

            return $container;
        },
        createBodyContent: function () {
            var $container = $('<div></div>');
            $container.addClass(this.getNamespace('body'));

            // Message
            $container.append(this.createMessageContent());

            return $container;
        },
        createMessageContent: function () {
            var $message = $('<div></div>');
            $message.addClass(this.getNamespace('message'));

            return $message;
        },
        createFooterContent: function () {
            var $container = $('<div></div>');
            $container.addClass(this.getNamespace('footer'));

            return $container;
        },
        createFooterButtons: function () {
            var that = this;
            var $container = $('<div></div>');
            $container.addClass(this.getNamespace('footer-buttons'));
            this.indexedButtons = {};
            $.each(this.options.buttons, function (index, button) {
                if (!button.id) {
                    button.id = BootstrapDialog.newGuid();
                }
                var $button = that.createButton(button);
                that.indexedButtons[button.id] = $button;
                $container.append($button);
            });

            return $container;
        },
        createButton: function (button) {
            var $button = $('<button class="btn"></button>');
            $button.prop('id', button.id);
            $button.data('button', button);

            // Icon
            if (typeof button.icon !== 'undefined' && $.trim(button.icon) !== '') {
                $button.append(this.createButtonIcon(button.icon));
            }

            // Label
            if (typeof button.label !== 'undefined') {
                $button.append(button.label);
            }

            // Css class
            if (typeof button.cssClass !== 'undefined' && $.trim(button.cssClass) !== '') {
                $button.addClass(button.cssClass);
            } else {
                $button.addClass('btn-default');
            }

            // Hotkey
            if (typeof button.hotkey !== 'undefined') {
                this.registeredButtonHotkeys[button.hotkey] = $button;
            }

            // Button on click
            $button.on('click', {dialog: this, $button: $button, button: button}, function (event) {
                var dialog = event.data.dialog;
                var $button = event.data.$button;
                var button = $button.data('button');
                if (typeof button.action === 'function') {
                    button.action.call($button, dialog, event);
                }

                if (button.autospin) {
                    $button.toggleSpin(true);
                }
            });

            // Dynamically add extra functions to $button
            this.enhanceButton($button);

            //Initialize enabled or not
            if (typeof button.enabled !== 'undefined') {
                $button.toggleEnable(button.enabled);
            }

            return $button;
        },
        /**
         * Dynamically add extra functions to $button
         *
         * Using '$this' to reference 'this' is just for better readability.
         *
         * @param {type} $button
         * @returns {_L13.BootstrapDialog.prototype}
         */
        enhanceButton: function ($button) {
            $button.dialog = this;

            // Enable / Disable
            $button.toggleEnable = function (enable) {
                var $this = this;
                if (typeof enable !== 'undefined') {
                    $this.prop("disabled", !enable).toggleClass('disabled', !enable);
                } else {
                    $this.prop("disabled", !$this.prop("disabled"));
                }

                return $this;
            };
            $button.enable = function () {
                var $this = this;
                $this.toggleEnable(true);

                return $this;
            };
            $button.disable = function () {
                var $this = this;
                $this.toggleEnable(false);

                return $this;
            };

            // Icon spinning, helpful for indicating ajax loading status.
            $button.toggleSpin = function (spin) {
                var $this = this;
                var dialog = $this.dialog;
                var $icon = $this.find('.' + dialog.getNamespace('button-icon'));
                if (typeof spin === 'undefined') {
                    spin = !($button.find('.icon-spin').length > 0);
                }
                if (spin) {
                    $icon.hide();
                    $button.prepend(dialog.createButtonIcon(dialog.getSpinicon()).addClass('icon-spin'));
                } else {
                    $icon.show();
                    $button.find('.icon-spin').remove();
                }

                return $this;
            };
            $button.spin = function () {
                var $this = this;
                $this.toggleSpin(true);

                return $this;
            };
            $button.stopSpin = function () {
                var $this = this;
                $this.toggleSpin(false);

                return $this;
            };

            return this;
        },
        createButtonIcon: function (icon) {
            var $icon = $('<span></span>');
            $icon.addClass(this.getNamespace('button-icon')).addClass(icon);

            return $icon;
        },
        /**
         * Invoke this only after the dialog is realized.
         *
         * @param {type} enable
         * @returns {undefined}
         */
        enableButtons: function (enable) {
            $.each(this.indexedButtons, function (id, $button) {
                $button.toggleEnable(enable);
            });

            return this;
        },
        /**
         * Invoke this only after the dialog is realized.
         *
         * @returns {undefined}
         */
        updateClosable: function () {
            if (this.isRealized()) {
                // Close button
                this.getModalHeader().find('.' + this.getNamespace('close-button')).toggle(this.isClosable());
            }

            return this;
        },
        /**
         * Set handler for modal event 'show.bs.modal'.
         * This is a setter!
         */
        onShow: function (onshow) {
            this.options.onshow = onshow;

            return this;
        },
        /**
         * Set handler for modal event 'shown.bs.modal'.
         * This is a setter!
         */
        onShown: function (onshown) {
            this.options.onshown = onshown;

            return this;
        },
        /**
         * Set handler for modal event 'hide.bs.modal'.
         * This is a setter!
         */
        onHide: function (onhide) {
            this.options.onhide = onhide;

            return this;
        },
        /**
         * Set handler for modal event 'hidden.bs.modal'.
         * This is a setter!
         */
        onHidden: function (onhidden) {
            this.options.onhidden = onhidden;

            return this;
        },
        isRealized: function () {
            return this.realized;
        },
        setRealized: function (realized) {
            this.realized = realized;

            return this;
        },
        isOpened: function () {
            return this.opened;
        },
        setOpened: function (opened) {
            this.opened = opened;

            return this;
        },
        handleModalEvents: function () {
            this.getModal().on('show.bs.modal', {dialog: this}, function (event) {
                var dialog = event.data.dialog;
                dialog.setOpened(true);
                if (dialog.isModalEvent(event) && typeof dialog.options.onshow === 'function') {
                    var openIt = dialog.options.onshow(dialog);
                    if (openIt === false) {
                        dialog.setOpened(false);
                    }

                    return openIt;
                }
            });
            this.getModal().on('shown.bs.modal', {dialog: this}, function (event) {
                var dialog = event.data.dialog;
                dialog.isModalEvent(event) && typeof dialog.options.onshown === 'function' && dialog.options.onshown(dialog);
            });
            this.getModal().on('hide.bs.modal', {dialog: this}, function (event) {
                var dialog = event.data.dialog;
                dialog.setOpened(false);
                if (dialog.isModalEvent(event) && typeof dialog.options.onhide === 'function') {
                    var hideIt = dialog.options.onhide(dialog);
                    if (hideIt === false) {
                        dialog.setOpened(true);
                    }

                    return hideIt;
                }
            });
            this.getModal().on('hidden.bs.modal', {dialog: this}, function (event) {
                var dialog = event.data.dialog;
                dialog.isModalEvent(event) && typeof dialog.options.onhidden === 'function' && dialog.options.onhidden(dialog);
                if (dialog.isAutodestroy()) {
                    dialog.setRealized(false);
                    delete BootstrapDialog.dialogs[dialog.getId()];
                    $(this).remove();
                }
                BootstrapDialog.moveFocus();
            });

            // Backdrop, I did't find a way to change bs3 backdrop option after the dialog is popped up, so here's a new wheel.
            this.handleModalBackdropEvent();

            // ESC key support
            this.getModal().on('keyup', {dialog: this}, function (event) {
                event.which === 27 && event.data.dialog.isClosable() && event.data.dialog.canCloseByKeyboard() && event.data.dialog.close();
            });

            // Button hotkey
            this.getModal().on('keyup', {dialog: this}, function (event) {
                var dialog = event.data.dialog;
                if (typeof dialog.registeredButtonHotkeys[event.which] !== 'undefined') {
                    var $button = $(dialog.registeredButtonHotkeys[event.which]);
                    !$button.prop('disabled') && $button.focus().trigger('click');
                }
            });

            return this;
        },
        handleModalBackdropEvent: function () {
            this.getModal().on('click', {dialog: this}, function (event) {
                $(event.target).hasClass('modal-backdrop') && event.data.dialog.isClosable() && event.data.dialog.canCloseByBackdrop() && event.data.dialog.close();
            });

            return this;
        },
        isModalEvent: function (event) {
            return typeof event.namespace !== 'undefined' && event.namespace === 'bs.modal';
        },
        makeModalDraggable: function () {
            if (this.options.draggable) {
                this.getModalHeader().addClass(this.getNamespace('draggable')).on('mousedown', {dialog: this}, function (event) {
                    var dialog = event.data.dialog;
                    dialog.draggableData.isMouseDown = true;
                    var dialogOffset = dialog.getModalDialog().offset();
                    dialog.draggableData.mouseOffset = {
                        top: event.clientY - dialogOffset.top,
                        left: event.clientX - dialogOffset.left
                    };
                });
                this.getModal().on('mouseup mouseleave', {dialog: this}, function (event) {
                    event.data.dialog.draggableData.isMouseDown = false;
                });
                $('body').on('mousemove', {dialog: this}, function (event) {
                    var dialog = event.data.dialog;
                    if (!dialog.draggableData.isMouseDown) {
                        return;
                    }
                    dialog.getModalDialog().offset({
                        top: event.clientY - dialog.draggableData.mouseOffset.top,
                        left: event.clientX - dialog.draggableData.mouseOffset.left
                    });
                });
            }

            return this;
        },
        realize: function () {
            this.initModalStuff();
            this.getModal().addClass(BootstrapDialog.NAMESPACE)
                .addClass(this.getCssClass());
            this.updateSize();
            if (this.getDescription()) {
                this.getModal().attr('aria-describedby', this.getDescription());
            }
            this.getModalFooter().append(this.createFooterContent());
            this.getModalHeader().append(this.createHeaderContent());
            this.getModalBody().append(this.createBodyContent());
            this.getModal().data('bs.modal', new BootstrapDialogModal(this.getModal(), {
                backdrop: 'static',
                keyboard: false,
                show: false
            }));
            this.makeModalDraggable();
            this.handleModalEvents();
            this.setRealized(true);
            this.updateButtons();
            this.updateType();
            this.updateTitle();
            this.updateMessage();
            this.updateClosable();
            this.updateAnimate();
            this.updateSize();
            this.updateTabindex();

            return this;
        },
        open: function () {
            !this.isRealized() && this.realize();
            this.getModal().modal('show');

            return this;
        },
        close: function () {
            !this.isRealized() && this.realize();
            this.getModal().modal('hide');

            return this;
        }
    };

    // Add compatible methods.
    BootstrapDialog.prototype = $.extend(BootstrapDialog.prototype, BootstrapDialog.METHODS_TO_OVERRIDE[BootstrapDialogModal.getModalVersion()]);

    /**
     * RFC4122 version 4 compliant unique id creator.
     *
     * Added by https://github.com/tufanbarisyildirim/
     *
     *  @returns {String}
     */
    BootstrapDialog.newGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    /* ================================================
     * For lazy people
     * ================================================ */

    /**
     * Shortcut function: show
     *
     * @param {type} options
     * @returns the created dialog instance
     */
    BootstrapDialog.show = function (options) {
        return new BootstrapDialog(options).open();
    };

    /**
     * Alert window
     *
     * @returns the created dialog instance
     */
    BootstrapDialog.alert = function () {
        var options = {};
        var defaultOptions = {
            type: BootstrapDialog.TYPE_PRIMARY,
            title: null,
            message: null,
            closable: true,
            draggable: false,
            closeByBackdrop: false,
            buttonLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
            callback: null,
            cssClass: '',
            width: '',
            nl2br: false
        };

        if (typeof arguments[0] === 'object' && arguments[0].constructor === {}.constructor) {
            options = $.extend(true, defaultOptions, arguments[0]);
        } else {
            options = $.extend(true, defaultOptions, {
                message: arguments[0],
                callback: typeof arguments[1] !== 'undefined' ? arguments[1] : null
            });
        }

        return new BootstrapDialog({
            type: options.type,
            title: options.title,
            message: options.message,
            closable: options.closable,
            draggable: options.draggable,
            closeByBackdrop: options.closeByBackdrop,
            cssClass: options.cssClass,
            width: options.width,
            nl2br: options.nl2br,
            data: {
                callback: options.callback
            },
            onhide: function (dialog) {
                !dialog.getData('btnClicked') && dialog.isClosable() && typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(false);
            },
            buttons: [{
                label: options.buttonLabel,
                action: function (dialog) {
                    dialog.setData('btnClicked', true);
                    typeof dialog.getData('callback') === 'function' && dialog.getData('callback')(true);
                    dialog.close();
                }
            }]
        }).open();
    };

    /**
     * Confirm window
     *
     * @returns the created dialog instance
     */
    BootstrapDialog.confirm = function () {
        var options = {};
        var defaultOptions = {
            type: BootstrapDialog.TYPE_PRIMARY,
            title: null,
            message: null,
            closable: true,
            draggable: false,
            closeByBackdrop: false,
            btnCancelLabel: BootstrapDialog.DEFAULT_TEXTS.CANCEL,
            btnOKLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
            btnOKClass: null,
            btnCancelClass: null,
            callback: null,
            onshow: null,
            onshown: null,
            onhide: null,
            onhidden: null,
            cssClass: '',
            width: '',
            nl2br: false
        };
        if (typeof arguments[0] === 'object' && arguments[0].constructor === {}.constructor) {
            options = $.extend(true, defaultOptions, arguments[0]);
        } else {
            options = $.extend(true, defaultOptions, {
                message: arguments[0],
                closable: false,
                buttonLabel: BootstrapDialog.DEFAULT_TEXTS.OK,
                callback: typeof arguments[1] !== 'undefined' ? arguments[1] : null
            });
        }
        if (options.btnOKClass === null) {
            options.btnOKClass = ['btn', options.type.split('-')[1]].join('-');
        }

        return new BootstrapDialog({
            type: options.type,
            title: options.title,
            message: options.message,
            closable: options.closable,
            closeByBackdrop: options.closeByBackdrop,
            draggable: options.draggable,
            cssClass: options.cssClass,
            data: {
                callback: options.callback
            },
            width: options.width,
            onshow: options.onshow,
            onshown: options.onshown,
            onhide: options.onhide,
            onhidden: options.onhidden,
            nl2br: options.nl2br,
            buttons: [{
                label: options.btnCancelLabel,
                cssClass: options.btnCancelClass,
                action: function (dialog) {
                    var result = true;
                    typeof dialog.getData('callback') === 'function' && (result = dialog.getData('callback')(false));
                    result !== false && dialog.close();
                }
            }, {
                label: options.btnOKLabel,
                cssClass: options.btnOKClass,
                action: function (dialog) {
                    var result = true;
                    typeof dialog.getData('callback') === 'function' && (result = dialog.getData('callback')(true));
                    result !== false && dialog.close();
                }
            }]
        }).open();
    };

    /**
     * Warning window
     *
     * @param {type} message
     * @returns the created dialog instance
     */
    BootstrapDialog.warning = function (message, callback) {
        return new BootstrapDialog({
            type: BootstrapDialog.TYPE_WARNING,
            message: message
        }).open();
    };

    /**
     * Danger window
     *
     * @param {type} message
     * @returns the created dialog instance
     */
    BootstrapDialog.danger = function (message, callback) {
        return new BootstrapDialog({
            type: BootstrapDialog.TYPE_DANGER,
            message: message
        }).open();
    };

    /**
     * Success window
     *
     * @param {type} message
     * @returns the created dialog instance
     */
    BootstrapDialog.success = function (message, callback) {
        return new BootstrapDialog({
            type: BootstrapDialog.TYPE_SUCCESS,
            message: message
        }).open();
    };

    return BootstrapDialog;

}));
noty.Dialog = BootstrapDialog;