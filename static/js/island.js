/*
基本数据
ChessArray[][]棋谱数据,空-1,黑0，白1
SZ:棋盘大小

chuan.push(new Array(col,row)); 保存[[x1][y1],[x2][y2],......]
offsets[[1,0],[-1,0],[0,1],[0,-1]]

两个主要函数
提子：canTake(color,col,row);返回可提子位置数组
能否落子:canChess(color,col,row);返回true或false



*/
//公共变了
// var SZ=19;//棋盘大小
// var ChessArray=new Array(); //空-1,黑0，白1
// for (var i=0;i<SZ;i++)
// {
// 	ChessArray[i]=new Array();
// 	for (var j=0;j<SZ;j++ )
// 	{
// 		//console.log(i+"::"+j);
// 		ChessArray[i][j]=-1;
// 	}
// }
//
// ChessArray[2][3]=1;
// ChessArray[2][0]=1;
// ChessArray[2][1]=1;
// ChessArray[2][2]=1;
// ChessArray[0][2]=1;
// ChessArray[1][2]=1;
//
// //ChessArray[0][0]=0;
// ChessArray[0][1]=0;
// ChessArray[1][0]=0;
// ChessArray[1][1]=0;
// //ChessArray[0][2]=0;
// //ChessArray[1][2]=0;








//////////////前面是测试数据///////////////////////////////////////////////


//提子集合,color
function canTake(color,col,row){   //color为0或1,col,row为落子的位置                     
	var taken = new Array();           //   死子集合 
	var visited =new Array();     //   访问过的点的集合 
	var offsets=[[1,0],[-1,0],[0,1],[0,-1]];
	//   开始判断能够提取的敌方死子 
	var newx,newy;
	for (var i=0;i <4;i++) 
	{ 
	    newx=col+offsets[i][0]; 
	    newy=row+offsets[i][1];    
	    if(newx>=0&&newx<19&&newy>=0&&newy<19) 
	    {
	        if(ChessArray[newx][newy]!=color && ChessArray[newx][newy]!=-1) 
			{ 
				///console.log("探索位置:"+newx+","+newy);
				//   如果目前位置已经在前面某个方向的探索过程中找到，则不用判断了。 
				//   因为不同方向的棋子可能是属于同一个串的       
				
				if(!isExit(visited,newx,newy)) 
				{ 
					//   寻找包含该位置的串 
					var chuan = FindChuan(newx,newy);
					//console.log("串:"+chuan);
					//   算串的气 
					var chuanLiberty = CountChuanLiberty(chuan); 
					//console.log("串的气:"+chuanLiberty);
					//   加到已访问的列表 
					//trace("canTake",chuan);
					visited=visited.concat(chuan); 
					//strConcat(visited,chuan);
					//console.log("visited,chuan:"+visited+"||"+chuan+"||"+taken.concat(chuan));
					if(chuanLiberty==0){
						taken=taken.concat(chuan);
						//console.log("taken:"+taken);
						//strConcat(taken,chuan);
						//trace("canTake",taken);
					}                                                   
				 } 
			} 
	    } 
	} 
	// 
	//visited=[];
	return   taken;                     
} 

//能否落子
function canChess(color,col,row){
	if (canTake(color,col,row).length>0 || CountChuanLiberty(FindChuan(col,row))>0)
	{
		return true;
	}
	else{
		return false;	
	}
}


function FindChuan(col,row){
	var  chuan = new Array();                                           
	var  color = ChessArray[col][row];    //当前的颜色   
	var offsets=[[1,0],[-1,0],[0,1],[0,-1]];
	//   加入当前点 
	chuan.push(new Array(col,row)); 
	//   定义两个游标 
	var begin = 0; 
	var end = 0;     
	var findCount=0; //发现的邻居数目, 用于循环结束的判断条件 
	do 
	{ 
		findCount = 0;     
		//begin   到   end   之间的一些点表示没有探索过四周的那些点
		for(var i=begin;i<=end;i++) 
		{ 
			//对左右上下四个方向进行探索 
			//offsets[[1,0],[-1,0],[0,1],[0,-1]]
			for(var j=0;j<4;j++) 
			{ 
				var newx = chuan[i][0] + offsets[j][0]; 
				var newy = chuan[i][1] + offsets[j][1];  
				
				// 如果该点在棋盘内，且颜色相同，且现有的串中没有，则加入串
				//19需要修改？？？？？？？？？？
				if(newx>=0&&newx<SZ&&newy>=0&&newy<SZ&&ChessArray[newx][newy]==color && !isExit(chuan,newx,newy)) 
				{ 
					//trace(newx, newy);
					chuan.push(new Array(newx, newy)); 
					//   寻找到的邻居计数器加   1 
					findCount+=1; 
				} 
			} 
		} 
		//   设定下一个循环要列举的开始和结束游标 
		begin=end+1; 
		end=end+findCount; 
	}while(findCount>0);  
	//如果本轮搜索的所有点都没有邻居了也就表示串搜索结束了，跳出循环
	return   chuan;               
}   


///////////////////////////////////////////////////////////////
  //判断一个位置是否探索过
function isExit(visitedArray,col,row){    
   if(visitedArray.length==0) return false;   
   var result=false;
   for(var i=0;i<visitedArray.length;i++){    
      if(visitedArray[i][0]==col && visitedArray[i][1]==row){
        result=true;
        break;
      } 
   }
   return result;
}


//一个位置的算气
function CountLiberty(col,row){ 
   var liberty =0; 
   var newx,newy;   
   var offsets=[[1,0],[-1,0],[0,1],[0,-1]];
   for(var i=0;i < 4;i++) 
   { 
      newx = col + offsets[i][0]; 
      newy = row + offsets[i][1]; 
    
      if(newx>=0&&newx<SZ&&newy>=0&&newy<SZ) 
      {       
         if(ChessArray[newx][newy]==-1)liberty++; 
		 //if(ChessArray[newx][newy]==ChessArray[col][row]) liberty++; 
      } 
    } 
    //trace("CountLiberty",liberty);
    return  liberty; 
} 

//算串的气
function CountChuanLiberty(chuan){ 
   if(chuan.length == 0)return 0; 
   var liberty = 0; 

   for (var i = 0;i<chuan.length;i++) 
   {     
      liberty+=CountLiberty(chuan[i][0],chuan[i][1]); //分别算黑棋，白棋
   } 
   return liberty; 
} 

