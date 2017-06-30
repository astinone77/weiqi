/**
 * Created by zhengpeng on 2017/5/16.
 */
function weiqi(options){
    this.defultOption = {
        //S:可配置的
        dimNum    : 12,    //棋盘大小
        pattern   :  1,    //模式(1:查看答案模式,2:答题模式,3:改错模式)
        downSound : '/audio/down-chess.mp3',    //下子音频
        //E:可配置的

        //S:不可配置的
        steps     : 0,     //步数
        showPlayStep : false,  //显示隐藏步数
        playStep  : 0,     //下棋步数
        nowNodeId : 1,     //当前节点nodeId(为分支提供)
        nowChess : 'B',     //当前是黑棋还是白棋 // B 黑棋  W 白棋
        userLaZiStep : []    //落子顺序
        //E:不可配置的
    };
    this.options = $.extend(this.defultOption,options);
    //答题模式参数保存
    this.answer = {
       //初始化为定义 nodes   : {},
        treeIdArray : []
    };
    this.init();
    this.ajaxSgf();
}

weiqi.prototype = {
    /**
     * 异步请求
     * 获得sgf字符串
     */
    ajaxSgf: function(){
        var self = this;
        var sgfContent = $("#sgfContent").val();
        if(sgfContent && sgfContent != ""){
            self.sgfParse = sgf.parse(sgfContent)[0];

            self.sgfStr = sgfContent;
            //解析树
            self.parseTree(self.sgfParse);
        }else{
            ajaxModel.postData('/api/getSgf',{questionId:config.questionId}).then(function(res){
                self.reload();
                if(res.code == 200){
                    if(res.data && res.data[0]){
                        self.sgfParse = sgf.parse(res.data[0].content)[0];

                        self.sgfStr = res.data[0].content;
                        //解析树
                        self.parseTree(self.sgfParse);
                    }else{
                        alert('没有')
                    }

                }

            })
        }
    },
    init : function(){
        this.bindEvents();
        this.drawChessBoard();
    },
    reload: function () {
        //初始化
        this.options.steps = 0;
        this.options.nowChess = 'B';
        $("#chessLazi").html("");
    },
    showPlayStep: function(ops){
        this.options.showPlayStep = ops.showPlayStep;
        if(this.options.showPlayStep){
            $(".play-chess-step").show();
            $(".last-step").hide();
        }else{
            $(".play-chess-step").hide();
            $(".last-step").show();
        }
    },
    bindEvents : function () {
        var self = this;


        //查看棋子步数
        $("#chessLazi").on('click','.chess',function(){
            if(self.options.pattern == 2 && !self.answer.end){
                alert('请先完题～');
                return false;
            }

            self.options.playStep = 0;

            var $this = $(this),
                treeId = $this.attr('data-treeId'),
                step   = $this.attr('data-step'),
                wz   = $this.attr('data-wz');

            $("#chessLazi").find('.chess').removeClass('active')
            $this.addClass('active');

            self.goStep({
                $this :$this,
                treeId : treeId,
                step : step,
                wz   : wz
            },false,function(treeArrayId){
                self.pushChess(wz,treeArrayId,$this);
            });
        })

    },
    pushChess: function(wz,treeArrayId,$this){
        var self = this;
        //生成棋盘信息
        self.parseFirst(self.sgfParse.nodes[0],true);
        if($this.hasClass("chess-one")){
            return false;
        }
        //遍历落子
        self.mapPullTree(wz,treeArrayId,self.sgfParse,0);
    },
    //递归
    mapPullTree: function (wz,treeId,sgf,index) {
        var self = this,statue = true;

        index++;

        //nodes
        $.each(sgf.nodes,function(i,v){
            if(!statue){
                return false
            }
            $.each(v,function (k,vv) {
                if(k == "B" || k == "W"){
                    var  point = '.point-'+vv[0].toLocaleUpperCase();
                    self.oneChess($(point).find('circle'),k);
                    if(wz == vv[0].toLocaleUpperCase()){
                        self.playAudio(self.options.downSound);
                        statue = false;
                        return false;
                    }
                }
            })
        });
        if(!statue){
            return false
        }
        //tree
        $.each(sgf.subtrees,function(i,v){
           if(v.id == treeId[index]){
               self.mapPullTree(wz,treeId,v,index);
           }
        });

    },
    //步数
    goStep: function(nowInformation,tId,cb){
        var self = this,treeId = [];
        if(tId){
            treeId = tId;
        }
        treeId.unshift(nowInformation.treeId);

        var $pLiObj = self.eachLi(nowInformation.$this);
        if($pLiObj.treeId){
            self.goStep($pLiObj,treeId,cb);
        }　else{
            cb(treeId)
        }
    },
    //遍历dom 获得treeid
    eachLi: function($this){
        var $pLi = $this.parents('li');
        var treeId = $pLi.attr('data-treeId');
        var step = $pLi.attr('data-step');
        return {
            $this : $pLi,
            treeId :  treeId,
            step : step
        }
    },
    /**
     * @author peng.zheng
     * @name 绑定棋子点击
     */
    bindChessClick:function(){
        var self = this;
        //模拟落子
        $(document).on('mouseover.chess','.empty-black,.branch-chess',function(){
            $(this).attr('fill-opacity','0.5');
            if(self.options.nowChess === 'B'){//当前位置应该下黑子
                $(this).attr('fill','url(#black)');
            }else if(self.options.nowChess === 'W'){//当前位置应该下白子
                $(this).attr('fill','url(#white)');
            }
        });
        $(document).on('mouseout.chess','.empty-black,.branch-chess',function(){
            $(this).attr('fill-opacity','0').removeAttr('fill');
        });

        //下棋
        $(document).on('click.chess','.empty-black',function(){
            self.downChess($(this));
        });

        //branch-chess  分支抉择
        $(document).on('click.chess','.branch-chess',function(){
            self.downChess($(this),$(this).attr('data-index'));
        });
    },
    /**
     * @param sgfParse:sgf string to obj
     * @author peng.zheng
     * @name 绘制过程
     */
    parseTree: function (sgfParse) {
        var self = this;

        switch (self.options.pattern){
            case 1:
                //查看答案模式

                //生成棋盘信息
                self.parseFirst(sgfParse.nodes[0]);
                //生成树结构Ul-li
                self.appendGodTree(sgfParse);
                $("#chessLazi").find('li').removeClass("active");
                break;
            case 2:
                //答题模式

                //节点解析
                self.parseNodes(sgfParse.nodes);
                //绑定落子情况
                self.bindChessClick();
                break;
        }

    },
    /**
     * @param sgfParse
     * @author peng.zheng
     * @name 查看答案模式生成树结构
     */
    appendGodTree: function(sgfParse,$ul){
        var self = this;

        //nodes
        $.each(sgfParse.nodes,function(i,v){
            $.each(v,function (k,vv) {
                if(k == "B" || k == "W"){
                    self.appendLazi({
                        type   : k,
                        treeId : sgfParse.id,
                        $ul    : $ul,
                        name   : vv[0].toLocaleUpperCase()
                    });
                }
            })
        });

        //tree
        var $treeLi = $("#chessLazi").find('li[data-treeId='+sgfParse.id+']');
        var $lastLi = $treeLi.last();
        var $ulTree = $treeLi.parents('ul');
        var subTrees = sgfParse.subtrees;
        if(subTrees.length > 0){
            $.each(subTrees,function(i,v){
                // if(i == 0){
                //     self.appendGodTree(v,$ulTree);
                // }else{
                    var ulTree = '<ul data-treeId="'+v.id+'"></ul>';
                    if($lastLi.find('ul').length == 0){
                        var theNode = '<span class="'+$lastLi.attr('class')+'" data-treeId="'+$lastLi.attr('data-treeId')+'" data-step="'+$lastLi.attr('data-step')+'" data-wz="'+$lastLi.attr('data-wz')+'">'+$lastLi.text()+'</span>';
                        $lastLi.removeClass();
                        $lastLi.html(theNode +ulTree);
                    }else{
                        $lastLi.append(ulTree);
                    }

                    var $bodyUl = $("#chessLazi").find('ul[data-treeId='+v.id+']');
                    self.appendGodTree(v,$bodyUl);
               // }
            })
        }
    },
    /**
     * @param nodes
     * @name 解析过程
     */
    parseNodes: function (nodes) {
        var self = this;
        $.each(nodes,function(i,v){
            if(i == 0){
                self.parseFirst(v);
            }else if(i == 1){
                for(var key in v){
                    //现在棋子
                    self.options.nowChess = key;
                }
            }
        })
    },
    /**
     * @param firstObj
     * @name 第一节点解析
     */
    parseFirst: function(firstObj,answer){
        var self = this;

        self.options.dimNum = firstObj.SZ[0];
        //重置棋盘大小
        self.drawChessBoard();
        //默认没有第一手棋
        var hasFirst = false;

        $.each(firstObj,function(k,v){
            switch (k){
                case 'CA' :
                    //编码
                    break;
                case 'AB' :
                    //黑棋
                    hasFirst =  true;
                    self.firstChess(v,'black');
                    break;
                case 'AW' :
                    //白棋
                    hasFirst =  true;
                    self.firstChess(v,'white');
                    break;
                case 'C'  :
                    //提示
                    $("#chessTips").text(v);
                    break;
                case 'AP' :
                    //系统
                    break;
                case 'SZ' :
                    //棋盘大小
                    break;
                case 'MULTIGOGM' :
                    //不知道
                    break;
            }
        });

        //first-Name
        if(hasFirst && !answer){

            self.options.userLaZiStep.push(self.sgfStr.split(";")[1]);

            self.appendLazi({
                treeId : self.sgfParse.id,
                name : '棋谱信息 添加黑子 添加白子 解说',
                type : 'one active'
            });
        }else if(!hasFirst && !answer){
            self.eachASgf();
        }
    },
    //下第一手棋
    firstChess: function(chess,type){
        var self = this;
        $.each(chess,function (i,v){
            var point = v.toLocaleUpperCase();
            $(".point-"+point).find('circle')
                .removeAttr('class')
                .attr('fill-opacity',1)
                .attr('fill','url(#'+type+')');

            //提子参数
            var pointNum = self.letterTurnAllNum(point);
            var tizi = -1;
            type == "black"? tizi = 0 : tizi = 1;
            window.ChessArray[pointNum[0]][pointNum[1]] =tizi;
        });
    },
    //找到子节点并且设置
    findSubTree: function(index){
        var self = this;
        var s = self.answer.subtrees[index];
        self.answer.nodes = s.nodes;
        self.answer.subtrees = s.subtrees;
        self.answer.nowIdIndex += 1;
        self.answer.nowStep = 0;
        self.answer.treeIdArray.push({
            id     : s.id,
            length : self.answer.nodes.length,
            node   : self.answer.nodes
        });
        $(".branch-chess").attr('class',"empty-black").next("svg").remove();
    },
    //分支生成li，并且落子
    newChessLi: function (index,callback) {
        var self =this;
        var $treeLi = $("#chessLazi").find('li[data-treeId='+self.answer.treeIdArray[self.answer.nowIdIndex-1].id+']');
        var $lastLi = $treeLi.last();
        var ulId = self.answer.treeIdArray[self.answer.nowIdIndex].id;
        var ulTree = '<ul data-treeId="'+ulId+'"></ul>';
        if($lastLi.find('ul').length == 0){
            var theNode = '<span class="'+$lastLi.attr('class')+'" data-treeId="'+$lastLi.attr('data-treeId')+'" data-step="'+$lastLi.attr('data-step')+'" data-wz="'+$lastLi.attr('data-wz')+'">'+$lastLi.text()+'</span>';
            $lastLi.removeClass();
            $lastLi.html(theNode +ulTree);
        }else{
            $lastLi.append(ulTree);
        }
        var $bodyUl = $("#chessLazi").find('ul[data-treeId='+ulId+']');
        self.answer.treeIdArray[self.answer.nowIdIndex].$ul = $bodyUl;
        callback($bodyUl);
    },
    //下棋
    downChess: function(_this,index){
        var self = this;
        if(self.sgfParse){
            var _thisPoint = _this.attr('data-wz');

            if(index){
                self.findSubTree(index);
            }
            //遍历
            try{
                $.each(self.answer.nodes[self.answer.nowStep],function(k,v){
                    if(v[0].toLocaleUpperCase() ==_thisPoint){
                        if(index){
                            //分支生成li，并且落子
                            self.newChessLi(index,function($bodyUl){
                                self.chessYes(_this,$bodyUl);
                            });
                        }else{
                            var $ul = self.answer.treeIdArray[self.answer.nowIdIndex].$ul;
                            if($ul && $ul.length > 0){
                                self.chessYes(_this,$ul)
                            }else{
                                self.chessYes(_this)
                            }
                        }

                        //自动下一步
                        if(!self.answer.end){
                            var nowStep = self.answer.nowStep,
                                nodeLength =self.answer.treeIdArray[self.answer.nowIdIndex].length;
                            if(nowStep < nodeLength){
                                self.autoNextChess();
                            }else if(nowStep = nodeLength){
                                self.findSubTree(0);
                                self.newChessLi(0,function () {
                                    self.autoNextChess();
                                });
                            }
                        }

                    }else{
                        //添加错误点
                        self.addSgfJilu(self.options.nowChess,_thisPoint);
                        self.goErrorNext();
                    }
                })
            }catch (e){
                //添加错误点
                self.addSgfJilu(self.options.nowChess,_thisPoint);
                self.goErrorNext();
            }

        }else{
            self.chessYes(_this);
        }
    },
    //落子
    chessYes: function (_this,$ul) {
        var self = this;
        var newChess= self.options.nowChess  == "B" ? 'W' : 'B';
        self.oneChess(_this,self.options.nowChess);


        if($ul){
            self.appendLazi({
                $ul : $ul,
                treeId : self.answer.treeIdArray[self.answer.nowIdIndex].id,
                type : self.options.nowChess,
                name : _this.attr('data-wz')
            });
        }else{
            self.appendLazi({
                treeId : self.answer.treeIdArray[self.answer.nowIdIndex].id,
                type : self.options.nowChess,
                name : _this.attr('data-wz')
            });
        }

        self.options.nowChess = newChess;
        //声音
        self.playAudio(self.options.downSound);
    },
    //单个落子
    oneChess: function(_this,type){
        var type2= type  == "B" ? 'black' : 'white';
        _this.attr('fill','url(#'+type2+')');
        _this.attr('fill-opacity',1).removeAttr('class');


        //提子参数
        var pointNum = this.letterTurnAllNum(_this.attr('data-wz'));
        var tiziType = type  == "B" ? '0' : '1';
        window.ChessArray[pointNum[0]][pointNum[1]] = +tiziType;
        var ClearChess = canTake(tiziType,pointNum[0],pointNum[1]);

        if(ClearChess.length > 0){
            this.numTurnAllLetter(ClearChess);
        }


        var $svgPoint = _this.parent();

        $(".last-step").remove();
        $svgPoint.append(weiqi.Triangle);
        if(this.options.showPlayStep){
            $(".last-step").hide();
        }

        //落子步数
        ++this.options.playStep;

        var show = "display:none";
        if(this.options.showPlayStep){
            show = 'display:block';
        }

        var color = type  == "B" ? 'white' : 'black';
        var text = this.makeSVG('text',{x:'50%',y:'50%',dy:'.3em','text-anchor':'middle',fill:color,class:'play-chess-step',opacity:.6,style:show},this.options.playStep);
        $svgPoint.append(text);

    },
    makeSVG : function(tag, attrs,val) {
        var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
        if(val){
            var valC = document.createTextNode(val);
            el.appendChild(valC);
        }
        for (var k in attrs)
            el.setAttribute(k, attrs[k]);
        return el;
    },
    //自动下一步
    autoNextChess: function () {
        var self = this;
        $.each(self.answer.nodes[self.answer.nowStep],function(k,v){
            var  point = '.point-'+v[0].toLocaleUpperCase();
            setTimeout(function(){
                var $ul = self.answer.treeIdArray[self.answer.nowIdIndex].$ul;
                if($ul && $ul.length > 0){
                    self.chessYes($(point).find('circle'),$ul)
                }else{
                    self.chessYes($(point).find('circle'))
                }

            },300);

        })
    },
    playAudio: function(audioSound){
        var audio = new Audio();
        audio.src = audioSound;
        audio.play();
    },
    /**
     * @param LaZiObj
     * @name 添加ul,li
     */
    appendLazi: function (LaZiObj) {
        var self = this,
            $chessLazi  = $("#chessLazi");
        $chessLazi.find('.chess').removeClass('active');
        var liHtml = '<li data-wz="'+LaZiObj.name+'" data-treeId="'+LaZiObj.treeId+'" data-step="'+self.options.steps+'" class="chess active chess-'+LaZiObj.type+'">'+self.letterTurnNum(LaZiObj.name)+'</li>';

        if(LaZiObj.$ul){
            LaZiObj.$ul.append(liHtml);
        }else{
            $chessLazi.append(liHtml);
        }
        self.options.steps++;

        if(LaZiObj.type != "one active"){
            self.addSgfJilu(LaZiObj.type, LaZiObj.name);

        }

        //答题模式
        if(self.options.pattern == 2){
            self.eachASgf(LaZiObj);
        }
    },
    addSgfJilu : function (type,name) {
        var str = type + '['+name +']';
        this.options.userLaZiStep.push(str);
    },
    //字母转为数字
    letterTurnNum: function(letter){
        if(/^[a-zA-Z]*$/.test(letter)){
            var a = letter.substr(0,1);
            return a + (this.options.dimNum - (letter.charCodeAt(1)-65))
        }else{
            return letter
        }
    },
    letterTurnAllNum: function (letter) {
        if(/^[a-zA-Z]*$/.test(letter)){
            return [(letter.charCodeAt(0)-65),(this.options.dimNum - (letter.charCodeAt(1)-64))]
        }else{
            return letter
        }
    },
    numTurnAllLetter:function(num){
       var self =this;
       $.each(num,function(i,v){
           var letter = String.fromCharCode(v[0]+65) + String.fromCharCode(64 + +self.options.dimNum - v[1]);
           var circle = '<circle class="empty-black" data-wz="'+letter+'" cx="250" cy="250" fill-opacity="0" r="245"></circle>';
           $(".point-"+letter).html(circle);
           window.ChessArray[v[0]][v[1]] = -1;
       })

    },
    eachASgf: function(LaZiObj){
        var self = this;
        if(!self.sgfParse){
            return false;
        }

        //第一次落子情况 first
        if(!self.answer.nodes){
            self.answer.nodes  = self.sgfParse.nodes;
            self.answer.subtrees = self.sgfParse.subtrees
            self.answer.nowIdIndex = 0 ;
            self.answer.nowStep = 0;
            self.answer.treeIdArray.push({
                id     : self.sgfParse.id,
                length : self.answer.nodes.length,
                node   : self.answer.nodes
            });
        }

        self.answer.nowStep++;
        if(self.answer.nowStep >= self.answer.treeIdArray[self.answer.nowIdIndex].length){
            //五子棋分支
            self.parseABCD();
        }

    },
    //错误下一步
    goErrorNext: function () {
        var self = this;

        self.answer.end = true;
        $(document).off('.chess');

        if(pattern == "modifyError"){
            //改错模式
            layer.confirm('答题错误', {
                btn: ['重做']
            },function(){
               window.location.reload();
            });
        }else{
            if(pattern == "practice") {
                //练习
                this.saveHomeWork(0);
                layer.confirm('答题错误', {
                    btn: ['重做','下一道题']
                }, function () {
                    window.location.reload();
                }, function () {
                    self.jumpNextQuestion();
                });
            }else{
                //闯关
                this.saveHomeWork(0);
                layer.confirm('答题错误,将到下一道题', {
                    btn: ['明白了']
                }, function () {
                    self.jumpNextQuestion();
                });
            }
        }

    },
    //正确下一步
    goSuccessNext: function () {
        var self = this;
        if(pattern == "modifyError"){

            //错题模式
            ajaxModel.postData('/api/modifyError',{
               "detailID": getHrefRefs().detailID
            }).then(function () {
                layer.msg('恭喜,答题成功',{time: 2000, icon:6});
                setTimeout(function () {
                    top.window.location.reload();
                },1000);
            })
        }else{
            //闯关和练习模式
            this.saveHomeWork(1);
            if(pattern == "through" && ++config.index  == config.total) {
                var val = JSON.parse(sessionStorage.getItem(config.uuid));
                var num = 0;
                $.each(val,function (i,v) {
                    if(v == 1){
                        num++;
                    }
                });
                var str = '闯关完成,总共答题:'+val.length+',答对:'+ num+',系统将关闭。';
                layer.confirm(str, {
                    btn: ['明白了']
                },function(){
                    self.jumpNextQuestion();
                });
            }else{
                layer.confirm('恭喜', {
                    btn: ['明白了']
                },function(){
                    self.jumpNextQuestion();
                });
            }
        }
    },
    jumpNextQuestion: function () {
        var zHref = '/detail/' + config.bookId + '/' + config.nextCatalogId+'/' + config.nextIndex +'?pattern='+pattern;
        if(config.uuid){
            zHref += '&uuid=' +config.uuid
        }
        window.location.href = zHref;
    },
    //保存答题记录
    saveHomeWork: function (val) {
        var self = this;

        self.options.userLaZiStep = "(;" +  self.options.userLaZiStep.join(";") +')';

        if(pattern == "practice"){
            //练习模式
            ajaxModel.postData('/api/saveHomeWork',{
                questionID:config.questionId,
                questionIndex : config.questionIndex,
                answer : self.options.userLaZiStep,
                right : val
            })
        }else if(pattern == "through"){
            //闯关模式
            ajaxModel.postData('/api/saveMissionWork',{
                questionID:config.questionId,
                questionIndex : config.questionIndex,
                answer : self.options.userLaZiStep,
                right : val
            })
        }

        var oldVal = sessionStorage.getItem(config.uuid);
        if(oldVal){
            oldVal =  JSON.parse(oldVal);
            oldVal.push(val);
        }else{
            oldVal = [];
            oldVal.push(val);
        }
        sessionStorage.setItem(config.uuid,JSON.stringify(oldVal));
    },

    /**
     * @name null
     */
    parseABCD: function(){
        var self = this;

        var index = 0,indexVal = 'svgA';
        if(self.answer.subtrees.length == 0){
            self.answer.end = true;
            $(document).off('.chess');
            self.goSuccessNext();
        }else{
            $.each(self.answer.subtrees,function(i,v){
                $.each(v.nodes[0],function(k,vv){
                    var  point = '.point-'+vv[0].toLocaleUpperCase();
                    switch (index){
                        case 0:
                            indexVal = 'svgA';
                            break;
                        case 1:
                            indexVal = 'svgB';
                            break;
                        case 2:
                            indexVal = 'svgC';
                            break;
                    }
                    index++;
                    var pClass= 'branch-chess';
                    /**
                     * @author jim.zheng
                     * @result 去掉提示
                     * @modify $(point).append(weiqi[indexVal])
                     */
                    $(point).find('circle').attr("class",pClass).attr('data-treeId',v.id).attr('data-index',i)
                })
            });
        }
    },
    /**
    *   @name 初始化及修改config时重绘棋盘
    */
    drawChessBoard: function(){
        var dim = this.options.dimNum;

        //提子参数
        window.SZ = dim;
        var xHtml = '', yHtml = '', xBoxHtml = '', yBoxHtml = '',cirHtml = '';
        var maxLen = 250 + 500 * (dim - 1) + 10;
        //新建坐标值及网格线
        for(var i = 0;i < dim;i++){
            var str = String.fromCharCode(i+65);//A~Z
            xHtml += '<text alignment-baseline="central" class="text-coordinate" text-anchor="middle" y="250" x=' + (250 + 500 * i) +'>' + str + '</text>';
            yHtml += '<text alignment-baseline="central" class="text-coordinate" text-anchor="middle" x="250" y=' + (250 + 500 * i) +'>' + (dim-i) + '</text>';
            xBoxHtml += '<path stroke="#000" stroke-width="20" d="M240,' + (250 + 500 * i) + 'H' + maxLen + '"></path>';
            yBoxHtml += '<path stroke="#000" stroke-width="20" d="M' + (250 + 500 * i) + ',240V' + maxLen + '"></path>';
        }

        //维度为19时，添加九星
        if(dim === 19){
            for(var x = 1750;x <= 7750;x += 3000){
                for(var y = 1750;y <= 7750;y += 3000){
                    yBoxHtml += '<circle r="50" cx="' + x + '" cy="' + y + '"></circle>';
                }
            }
        }

        //提子数据
        window.ChessArray = [];

        //网格线交叉点新建circle，用于下棋时定位
        for(var r = 0;r < dim;r++){

            //提子数据
            window.ChessArray[r] = [];

            for(var m = 0;m < dim;m++){
                var xy = String.fromCharCode(r+65) + String.fromCharCode(m+65);
                var tStr = '<svg class="point-'+xy+'" x=' + (500*r) + ' y= ' + (500*m) + ' xmlns="http://www.w3.org/2000/svg/" width="500" height="500"><circle class="empty-black" data-wz="'+xy+'" cx="250" cy="250" fill-opacity="0" r="245"></circle></svg>'
                cirHtml += tStr;
                //提子数据
                window.ChessArray[r][m] = -1;
            }
        }

        $('.x-top,.x-bottom').html(xHtml);
        $('.y-left,.y-right').html(yHtml);
        $('.chessbox').html(xBoxHtml + yBoxHtml + cirHtml);

        //根据维度更新棋盘大小及坐标轴位置
        $('.img-responsive').attr('viewBox','0 0 ' + (250 + 500 * (dim + 2)) + ' ' + (250 + 500 * (dim + 2)));
        $('.chessboard').attr('width',250 + 500 * dim).attr('height',250 + 500 * dim);
        $('.x-bottom').attr('y',250 + 500 * (dim + 1));
        $('.y-right').attr('x',250 + 500 * (dim + 1));
    }
};

