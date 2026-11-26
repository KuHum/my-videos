/* ===== CORE: timing map, ink engine, figures ===== */
const W=1920,H=1080,FPS=30,DUR=TIMING.duration;
const PAPER='#F4EFE4',INK='#1E1E1E',GR='#6B6B6B',RED='#C8452E',BLUE='#2F5D8A',YEL='#F2C94C';
const D2R=Math.PI/180;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,u)=>a+(b-a)*u;
const eo=x=>1-Math.pow(1-x,3), eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const eob=x=>{const c=1.4,c3=c+1;return 1+c3*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
function hash(n){n=(n^61)^(n>>>16);n=n+(n<<3);n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return(n>>>0)/4294967296}
function vn(seed,x){const i=Math.floor(x),f=x-i,a=hash(seed*7919+i),b=hash(seed*7919+i+1),u=f*f*(3-2*f);return a+(b-a)*u}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---- TIMING (loaded from data/timing.json by the build; never hand-edit) ---- */
const SENT={},WORDS={};
TIMING.sentences.forEach(s=>{SENT[s.id]=[s.text,s.start,s.end];WORDS[s.id]=s.words});
function wt(id,key,nth=0){const w=WORDS[id];if(!w)throw new Error('unknown sentence '+id);const m=w.filter(x=>x.n.startsWith(key));if(!m.length)throw new Error('no word "'+key+'" in '+id);if(!m[nth])throw new Error('no occurrence #'+nth+' of "'+key+'" in '+id);return m[nth].t0}
/* ---- canvas ---- */
let cv,ctx,NOW=0;
const K=(t0,d=.5)=>clamp((NOW-t0)/d);
const KE=(t0,d=.5)=>eo(K(t0,d));
let grain;
function makeGrain(){
 const g=document.createElement('canvas');g.width=W;g.height=H;const c=g.getContext('2d');
 c.fillStyle='#fff';c.fillRect(0,0,W,H);const id=c.getImageData(0,0,W,H),d=id.data,r=rng(7);
 for(let i=0;i<d.length;i+=4){const v=244+r()*11-(r()<.012?14:0);d[i]=v;d[i+1]=v-1;d[i+2]=v-3;d[i+3]=255}
 c.putImageData(id,0,0);
 c.globalAlpha=.07;c.strokeStyle='#8a7d62';c.lineWidth=1;
 for(let i=0;i<220;i++){const x=r()*W,y=r()*H,a=r()*6.28,l=6+r()*14;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke()}
 grain=g}

/* ---- ink strokes ---- */
function dense(pts,step=5){
 const out=[];
 if(pts.length===2){const L=Math.hypot(pts[1][0]-pts[0][0],pts[1][1]-pts[0][1]),n=Math.max(2,Math.ceil(L/step));
  for(let i=0;i<=n;i++)out.push([lerp(pts[0][0],pts[1][0],i/n),lerp(pts[0][1],pts[1][1],i/n)]);return out}
 const P=[pts[0],...pts,pts[pts.length-1]];
 for(let i=1;i<P.length-2;i++){const p0=P[i-1],p1=P[i],p2=P[i+1],p3=P[i+2];
  const L=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]),n=Math.max(1,Math.ceil(L/step));
  for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;
   out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
             0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)])}}
 out.push(pts[pts.length-1]);return out}
function mkStroke(pts,w=7,col=INK,seed=1,amp=1.3){
 const d=dense(pts),n=d.length,c=[0];
 for(let i=0;i<n;i++){const a=d[Math.max(0,i-1)],b=d[Math.min(n-1,i+1)];let nx=-(b[1]-a[1]),ny=b[0]-a[0];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;
  const o=(vn(seed,i*.09+(d[0][0]+d[0][1])*.01)-.5)*2*amp;d[i]=[d[i][0]+nx*o,d[i][1]+ny*o]}
 for(let i=1;i<n;i++)c.push(c[i-1]+Math.hypot(d[i][0]-d[i-1][0],d[i][1]-d[i-1][1]));
 return{d,c,L:c[n-1]||1,w,col,seed}}
