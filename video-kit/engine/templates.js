/* ===== TEMPLATES: reusable scene layouts. Each takes resolved params (times are seconds). ===== */
const A=(v,d)=>v===undefined||v===null?d:v;
const ACC={man:{},pastor:{tie:BLUE},woman:{scarf:RED,dress:1},child:{},elder:{beard:1},teacher:{beret:1},official:{tie:RED},scribe:{beard:1,scroll:1}};
const FIG_SCALE={child:.55};
function fitSize(str,size,maxW){const w=tw(str,size);return w>maxW?size*maxW/w:size}
function leadHead(){return PST&&PST.vis?[PST.J.Hc[0]+95,PST.J.Hc[1]+10]:[700,480]}
function actor(list,t0,d,x,gy,s,face,o={}){
 const pre=ACC[o.who]||{};const sc=s*(FIG_SCALE[o.who]||1);
 const P=seqPose(list,NOW,.4),F=Fig(P,x,gy,sc,face,Object.assign({},pre,o)),p=eo(K(t0,d));
 if(p>0){drawFig(F,p);if((o.scroll||pre.scroll)&&p>.9)scrollAt(F.J.bL[2])}return F}
const scrollAt=(p)=>{ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(-.5);ctx.fillStyle=PAPER;ctx.fillRect(-45,-14,90,28);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.strokeRect(-45,-14,90,28);ctx.beginPath();ctx.moveTo(-28,-5);ctx.lineTo(28,-5);ctx.moveTo(-28,5);ctx.lineTo(10,5);ctx.lineWidth=3;ctx.stroke();ctx.restore()};
function label(str,x,y,size,t0,col=INK,o={}){const sz=fitSize(str,size,o.maxW||760);return T(str,x,y,sz,col,t0,.6,Object.assign({align:'c'},o))}
function xAt(cx,cy,r,t0){ink(G('xx'+cx+'|'+cy+'|'+r,()=>mkGroup(xS(cx,cy,r,RED,12))),K(t0,.3))}
function chrome(sc){ // headline + ground line
 GROUND(900,sc.start+.1);
 if(sc.headline)HEAD(sc.headline,sc.start+.1,sc.hi?[sc.hi.word,sc.hi.at]:undefined)}
function splitLines(str,n){const w=str.split(' ');if(n<2||w.length<4)return[str];const h=Math.ceil(w.length/2);return[w.slice(0,h).join(' '),w.slice(h).join(' ')]}

const TEMPLATES={};
/* 1 title: opening or section card */
TEMPLATES.title={req:['text'],lead:null,draw(sc,p){
 GROUND(900,sc.start+.2);const t0=A(p.at,sc.start+.1),size=fitSize(p.text,A(p.size,132),1560);
 T(p.text,960,470,size,INK,t0,.9,{align:'c'});const w=tw(p.text,size);
 ink(G('tul'+p.text,()=>mkGroup([mkStroke([[960-w/2,500],[960,506],[960+w/2,497]],8,INK,17)])),eo(K(t0+.7,.5)));
 if(p.sub)T(p.sub,960,600,58,GR,A(p.subAt,t0+1.0),.7,{align:'c'})}};
/* 2 talk: lead speaks/thinks; bubble holds tiny diagram */
TEMPLATES.talk={req:['bubble'],lead:'L',draw(sc,p){
 chrome(sc);const b=p.bubble,it=b.items||[],n=it.length,cx=1230,cy=480,t=leadHead();
 bubble(cx,cy,310,175,t[0],t[1],A(b.at,sc.start+.3),b.kind||'say',()=>{
  const sp=n===1?0:n===2?210:170,x0=cx-sp*(n-1)/2;
  it.forEach((q,i)=>{const x=x0+i*sp;
   if(q.icon&&q.text){drawIcon(q.icon,x,cy-38,n>2?62:82,K(A(q.at,sc.start),.5),{col:q.col});label(q.text,x,cy+112,n>2?38:46,A(q.at,sc.start)+.1,INK,{maxW:sp?sp-20:560})}
   else if(q.icon)drawIcon(q.icon,x,cy,n>2?80:n===2?100:120,K(A(q.at,sc.start),.5),{col:q.col});
   else if(q.text)label(q.text,x,cy+18,n>1?48:62,A(q.at,sc.start),INK,{maxW:sp?sp-20:560});
   if(q.crossAt!==undefined)xAt(x,cy,n>2?75:n===2?100:125,q.crossAt)})},b.out)}};
