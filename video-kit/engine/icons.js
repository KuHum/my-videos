/* ===== ICONS: small ink drawings used by templates. drawIcon(name,cx,cy,half-size,progress,{col}) ===== */
const ICON_NAMES=['rings','book','scroll','church','house','tree','gift','bomb','crown','heart','coins','hospital','cross','flame','shield','key','question','tick','xmark'];
function _iconStrokes(n,cx,cy,s,col){
 const k=s/100,w=Math.max(4,6.5*k),L=(x1,y1,x2,y2,c=INK,ww=w)=>lnS(cx+x1*k,cy+y1*k,cx+x2*k,cy+y2*k,c,ww,7+Math.abs(x1+y2)|0);
 const C=(x,y,r,c=INK,ww=w,t=1.07)=>circS(cx+x*k,cy+y*k,r*k,3+(x*3+y)|0,c,ww,t);
 const Pl=(pts,c=INK,ww=w,sd=5)=>mkStroke(pts.map(p=>[cx+p[0]*k,cy+p[1]*k]),ww,c,sd);
 const poly=(pts,c=INK,ww=w,closed=true)=>pts.map((p,i)=>{const q=pts[(i+1)%pts.length];if(!closed&&i===pts.length-1)return null;return L(p[0],p[1],q[0],q[1],c,ww)}).filter(Boolean);
 switch(n){
 case'rings':return[C(-38,0,62,BLUE,w+1),circS(cx+38*k,cy,62*k,6,BLUE,w+1,1.07,-.6)];
 case'book':return[...poly([[-95,-55],[-4,-35],[-4,60],[-95,40]]),...poly([[95,-55],[4,-35],[4,60],[95,40]]),L(0,-38,0,62),L(-78,-28,-24,-16,GR,4),L(-78,-8,-24,4,GR,4),L(-78,12,-24,24,GR,4),L(78,-28,24,-16,GR,4),L(78,-8,24,4,GR,4),L(78,12,24,24,GR,4)];
 case'scroll':return[...poly([[-70,-35],[70,-35],[70,35],[-70,35]]),C(-70,0,35,INK,w,.9),C(70,0,35,INK,w,.9),L(-40,-12,40,-12,GR,4),L(-40,6,24,6,GR,4)];
 case'church':return[...poly([[-62,-10],[62,-10],[62,72],[-62,72]]),...poly([[-74,-10],[0,-62],[74,-10]],INK,w,false),L(0,-62,0,-92),L(-14,-80,14,-80),...poly([[-12,30],[12,30],[12,72],[-12,72]],INK,w-1)];
 case'house':return[...poly([[-60,-8],[60,-8],[60,72],[-60,72]]),...poly([[-76,-8],[0,-66],[76,-8]],INK,w,false),...poly([[-40,22],[-12,22],[-12,72],[-40,72]],INK,w-1),...poly([[14,12],[44,12],[44,40],[14,40]],INK,w-1)];
 case'tree':return[L(0,76,0,10),C(0,-22,56),...[[-20,-32],[20,-22],[0,-2]].map(p=>lnS(cx+p[0]*k,cy+p[1]*k,cx+p[0]*k+.1,cy+p[1]*k+.1,RED,15*k,9))];
 case'gift':return[...poly([[-55,2],[55,2],[55,72],[-55,72]]),...poly([[-64,-26],[64,-26],[64,2],[-64,2]]),L(0,-26,0,72,RED,w+1),C(-26,-48,24,RED,w),C(26,-48,24,RED,w)];
 case'bomb':return[C(0,18,62,INK,w+2),L(8,45,38,15,GR,4),L(-4,58,46,8,GR,4),L(-16,66,50,0,GR,4),Pl([[-40,-4],[-30,-22],[-14,-32]],GR,5,8),L(34,-38,52,-66),Pl([[52,-66],[78,-86],[102,-74]],INK,w-1),L(106,-76,126,-96,RED,w-1),L(106,-76,132,-70,RED,w-1),L(106,-76,112,-102,RED,w-1)];
 case'crown':return[...poly([[-64,46],[-64,-18],[-32,10],[0,-40],[32,10],[64,-18],[64,46]]),L(-64,46,64,46),C(-64,-24,7,INK,w-1),C(0,-46,7,INK,w-1),C(64,-24,7,INK,w-1)];
 case'heart':{const pts=[];for(let i=0;i<=40;i++){const t=i/40*6.2832,x=16*Math.pow(Math.sin(t),3),y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));pts.push([x*4.4,y*4.4+6])}return[Pl(pts,RED,w+1,2)]}
 case'coins':return[0,1,2].flatMap(i=>{const y=50-i*26;return[ellS(cx,cy+y*k,50*k,15*k,4+i,INK,w-1),L(-50,y,-50,y-14,INK,w-1),L(50,y,50,y-14,INK,w-1)]});
 case'hospital':return[...poly([[-62,-34],[62,-34],[62,72],[-62,72]]),L(0,-14,0,32,RED,w+4),L(-23,9,23,9,RED,w+4),...poly([[-14,40],[14,40],[14,72],[-14,72]],INK,w-1)];
 case'cross':return[L(0,-76,0,76),L(-42,-34,42,-34)];
 case'flame':return[Pl([[0,70],[-40,30],[-30,-10],[-8,-30],[-4,-70],[22,-20],[44,10],[30,52],[0,70]],RED,w+1,4),Pl([[0,50],[-14,30],[0,8],[14,30],[0,50]],RED,w-1,6)];
 case'shield':return[...poly([[-52,-52],[52,-52],[52,8],[0,70],[-52,8]]),L(0,-30,0,40),L(-26,-6,26,-6)];
 case'key':return[C(-44,0,26),L(-18,0,70,0),L(46,0,46,22),L(66,0,66,16)];
 case'tick':return[Pl([[-60,0],[-15,50],[70,-60]],BLUE,w+4,3)];
 case'xmark':return[L(-60,-60,60,60,RED,w+4),L(60,-60,-60,60,RED,w+4)];
 }return[]}
function drawIcon(name,cx,cy,s,p=1,o={}){
 if(p<.012)return;
 if(name==='question'){ctx.save();ctx.font=`700 ${s*2.3}px Caveat, cursive`;ctx.fillStyle=o.col||RED;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=clamp(p*1.5);ctx.fillText('?',cx,cy);ctx.restore();return}
 const key='ic'+name+'|'+cx+'|'+cy+'|'+s+'|'+(o.col||'');
 ink(G(key,()=>mkGroup(_iconStrokes(name,cx,cy,s,o.col))),p,o.col&&name!=='rings'?{col:o.col}:{})}