function mkGroup(strokes){let L=0;strokes.forEach(s=>L+=s.L);return{S:strokes,L}}
function drawStroke(S,p){
 if(p<=0)return;const tg=p*S.L;ctx.strokeStyle=S.col;ctx.lineCap='round';
 for(let i=1;i<S.d.length&&S.c[i-1]<tg;i++){
  let x1=S.d[i][0],y1=S.d[i][1];
  if(S.c[i]>tg){const f=(tg-S.c[i-1])/(S.c[i]-S.c[i-1]);x1=S.d[i-1][0]+(x1-S.d[i-1][0])*f;y1=S.d[i-1][1]+(y1-S.d[i-1][1])*f}
  const s=(S.c[i-1]+S.c[i])/2/S.L,tp=Math.min(1,.4+s*7,.3+(1-s)*5);
  ctx.lineWidth=S.w*tp*(.86+.28*vn(S.seed+3,S.c[i]*.03));
  ctx.beginPath();ctx.moveTo(S.d[i-1][0],S.d[i-1][1]);ctx.lineTo(x1,y1);ctx.stroke()}}
function ink(g,p=1,o={}){
 if(p<.012)return;ctx.save();
 if(o.x||o.y)ctx.translate(o.x||0,o.y||0);
 if(o.sc){const cx=o.cx||0,cy=o.cy||0;ctx.translate(cx,cy);ctx.scale(o.sc,o.sc);ctx.translate(-cx,-cy)}
 if(o.a!==undefined)ctx.globalAlpha=o.a;
 let acc=0;
 for(const s of g.S){const lo=acc/g.L,hi=(acc+s.L)/g.L;acc+=s.L;
  const q=clamp((p-lo)/(hi-lo));if(q<=0)break;
  if(o.col){const sv=s.col;s.col=o.col;drawStroke(s,q);s.col=sv}else drawStroke(s,q)}
 ctx.restore()}
const GC={};function G(key,f){return GC[key]||(GC[key]=f())}
/* shape factories -> arrays of strokes */
function circS(cx,cy,r,seed=1,col=INK,w=6,turns=1.07,a0=-1.9){
 const N=Math.ceil(r*.6)+14,pts=[];
 for(let k=0;k<=N;k++){const a=a0+turns*6.2832*k/N,rr=r*(1+(vn(seed,k*.4)-.5)*.07);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}
 return mkStroke(pts,w,col,seed)}
function ellS(cx,cy,rx,ry,seed=1,col=INK,w=6){
 const N=Math.ceil((rx+ry)*.35)+14,pts=[];
 for(let k=0;k<=N;k++){const a=-1.9+1.07*6.2832*k/N,rr=1+(vn(seed,k*.4)-.5)*.06;pts.push([cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr])}
 return mkStroke(pts,w,col,seed)}
function lnS(x1,y1,x2,y2,col=INK,w=6,seed=3){return mkStroke([[x1,y1],[x2,y2]],w,col,seed)}
function crvS(pts,col=INK,w=6,seed=5){return mkStroke(pts,w,col,seed)}
function rectS(x,y,w,h,col=INK,sw=6,seed=2){return[lnS(x-5,y,x+w+4,y,col,sw,seed),lnS(x+w,y-4,x+w+2,y+h+5,col,sw,seed+1),lnS(x+w+4,y+h,x-4,y+h+2,col,sw,seed+2),lnS(x,y+h+4,x+2,y-5,col,sw,seed+3)]}
function polyS(P,col=INK,sw=6,seed=2,closed=true){const o=[];for(let i=0;i<P.length-(closed?0:1);i++){const a=P[i],b=P[(i+1)%P.length];o.push(lnS(a[0],a[1],b[0],b[1],col,sw,seed+i))}return o}
function arrS(x1,y1,x2,y2,bend=0,col=INK,w=6,seed=9){
 const mx=(x1+x2)/2,my=(y1+y2)/2,dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1,cx=mx-dy/l*bend,cy=my+dx/l*bend,pts=[];
 for(let i=0;i<=14;i++){const t=i/14;pts.push([(1-t)*(1-t)*x1+2*(1-t)*t*cx+t*t*x2,(1-t)*(1-t)*y1+2*(1-t)*t*cy+t*t*y2])}
 const ang=Math.atan2(y2-cy,x2-cx),hl=30;
 return[mkStroke(pts,w,col,seed),lnS(x2,y2,x2-Math.cos(ang-.5)*hl,y2-Math.sin(ang-.5)*hl,col,w,seed+1),lnS(x2,y2,x2-Math.cos(ang+.5)*hl,y2-Math.sin(ang+.5)*hl,col,w,seed+2)]}