/* 3 list: items build one by one */
TEMPLATES.list={req:['items'],lead:'L',draw(sc,p){
 chrome(sc);const it=p.items,n=it.length,step=Math.min(112,560/n),y0=A(p.y,400),x=1060;
 it.forEach((q,i)=>{const y=y0+i*step,t0=A(q.at,sc.start+i),m=q.mark||p.mark||'dot',sz=fitSize(q.text,60,700);
  if(q.hl)HL(x-12,y-sz*.78,tw(q.text,sz)+30,sz*1.0,t0,.35,i+2);
  T(q.text,x,y,sz,INK,t0,.55);
  if(m==='tick')drawIcon('tick',x-52,y-18,24,K(t0,.3));else if(m==='cross')drawIcon('xmark',x-52,y-18,22,K(t0,.3));
  else if(m==='num'){ink(G('ln'+i+y,()=>mkGroup([circS(x-52,y-20,26,i+3,INK,5)])),K(t0,.3));T(String(i+1),x-52,y-6,36,INK,t0+.1,.2,{align:'c',p:1})}
  else ink(G('ld'+i+y,()=>mkGroup([lnS(x-60,y-18,x-48,y-18,INK,14,i)])),K(t0,.2));
  if(q.icon)drawIcon(q.icon,1730,y-22,48,K(t0+.15,.4))})}};
/* 4 compare: two cards left/right, each with title, sub, stamp or icon */
TEMPLATES.compare={req:['left','right'],lead:'C',draw(sc,p){
 chrome(sc);[['left',130,BLUE],['right',1150,RED]].forEach(([k,x,dc],i)=>{const c=p[k],t0=A(c.at,sc.start+i*.5),cx=x+320;
  ink(G('cmp'+k+x,()=>mkGroup(rectS(x,340,640,360,GR,5,30+i*10))),eo(K(t0-.2,.7)));
  label(c.title||'',cx,430,54,t0,INK,{maxW:580});if(c.sub)label(c.sub,cx,490,40,t0+.3,GR,{maxW:580});
  const col=c.col==='red'?RED:c.col==='blue'?BLUE:dc;
  if(c.stamp){const sa=A(c.stampAt,t0+.8);ink(G('cst'+k+c.stamp,()=>mkGroup([ellS(cx,610,Math.max(110,tw(c.stamp,110)/2+30),64,4+i,col,6)])),eo(K(sa,.4)));T(c.stamp,cx,640,110,col,sa,.3,{align:'c',pop:1})}
  else if(c.icon)drawIcon(c.icon,cx,590,95,K(t0+.4,.5),{})})}};
/* 5 chain: cause -> effect */
TEMPLATES.chain={req:['nodes'],lead:null,draw(sc,p){
 chrome(sc);const nd=p.nodes,n=nd.length,x0=n===2?640:n===3?420:300,gap=n===2?640:n===3?540:440;
 nd.forEach((q,i)=>{const x=x0+i*gap,t0=A(q.at,sc.start+i*1.2);
  if(i>0)ink(G('ca'+i+n,()=>mkGroup(arrS(x0+(i-1)*gap+130,540,x-130,540,0,GR,7,3+i))),eo(K(t0-.25,.4)));
  if(q.hl)HL(x-175,610,350,86,t0+.2,.4,i);
  if(q.icon)drawIcon(q.icon,x,520,100,K(t0,.5),{});
  label(q.label||'',x,680,52,t0+.1,INK,{maxW:400})})}};
/* 6 scripture: open Bible with reference and key words */
TEMPLATES.scripture={req:['ref'],lead:'L',leadPose:(sc,p)=>[[A(p.at,sc.start+.3),'point']],draw(sc,p){
 chrome(sc);const t0=A(p.at,sc.start+.3),cx=1280;
 drawIcon('book',cx,560,190,eo(K(t0,.9)));
 T(p.ref,cx,340,fitSize(p.ref,84,720),INK,t0+.3,.7,{align:'c'});
 ink(G('sul'+p.ref,()=>mkGroup([mkStroke([[cx-tw(p.ref,fitSize(p.ref,84,720))/2,362],[cx,368],[cx+tw(p.ref,fitSize(p.ref,84,720))/2,360]],7,INK,5)])),eo(K(t0+.9,.5)));
 (p.key||[]).forEach((q,i)=>{const y=800+i*86,sz=fitSize(q.text,60,860),w=tw(q.text,sz),ta=A(q.at,t0+1.2+i);
  HL(cx-w/2-14,y-sz*.78,w+28,sz*.98,ta,.4,i+3);T(q.text,cx,y,sz,INK,ta,.5,{align:'c'})})}};
