/**
 * Created by zhengpeng on 2017/6/8.
 */
(function ($) {
    /**
     * @author 452447629@qq.com
     * @date  2017-06-08
     * @param {obj} options => width(图片宽),height(图片高),sgf(sgf字符串)
     * @param (function} callback 执行完回调方法
     * @return null
     * --------------------------------------
     * sgf棋谱转化为图片(没有开发存在分支的情况)
     * --------------------------------------
     */
   function checkTwoCanvas(options,callback) {
        this.callback = arguments[1];
        //默认参数
        var defaultOptions = {
           SZ                  : 19,        //棋盘大小
           width               : 1000,      //canvas宽
           height              : 1000,      //canvas高(涉及图片分辨率)
           chessboardShadow    : 10,        //棋盘阴影距离(单边)
           chessboardColor     : '#DCB35C', //棋盘颜色
           chessboardLineColor : '#000000', //棋盘线的颜色
           stepIndex           : 0,         //落子计数
           bgText              : '思米教育'  //棋盘背景文字
        };

        //options
        this.options = $.extend({},defaultOptions,options);

        //sgf 转化对象
        this.sgfParse = sgf.parse(this.options.sgf)[0];

        //array 落子数组
        this.chessArray = [];

        this.init();
   }

    checkTwoCanvas.prototype = {
        init : function () {
            var self = this;
            //解析节点
            $.each(this.sgfParse.nodes,function (i,v) {
                self.parseNodes(v);
            });
            //绘制棋盘
            self.drawChessBoard();

            //遍历落子
            $.each(self.chessArray,function (i,v) {
                $.each(v,function (k,vv) {
                    self.LiZiChess(k,vv);
                })
            });

            //生成img
            if(self.callback){
                self.convertCanvasToImage();
            }

        },
        //生成img
        convertCanvasToImage : function () {
            var src = this.myCanvas.toDataURL("image/png");
            $(this.myCanvas).remove();
            this.callback(src);
        },
        //解析节点,返回对象
        parseNodes: function (nodes) {
            var self = this;
            $.each(nodes,function (k,v) {
                switch(k){
                    case 'CA' :
                        //编码
                        break;
                    case "B"  :
                        //黑棋
                    case 'AB' :
                        //黑棋
                    case "W"  :
                        //白棋
                    case 'AW' :
                        var chessLength  = self.chessArray.length;
                        self.chessArray[chessLength] = {};
                        self.chessArray[chessLength][k] = v;
                        //白棋
                        break;
                    case 'C'  :
                        //提示
                        break;
                    case 'AP' :
                        //系统
                        break;
                    case 'SZ' :
                        self.options.SZ = v[0];
                        //棋盘大小
                        break;
                    case 'MULTIGOGM' :
                        //不知道
                        break;
                }
            });
        },
        //黑子颜色
        blackChessColor : function (i,j) {
            var self = this;
            var g = this.ctx.createRadialGradient(i*this.lineDistance,j*this.lineDistance,self.chessWidth,i*this.lineDistance,j*this.lineDistance,0);//设置渐变
            g.addColorStop(0,'#000');//黑棋
            g.addColorStop(1,'#777');
            return g;
        },
        //白子颜色
        whiteChessColor : function (i,j) {
            var self = this;
            var g=this.ctx.createRadialGradient(i*this.lineDistance,j*this.lineDistance,self.chessWidth,i*this.lineDistance,j*this.lineDistance,0);//设置渐变
            g.addColorStop(0,'#D1D1D1');//白棋
            g.addColorStop(1,'#F9F9F9');
            return g;
        },
        downChess: function (i,j,type) {
            var self = this;
            self.ctx.beginPath();
            self.ctx.arc(i * self.lineDistance,j* self.lineDistance, self.chessWidth, 0, 2 * Math.PI);//画圆
            self.ctx.closePath();
            self.ctx.fill();

            if(type == "B" || type == "W"){
                self.ctx.fillStyle = "black";
                if(type == "B"){
                    self.ctx.fillStyle = "#efefef";
                }
                self.ctx.textAlign = 'center';
                self.ctx.textBaseline = 'middle';
                self.ctx.font=self.options.width/20+"px Arial";
                self.ctx.fillText(++self.options.stepIndex,i * self.lineDistance,j* self.lineDistance);
            }
        },
        //落子
        LiZiChess : function (type,val) {
            var self = this;
            self.ctx.save();
            self.ctx.translate(self.surplusDistance,self.surplusDistance);

            if(type.indexOf("B") > -1){
               //黑
                $.each(val,function (i,v) {
                    var xy =  self.letterTurnAllNum(v);
                    self.ctx.fillStyle = self.blackChessColor(xy[0],xy[1]);

                    //落下子
                    self.downChess(xy[0],xy[1],type);


                })
            }else if(type.indexOf("W") > -1){
               //白
                $.each(val,function (i,v) {
                    var xy =  self.letterTurnAllNum(v);
                    self.ctx.fillStyle = self.whiteChessColor(xy[0],xy[1]);

                    //落下子
                    self.downChess(xy[0],xy[1],type);
                })
            }

            self.ctx.restore();
        },
        letterTurnAllNum: function (letter) {
            letter =  letter.toUpperCase();
            if(/^[a-zA-Z]*$/.test(letter)){
                return [(letter.charCodeAt(0)-64),(letter.charCodeAt(1)-64)]
            }else{
                return letter
            }
        },
        //绘制棋盘
        drawChessBoard: function () {
            var  self = this;

            //创建canvas
            self.createCanvas(function () {

                //棋盘等份
                var chessDivision = +self.options.SZ+1;

                //线间距
                var lineDistance = parseInt((self.options.width-self.options.chessboardShadow*2)/chessDivision);
                self.lineDistance = lineDistance;

                //棋子大小
                self.chessWidth = parseInt(lineDistance*.48);

                //棋盘宽度
                var chessWidth  = lineDistance*chessDivision;

                //剩余距离
                var surplusDistance = (self.options.width-chessWidth)/2;
                self.surplusDistance = surplusDistance;

                //绘制棋盘
                self.ctx.save();
                self.ctx.fillStyle = self.options.chessboardColor;
                self.ctx.shadowColor = 'rgba(0,0,0,.4)';
                self.ctx.shadowOffsetX = self.options.chessboardShadow/2;
                self.ctx.shadowOffsetY = self.options.chessboardShadow/2;
                self.ctx.shadowBlur = self.options.chessboardShadow;
                self.ctx.fillRect(surplusDistance,surplusDistance,chessWidth,chessWidth);
                self.ctx.restore();

                //个人标示
                self.ctx.save();
                self.ctx.font=self.options.width/10+"px Arial";
                var gradient=self.ctx.createLinearGradient(0,0,self.options.width,self.options.width);
                gradient.addColorStop("0.4","green");
                gradient.addColorStop("0.5","red");
                gradient.addColorStop("0.6","blue");
                self.ctx.fillStyle = gradient;
                self.ctx.textAlign = 'center';
                self.ctx.textBaseline = 'middle';
                self.ctx.translate(.5*self.options.width,.5*self.options.width);
                self.ctx.rotate(45*Math.PI/180);
                self.ctx.translate(-.5*self.options.width,-.5*self.options.width);
                self.ctx.fillText(self.options.bgText,self.options.width/2,self.options.width/2);
                self.ctx.restore();


                //画线
                self.ctx.save();
                self.ctx.strokeStyle= self.options.chessboardLineColor;
                self.ctx.translate(surplusDistance,surplusDistance);
                for(var i =1;i < chessDivision;i++){
                    self.ctx.beginPath();
                    self.ctx.moveTo(i*lineDistance,lineDistance);//垂直
                    self.ctx.lineTo(i*lineDistance,chessWidth-lineDistance);

                    self.ctx.moveTo(lineDistance,i*lineDistance);//水平
                    self.ctx.lineTo(chessWidth-lineDistance,i*lineDistance);
                    self.ctx.stroke();
                }
                self.ctx.restore();

                //生成字母标示
                self.ctx.save();
                self.ctx.fillStyle = "black";
                self.ctx.textAlign = 'center';
                self.ctx.textBaseline = 'middle';
                self.ctx.font="16px Arial";
                self.ctx.translate(surplusDistance,surplusDistance);
                for(var l =1;l < chessDivision;l++){
                    self.ctx.fillText(String.fromCharCode(l+64),l*lineDistance,lineDistance-10);
                    self.ctx.fillText(l,lineDistance - 14,l*lineDistance);
                }
                self.ctx.restore();


                //如果棋盘大小为19,画9星
                if(self.options.SZ == 19){
                    self.ctx.save();
                    for(var j = 0 ; j < 3 ; j ++){
                        var star_y = surplusDistance + lineDistance*(j*6+4);
                        for(var k = 0 ; k < 3 ; k++){
                            var star_x = surplusDistance + lineDistance*(k*6+4);
                            self.ctx.fillStyle="black";
                            self.ctx.beginPath();
                            self.ctx.arc(star_x, star_y, 4, 0, Math.PI*2, false);
                            self.ctx.fill();
                        }
                    }
                    self.ctx.restore();
                }
            });
        },
        //落子

        //创建canvas
        createCanvas: function (callback) {

            //myCanvas
            this.myCanvas = document.createElement('canvas');

            //添加到body节点下
            document.body.appendChild(this.myCanvas);
            this.myCanvas.width = this.options.width;
            this.myCanvas.height = this.options.height;

            //ctx
            this.ctx=this.myCanvas.getContext('2d');

            if(!this.ctx){
                alert('暂不支持canvas,请切换浏览器尝试！');
            }else{
                callback()
            }
        }
    };

    window.checkTwoCanvas = checkTwoCanvas;
})(jQuery);

// demo
$(function () {
    $(".canvas-two-img").each(function (i,v) {
        var $this = $(this);
        new checkTwoCanvas({
            width  : 600,
            height : 600,
            bgText : "润世教育".charAt(i%4),
            sgf    : $this.attr('data-src')
        },function (res) {
            $this.attr("src",res);
        })
    });
});