//变量
weiqi.svgA = '<svg class="svg-tips" style="opacity: 0.5" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1003" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="500"><path d="M364.544 580.608q35.84-26.624 76.8-42.496t77.824-24.064 64.512-11.264 37.888-4.096l-59.392-156.672q-4.096-10.24-10.24-18.432-6.144-7.168-15.872-12.8t-24.064-5.632-23.552 5.632-15.36 12.8q-7.168 8.192-11.264 18.432zM761.856 864.256l-101.376-262.144q-6.144 0-30.208 1.024t-59.392 8.192-78.336 23.04-86.528 45.056-83.456 74.24-69.632 110.592l-119.808 0 231.424-579.584q12.288-31.744 32.768-57.344 17.408-21.504 45.568-39.936t69.12-18.432 69.632 18.432 46.08 39.936q20.48 25.6 32.768 57.344l231.424 579.584-130.048 0z" p-id="1004"></path></svg>';
weiqi.svgB = '<svg class="svg-tips" style="opacity: 0.5" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1018" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="500"><path d="M696.021154 428.379511c0 0 72.588225-38.957267 96.363721-60.154032 56.622602-50.482765 69.947072-139.357931 47.509037-182.831049C763.16232 36.725436 561.66412 63.685461 472.495264 75.769684c-160.134117 21.702278-297.613258 111.223151-361.556593 173.568081-62.85863 61.286832-49.933249 135.691425-19.182898 148.668994 13.585413 5.733585 55.469336-48.273447 72.915683-64.714907 28.692482-27.037796 102.928231-71.16583 102.928231-71.16583 60.746526-33.570583 44.760436 22.38073 44.760436 22.38073l-124.68986 626.64611c79.929424 73.534783 354.886683 44.760436 354.886683 44.760436 294.140157-41.563628 336.223624-216.051661 348.492042-297.336966C917.294746 484.697167 696.021154 428.379511 696.021154 428.379511zM448.356494 192.913685c177.535439-48.360428 259.08885-2.651386 255.756965 53.220109-10.9197 183.122691-294.502407 167.82631-294.502407 167.82631L448.356494 192.913685zM721.598692 689.360454c-44.10859 224.343511-390.234749 151.815661-390.234749 151.815661l57.727773-300.896024C646.465504 485.929228 739.960899 595.969437 721.598692 689.360454z" p-id="1019"></path></svg>';
weiqi.svgC = '<svg class="svg-tips" style="opacity: 0.5" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2212" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="500"><path d="M577.87329 387.382794c16.45988-42.335201 30.447453-79.135338 41.97909-110.423949 11.520381-31.277354 16.815991-58.916854 15.878642-82.906222-1.411139-27.275203-8.359388-46.799886-20.818141-58.563814-12.468986-11.752672-26.456558-18.577101-41.97909-20.462031-21.641903-2.348488-48.335868 5.76633-80.087013 24.342408-31.751145 18.588357-61.736063 42.335201-89.959871 71.264067s-53.515844 69.621661-75.851549 122.066103c-22.346961 52.455699-35.875069 106.543571-40.571021 162.285107-4.707209 55.741535 0.706081 113.01496 16.228613 171.810041 13.637602 54.57292 34.573423 95.728248 62.798255 123.478266 28.223808 27.760251 62.673411 42.930765 103.366206 45.51052 40.681538 2.591011 81.498152-13.515828 122.422214-48.332798 48.442292-41.386596 74.792427-82.310657 79.025844-122.772184l19.755949-117.832685c30.571273 22.579251 57.502645 42.103934 80.786954 58.563814 23.284309 16.471137 39.869033 27.28646 49.748031 32.457226l60.681034 33.868365c-20.230764 39.986713-39.050388 74.208119-56.446593 102.663194-17.409508 28.466332-43.99091 61.154825-79.732949 98.076736-35.753295 36.933167-74.329892 65.49876-115.716488 85.7285-41.397852 20.219507-89.378633 30.571273-143.940296 31.046087-57.857732 0.937348-109.721961-10.231015-155.583474-33.515325-45.863561-23.284309-83.148745-55.851029-111.835088-97.723695-28.697599-41.86141-48.222281-81.72635-58.563814-119.596865-10.352789-37.859259-15.997346-85.7285-16.933671-143.587256-0.948605-57.857732 2.822278-107.712187 11.289114-149.584853 9.404184-45.157479 26.217105-89.961918 50.448996-134.414339 24.221658-44.452421 54.087872-86.192058 89.6099-125.241422 35.510772-39.039131 79.137385-73.734328 130.888026-104.074334 51.739385-30.340005 105.363699-44.561915 160.873967-42.688241 48.443315 2.359744 93.950765 19.172665 136.52849 50.448996 42.566468 31.28861 67.143213 63.150272 73.736375 95.607498l28.930913 105.838513L577.87329 387.382794z" p-id="2213"></path></svg>';
weiqi.Triangle = '<svg class="last-step" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="995" xmlns:xlink="http://www.w3.org/1999/xlink" width="500" height="500"><path d="M116.492 709.757l395.529-395.44 395.486 395.44h-791.016z" p-id="996" fill="#d81e06"></path></svg>';