/* 7 quote: someone else says something (generic stand-in + name label, never a likeness) */
TEMPLATES.quote={req:['name','text'],lead:null,draw(sc,p){
 chrome(sc);const t0=A(p.at,sc.start+.4),sx=A(p.x,1440);
 const F=actor([[0,A(p.pose,'say')]],t0,.9,sx,900,1.5,-1,{who:p.who||'man',seed:91});
 label(p.name,sx,975,50,t0+.2,INK,{maxW:420});
 const lines=splitLines(p.text,2),qa=A(p.textAt,t0+.9);
 bubble(sx-640,470,400,lines.length>1?185:150,sx-95,490,qa-.3,'say',()=>{
  const sz=fitSize(lines.reduce((a,b)=>a.length>b.length?a:b),58,700);
  lines.forEach((l,i)=>T((i===0?'“':'')+l+(i===lines.length-1?'”':''),sx-640,480+(lines.length>1?(i?58:-8):22),sz,INK,qa+i*.5,.9,{align:'c'}))})}};
/* 8 story: a short anecdote with named people in a place */
TEMPLATES.story={req:['people'],lead:null,draw(sc,p){
 chrome(sc);if(p.place&&p.place!=='none'){const ps=A(p.placeSize,230);drawIcon(p.place,A(p.placeX,340),900-72*ps/100,ps,eo(K(A(p.placeAt,sc.start+.3),.8)))};
 const pe=p.people,n=pe.length,x0=n===1?1100:n===2?860:700,gap=n===1?0:n===2?460:380;
 pe.forEach((q,i)=>{const x=q.x||x0+i*gap,t0=A(q.at,sc.start+.4+i*.8);
  actor([[0,q.pose||'idle']],t0,.9,x,900,1.35,q.face||-1,{who:q.who||'man',seed:60+i});
  if(q.name)label(q.name,x,975,46,t0+.3,INK,{maxW:360})});
 if(p.bubble){const q=pe[A(p.bubble.from,0)],x=q.x||x0+A(p.bubble.from,0)*gap;
  bubble(x+(q.face===1?420:-420),500,340,150,x+(q.face===1?60:-60),560,A(p.bubble.at,sc.start+2),'say',()=>{const ls=splitLines(p.bubble.text,2);ls.forEach((l,i)=>label(l,x+(q.face===1?420:-420),500+(ls.length>1?(i?58:-8):20),50,A(p.bubble.at,sc.start+2)+.2+i*.3,INK,{maxW:560}))})}}};
/* 9 stat: one big number/phrase from the script, optionally a bar chart */
TEMPLATES.stat={req:['big'],lead:null,draw(sc,p){
 chrome(sc);const t0=A(p.at,sc.start+.3),bars=p.bars;
 const size=fitSize(p.big,bars?120:A(p.size,170),bars?760:1500),cx=bars?620:960,cy=bars?500:540,w=tw(p.big,size);
 HL(cx-w/2-16,cy-size*.74,w+32,size*.95,t0+.5,.45,5);T(p.big,cx,cy,size,INK,t0,.7,{align:'c'});
 if(p.label)label(p.label,cx,cy+90,60,A(p.labelAt,t0+.9),GR,{maxW:bars?700:1400});
 if(bars){const mx=Math.max(...bars.map(b=>b.v)),bw=Math.min(150,640/bars.length-30);
  ink(G('bax'+bars.length,()=>mkGroup([lnS(1000,840,1820,840,INK,5,2)])),eo(K(t0,.6)));
  bars.forEach((b,i)=>{const x=1060+i*(bw+40),h=b.v/mx*420,ta=A(b.at,t0+1+i*.6),u=eo(K(ta,.6));
   ink(G('bar'+i+bars.length+h,()=>mkGroup([...rectS(x,840-h,bw,h,i===bars.length-1&&p.hiLast?RED:INK,6,70+i)])),u);
   label(b.label||'',x+bw/2,895,40,ta+.2,INK,{maxW:bw+30})})}}};
/* 10 scale: weighing two things */
TEMPLATES.scale={req:['left','right'],lead:'L',draw(sc,p){
 chrome(sc);const cx=1280,py=430,half=330,tg=p.tip==='left'?-14:p.tip==='right'?14:0,ta=A(p.tipAt,sc.start+3);
 const u=eo(K(ta,.9)),damp=K(ta,2.2)<1?Math.sin((NOW-ta)*9)*(1-K(ta,2.2))*2.2:0,ang=(tg*u+damp)*D2R;
 const ex=(s)=>[cx+s*half*Math.cos(ang),py+s*half*Math.sin(ang)],L0=ex(-1),R0=ex(1);
 const st=[lnS(cx,900,cx,py+5,INK,9,3),lnS(L0[0],L0[1],R0[0],R0[1],INK,8,4)];
 [[L0,p.left],[R0,p.right]].forEach(([e,c],i)=>{const py2=e[1]+210,x=e[0];
  st.push(lnS(e[0],e[1],x-95,py2,GR,4,10+i),lnS(e[0],e[1],x+95,py2,GR,4,12+i),mkStroke([[x-120,py2],[x,py2+36],[x+120,py2]],7,INK,14+i))});
 ink(mkGroup(st),eo(K(sc.start+.2,.8)));
 [[L0,p.left,0],[R0,p.right,1]].forEach(([e,c,i])=>{const t0=A(c.at,sc.start+1+i),x=e[0],y=e[1]+210;
  if(c.icon)drawIcon(c.icon,x,y-80,72,K(t0,.5));if(c.label)label(c.label,x,y-(c.icon?5:25)-(c.icon?0:0),c.icon?42:52,t0+.1,INK,{maxW:250})})}};