function xS(cx,cy,r,col=RED,w=11){return[lnS(cx-r,cy-r,cx+r,cy+r,col,w,21),lnS(cx+r,cy-r,cx-r,cy+r,col,w,22)]}
function tickS(cx,cy,s,col=BLUE,w=11){return[mkStroke([[cx-s*.6,cy],[cx-s*.15,cy+s*.5],[cx+s*.7,cy-s*.6]],w,col,31)]}
function sparkS(cx,cy,r,col=INK,w=4){return[lnS(cx-r,cy,cx+r,cy,col,w,41),lnS(cx,cy-r,cx,cy+r,col,w,42)]}
function hatchS(x,y,w,h,n,col=GR,sw=3){const o=[];for(let i=1;i<=n;i++){const f=i/(n+1);o.push(lnS(x+w*f,y+h,x+w*f+h*.5*0+0,y+h,col,0.1,50+i));}return o}
function hatchLines(pts,col=GR,w=3){return pts.map((p,i)=>lnS(p[0],p[1],p[2],p[3],col,w,60+i))}
const GS=(arr)=>mkGroup(arr.flat());

/* text */
function T(str,x,y,size,col,t0,d,o={}){
 const p=o.p!==undefined?o.p:eo(K(t0,d));if(p<=0)return null;
 ctx.save();ctx.font=`700 ${size}px Caveat, "Segoe Script", cursive`;
 const w=ctx.measureText(str).width;let x0=o.align==='c'?x-w/2:o.align==='r'?x-w:x;
 if(o.rot){ctx.translate(x0+w/2,y);ctx.rotate(o.rot*D2R);ctx.translate(-(x0+w/2),-y)}
 if(o.pop){const u=K(t0,.3),s=u<1?eob(u):1;ctx.translate(x0+w/2,y-size*.3);ctx.scale(s,s);ctx.translate(-(x0+w/2),-(y-size*.3))}
 else{ctx.beginPath();ctx.rect(x0-12,y-size*1.1,(w+24)*p,size*1.6);ctx.clip()}
 ctx.fillStyle=col;ctx.textBaseline='alphabetic';ctx.fillText(str,x0,y);ctx.restore();return{x:x0,w}}
function tw(str,size){ctx.save();ctx.font=`700 ${size}px Caveat, "Segoe Script", cursive`;const w=ctx.measureText(str).width;ctx.restore();return w}
function HL(x,y,w,h,t0,d=.35,seed=1){
 const p=eo(K(t0,d));if(p<=0)return;ctx.save();ctx.globalAlpha=.9;ctx.globalCompositeOperation='multiply';ctx.fillStyle=YEL;
 ctx.beginPath();const ww=w*p,n=Math.max(4,Math.ceil(ww/30));
 for(let i=0;i<=n;i++){const xx=x+ww*i/n;ctx.lineTo(xx,y+(vn(seed,i*.7)-.5)*6-(i/n)*3)}
 for(let i=n;i>=0;i--){const xx=x+ww*i/n;ctx.lineTo(xx+(i==n?4:0),y+h+(vn(seed+9,i*.7)-.5)*6-(i/n)*3)}
 ctx.closePath();ctx.fill();ctx.restore()}