/* 11 focus: one big icon with a label, optionally struck out */
TEMPLATES.focus={req:['icon'],lead:'L',draw(sc,p){
 chrome(sc);const t0=A(p.at,sc.start+.4),cx=A(p.x,1300),sz=A(p.size,190);
 drawIcon(p.icon,cx,540,sz,eo(K(t0,.9)));
 if(p.label)label(p.label,cx,A(p.labelY,880),68,A(p.labelAt,t0+.6),INK,{maxW:760});
 if(p.cross!==undefined&&p.cross!==false)xAt(cx,540,sz*.9,A(p.crossAt,t0+1.2));
 (p.sparks?[[-1,-1],[1,-1],[1,1],[-1,1]]:[]).forEach((q,i)=>ink(G('fsp'+i+cx,()=>mkGroup(sparkS(cx+q[0]*(sz+60),540+q[1]*(sz*.8),22,INK,5))),K(t0+.8+i*.08,.3)))}};
/* 12 crowd: many ordinary figures and one outlier (the lead), optional burden */
TEMPLATES.crowd={req:['outlier'],lead:'R',leadPose:(sc,p)=>p.burden?[[p.burden.dropAt+.35,'carry']]:[],draw(sc,p){
 chrome(sc);const n=A(p.n,4);
 for(let i=0;i<n;i++){const x=300+i*150,t0=sc.start+.3+i*.18;actor([[0,'idle']],t0,.7,x,900,.85,1,{who:'man',seed:70+i});if(p.mark!=='none')ink(G('crm'+i,()=>ringsG(x+8,420,16,BLUE,5)),K(t0+.6,.3))}
 const o=p.outlier,ot=A(o.at,sc.start+3);
 ink(G('oul',()=>mkGroup([ellS(1450,660,250,340,4,RED,6)])),eo(K(ot,.8)));label(o.label||'outlier',1450,265,60,ot,RED,{maxW:420});
 if(p.burden&&PST.vis){const bu=p.burden.dropAt,uu=clamp((NOW-bu)/.5),J=PST.J,rx=J.S[0]-100,ry=J.S[1]-48,y=uu<1?lerp(-160,ry,uu*uu):ry;
  if(uu>0){ctx.save();ctx.translate(rx,y);ink(G('bou',()=>mkGroup([circS(0,0,95,8,INK,8),...hatchLines([[-60,40,-10,60],[-70,10,10,60],[-60,-20,40,50],[-40,-50,60,20]],GR,3)])),1);ctx.restore();
   if(uu>=1&&p.burden.label)T(p.burden.label,rx,y+14,52,INK,bu,.01,{align:'c',p:1})}}}};
/* 13 verdict: the conclusion; big phrase, optional mark, lead celebrates, optional family */
TEMPLATES.verdict={req:['text'],lead:'C',leadPose:(sc,p)=>[[A(p.at,sc.start+.5)+.6,p.pose||'cele']],draw(sc,p){
 chrome(sc);const t0=A(p.at,sc.start+.5),size=fitSize(p.text,104,1500),w=tw(p.text,size),vy=A(p.y,330);
 HL(960-w/2-14,vy-size*.74,w+28,size*.95,A(p.hlAt,t0+.5),.45,9);T(p.text,960,vy,size,INK,t0,.9,{align:'c'});
 if(p.mark)drawIcon(p.mark,960+w/2+95,vy-30,58,K(A(p.markAt,t0+1),.4));
 if(p.family){const ta=A(p.familyAt,t0+1);actor([[0,'idle']],ta,.9,1230,900,1.35,-1,{who:'woman',seed:81});actor([[0,'idle']],ta+.3,.8,1420,900,1.45,-1,{who:'child',seed:82})}
 (p.labels||[]).forEach(l=>label(l.text,l.x||960,975,52,l.at,INK,{maxW:420}))}};
function ringsG(cx,cy,r,col=BLUE,w=7){return mkGroup([circS(cx-r*.62,cy,r,5,col,w),circS(cx+r*.62,cy,r,6,col,w,1.07,-.6)])}