function HEAD(str,t0,hi){ // headline top-left with ink underline; hi=[word,t] highlighter
 const size=78,x=100,y=172,w=tw(str,size);
 if(hi){const pre=str.slice(0,str.indexOf(hi[0]));const px=x+tw(pre,size),ww=tw(hi[0],size);HL(px-8,y-size*.78,ww+16,size*.95,hi[1],.4,3)}
 T(str,x,y,size,INK,t0,.7);
 ink(G('ul'+str,()=>mkGroup([mkStroke([[x-4,y+16],[x+w*.5,y+20],[x+w+10,y+13]],7,INK,17)])),eo(K(t0+.5,.5)))}
function GROUND(y,t0,x1=150,x2=1790){ink(G('gr'+y+x1,()=>mkGroup([mkStroke([[x1,y],[(x1+x2)/2,y+3],[x2,y-1]],4,GR,13,1.8)])),eo(K(t0,.8)))}
/* bubble: draws paper-filled bubble with pop, callback draws contents */
function bubble(cx,cy,rx,ry,tx,ty,t0,kind,content,tOut){
 let u=K(t0,.35);if(u<=0)return;let s=u<1?eob(u):1;
 if(tOut!==undefined){const o=K(tOut,.25);if(o>=1)return;s*=1-eo(o)}
 ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);ctx.translate(-cx,-cy);
 ctx.fillStyle=PAPER;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,6.3);ctx.fill();
 ink(G('bb'+cx+cy+rx,()=>mkGroup([ellS(cx,cy,rx,ry,4,INK,6)])),1);
 if(kind==='think'){const a=Math.atan2(ty-cy,tx-cx),bx=cx+Math.cos(a)*(rx+14),by=cy+Math.sin(a)*(ry+14);
  [[0,.1,22],[.4,.1,15],[.8,.1,9]].forEach((q,i)=>{const px=lerp(bx,tx,q[0]+.28*i),py=lerp(by,ty,q[0]+.28*i);ctx.fillStyle=PAPER;ctx.beginPath();ctx.arc(px,py,q[2],0,6.3);ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=INK;ctx.stroke()})}
 else{const a=Math.atan2(ty-cy,tx-cx);const bx=cx+Math.cos(a)*rx*.9,by=cy+Math.sin(a)*ry*.9;ctx.fillStyle=PAPER;ctx.beginPath();ctx.moveTo(bx-50,by-30);ctx.lineTo(tx,ty);ctx.lineTo(bx+20,by+50);ctx.closePath();ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=INK;ctx.lineJoin='round';ctx.stroke();ctx.fillStyle=PAPER;ctx.beginPath();ctx.ellipse(cx,cy,rx-4,ry-4,0,0,6.3);ctx.fill();ink(G('bb'+cx+cy+rx,()=>0),1)}
 if(u>.5)content&&content();ctx.restore()}

/* ---- FIGURE (skeleton / forward kinematics) ---- */
const FD={tl:105,hr:34,ua:58,fa:54,th:70,sh:70,nk:7};
const POSE={
 idle:{tors:2,head:0,a:[14,14],b:[-12,-8],la:[5,-3],lb:[-6,-2],m:'f'},
 say:{tors:3,head:-4,a:[78,-18],b:[-10,-8],la:[5,-3],lb:[-6,-2],m:'o'},
 think:{tors:2,head:7,a:[36,128],b:[-12,-8],la:[5,-3],lb:[-6,-2],m:'f'},
 shrug:{tors:0,head:9,a:[42,82],b:[-42,-82],la:[6,-3],lb:[-6,-2],m:'u'},
 stop:{tors:-3,head:-2,a:[88,92],b:[-12,-8],la:[6,-3],lb:[-6,-2],m:'o'},
 point:{tors:4,head:-3,a:[96,-6],b:[-12,-8],la:[6,-3],lb:[-6,-2],m:'s'},
 slump:{tors:15,head:20,a:[8,8],b:[-6,6],la:[6,-3],lb:[-6,-2],m:'u'},
 carry:{tors:24,head:22,a:[-26,-14],b:[-52,-18],la:[12,-8],lb:[-10,-4],m:'u'},
 cele:{tors:-2,head:-6,a:[152,8],b:[-152,-8],la:[13,0],lb:[-13,0],m:'s'},
 anx:{tors:6,head:12,a:[30,128],b:[-30,-128],la:[7,-3],lb:[-7,-2],m:'o'},
 front:{tors:0,head:0,a:[24,10],b:[-24,-10],la:[8,0],lb:[-8,0],m:'s'},
 hold:{tors:0,head:0,a:[120,40],b:[-120,-40],la:[6,-3],lb:[-6,-2],m:'s'}
};
function lerpPose(p,q,u){const r={m:u>.5?q.m:p.m};for(const k of ['tors','head'])r[k]=lerp(p[k],q[k],u);for(const k of ['a','b','la','lb'])r[k]=[lerp(p[k][0],q[k][0],u),lerp(p[k][1],q[k][1],u)];return r}
function seqPose(list,t,tr=.4){let k=0;while(k+1<list.length&&list[k+1][0]<=t)k++;const cur=POSE[list[k][1]];if(k===0)return cur;const prev=POSE[list[k-1][1]];return lerpPose(prev,cur,eio(clamp((t-list[k][0])/tr)))}
function walkPose(ph,amp=1,base){
 const s=Math.sin(ph),c=Math.cos(ph),s2=Math.sin(ph+Math.PI),c2=Math.cos(ph+Math.PI);
 return{tors:Math.min(base.tors,5)+4*amp,head:Math.min(base.head,6),m:base.m,
  a:[-34*s*amp,18+10*amp],b:[34*s*amp,18+10*amp].map((v,i)=>i?v:v),
  la:[30*s*amp,-36*Math.max(0,c)*amp],lb:[30*s2*amp,-36*Math.max(0,c2)*amp]}}
function Fig(P,x,gy,s,face,o={}){
 const f=face,up=a=>[Math.sin(a*D2R)*f,-Math.cos(a*D2R)],dn=a=>[Math.sin(a*D2R)*f,Math.cos(a*D2R)];
 const drop=(l)=>FD.th*Math.cos(l[0]*D2R)+FD.sh*Math.cos((l[0]+l[1])*D2R);
 const hy=gy-Math.max(drop(P.la),drop(P.lb))*s-(o.lift||0);
 const H0=[x,hy],tu=up(P.tors),S=[H0[0]+tu[0]*FD.tl*s,H0[1]+tu[1]*FD.tl*s];
 const hu=up(P.tors+P.head),r=FD.hr*s,Hc=[S[0]+hu[0]*(FD.hr+FD.nk)*s,S[1]+hu[1]*(FD.hr+FD.nk)*s];
 const limb=(o0,a1,bend,l1,l2)=>{const d1=dn(a1),e=[o0[0]+d1[0]*l1*s,o0[1]+d1[1]*l1*s],d2=dn(a1+bend);return[o0,e,[e[0]+d2[0]*l2*s,e[1]+d2[1]*l2*s]]};
 const J={H:H0,S,Hc,r,s,f,
  aL:limb(S,P.a[0],P.a[1],FD.ua,FD.fa),bL:limb(S,P.b[0],P.b[1],FD.ua,FD.fa),
  laL:limb(H0,P.la[0],P.la[1],FD.th,FD.sh),lbL:limb(H0,P.lb[0],P.lb[1],FD.th,FD.sh)};
 const sd=o.seed||11,w=7.2*Math.max(.7,Math.min(1,s*.8+.25)),st=[];
 st.push(circS(Hc[0],Hc[1],r,sd,INK,w,1.08,-2.2));
 st.push(mkStroke([[S[0]-tu[0]*0,S[1]],[Hc[0]-hu[0]*r,Hc[1]-hu[1]*r]],w,INK,sd+1));
 const midT=[(S[0]+H0[0])/2+f*P.tors*.18*s,(S[1]+H0[1])/2];
 st.push(mkStroke([S,midT,H0],w+.6,INK,sd+2));
 st.push(mkStroke(J.laL,w,INK,sd+3));st.push(mkStroke(J.lbL,w,INK,sd+4));
 st.push(mkStroke(J.bL,w,INK,sd+5));st.push(mkStroke(J.aL,w,INK,sd+6));
 if(o.dress){const k=s*40;st.push(mkStroke([H0,[H0[0]-f*k*.9,H0[1]+k*2.0]],w*.8,INK,sd+20),mkStroke([H0,[H0[0]+f*k*1.2,H0[1]+k*2.0]],w*.8,INK,sd+21),mkStroke([[H0[0]-f*k*.9,H0[1]+k*2.0],[H0[0]+f*k*1.2,H0[1]+k*2.0]],w*.8,INK,sd+22))}
 if(o.tie){const d=[S[0]*.0+(H0[0]-S[0]),(H0[1]-S[1])],l=Math.hypot(d[0],d[1]);const ux=d[0]/l,uy=d[1]/l;
  st.push(mkStroke([[S[0]+ux*8*s,S[1]+uy*8*s],[S[0]+ux*16*s,S[1]+uy*16*s]],10*s,o.tie,sd+30),mkStroke([[S[0]+ux*20*s,S[1]+uy*20*s],[S[0]+ux*52*s,S[1]+uy*52*s]],13*s,o.tie,sd+31))}
 if(o.scarf){st.push(mkStroke([[S[0]-14*s,S[1]+2*s],[S[0]+2*s,S[1]+9*s],[S[0]+16*s,S[1]+2*s]],9*s,o.scarf,sd+32),mkStroke([[S[0]-6*s*f,S[1]+8*s],[S[0]-16*s*f,S[1]+40*s]],8*s,o.scarf,sd+33))}
 if(o.beard){const b=hu;st.push(mkStroke([[Hc[0]+f*r*.1-8*s,Hc[1]+r*.75],[Hc[0]+f*r*.6,Hc[1]+r*1.2],[Hc[0]+f*r*.95,Hc[1]+r*.75]],w*.9,INK,sd+34))}
 if(o.beret){st.push(mkStroke([[Hc[0]-r*.95,Hc[1]-r*.5],[Hc[0]-r*.5,Hc[1]-r*1.25],[Hc[0]+r*.7,Hc[1]-r*1.2],[Hc[0]+r*1.0,Hc[1]-r*.5]],w*1.2,INK,sd+35))}
 // face
 const rot=(px,py)=>{const a=(P.head*f)*D2R,c=Math.cos(a),sn=Math.sin(a);return[Hc[0]+(px*c-py*sn)*r,Hc[1]+(px*sn+py*c)*r]};
 const e1=rot(.28*f,-.12),e2=rot(.68*f,-.12),m1=rot(.28*f,.42),m2=rot(.7*f,.42);
 const mouth=P.m==='o'?[m1,rot(.5*f,.62),m2]:P.m==='s'?[m1,rot(.5*f,.62),rot(.74*f,.34)]:P.m==='u'?[rot(.28*f,.55),rot(.5*f,.4),rot(.72*f,.55)]:[m1,m2];
 st.push(mkStroke(mouth.length==2?mouth:mouth,w*.7,INK,sd+36,.3));
 J.dots=[e1,e2];J.dr=Math.max(2.8,3.6*s);
 return{g:mkGroup(st),J}}
function drawFig(F,p=1,col){ink(F.g,p);if(p>.96){ctx.fillStyle=INK;F.J.dots.forEach(d=>{ctx.beginPath();ctx.arc(d[0],d[1],F.J.dr,0,6.3);ctx.fill()})}}
