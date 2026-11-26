/* ===== SCENE RUNTIME: compile scene list, lead actor, transitions, SFX schedule, renderAt ===== */
const SLOTX={L:520,C:960,R:1440};
const CUEKEYS=['at','out','crossAt','stampAt','tipAt','dropAt','subAt','textAt','labelAt','placeAt','markAt','hlAt','familyAt'];
const FXKEY={at:'scratch',stampAt:'pop',crossAt:'scratch',tipAt:'swoosh',dropAt:'thud',subAt:'scratch',textAt:'scratch',labelAt:'scratch',placeAt:'scratch',markAt:'pop',hlAt:'swoosh',familyAt:'scratch'};
const SIDS=TIMING.sentences.map(s=>s.id),SIDX={};SIDS.forEach((id,i)=>SIDX[id]=i);
const FX=[],ERR=[],WARN=[],SCN=[],PK=[],PPOSE=[];
const PUNC=/[“”".,:;?!—()]/g;
function cue(spec,sc){
 if(typeof spec==='number')return spec;
 const m=/^(.*?)(?:@([+-]?\d*\.?\d+))?$/.exec(String(spec).trim()),base=m[1],off=m[2]?parseFloat(m[2]):0;
 if(base==='scene')return sc.start+off;if(base==='sceneEnd')return sc.end+off;
 const parts=base.split(':'),id=parts[0];
 if(!SENT[id])throw new Error('unknown sentence id "'+id+'"');
 if(parts.length===1)return SENT[id][1]+off;if(parts[1]==='end')return SENT[id][2]+off;
 let w=parts.slice(1).join(':').toLowerCase().replace(/[’‘]/g,"'").replace(PUNC,''),nth=0;const h=w.indexOf('#');if(h>=0){nth=parseInt(w.slice(h+1));w=w.slice(0,h)}
 return wt(id,w,nth)+off}
function resolve(o,sc,cues){
 if(Array.isArray(o)){o.forEach((x,i)=>{if(typeof x==='object'&&x)resolve(x,sc,cues)});return}
 if(!o||typeof o!=='object')return;
 for(const k of Object.keys(o)){const v=o[k];
  if(CUEKEYS.includes(k)&&(typeof v==='string'||typeof v==='number')){try{o[k]=cue(v,sc);cues.push({t:o[k],k})}catch(e){ERR.push(sc._n+': cue "'+v+'" ('+k+'): '+e.message)}}
  else if(typeof v==='object')resolve(v,sc,cues)}}
function wordsOf(s){return String(s).trim().split(/\s+/).filter(Boolean).length}
function checkText(o,sc,path){
 if(Array.isArray(o)){o.forEach((x,i)=>checkText(x,sc,path+'['+i+']'));return}
 if(!o||typeof o!=='object')return;
 for(const k of Object.keys(o)){const v=o[k];
  if(typeof v==='string'&&['text','label','title','sub','big','name','ref'].includes(k)){const lim=(sc.template==='quote'&&k==='text')||(sc.template==='verdict'&&k==='text')||(sc.template==='title')||(sc.template==='scripture')?14:7;
   if(wordsOf(v)>lim)WARN.push(sc._n+': text too long ('+wordsOf(v)+' words, keep under '+lim+') at '+path+'.'+k+': "'+v.slice(0,40)+'"')}
  else if(typeof v==='object')checkText(v,sc,path+'.'+k)}}
function checkIcons(o,sc,path){
 if(Array.isArray(o)){o.forEach((x,i)=>checkIcons(x,sc,path+'['+i+']'));return}
 if(!o||typeof o!=='object')return;
 for(const k of Object.keys(o)){const v=o[k];
  if(k==='icon'&&typeof v==='string'&&ICON_NAMES.indexOf(v)<0)WARN.push(sc._n+': unknown icon "'+v+'" at '+path+'.icon - it will draw nothing. Known icons: '+ICON_NAMES.join(', '));
  else if(typeof v==='object')checkIcons(v,sc,path+'.'+k)}}
function compileScenes(){
 ERR.length=WARN.length=SCN.length=FX.length=PK.length=PPOSE.length=0;
 if(!SCENES.length){ERR.push('no scenes defined');return}
 let prevTo=-1;
 SCENES.forEach((raw,i)=>{
  const sc=JSON.parse(JSON.stringify(raw));sc._n='scene '+(i+1)+(sc.from?' ('+sc.from+'..'+sc.to+')':'');
  const T=TEMPLATES[sc.template];
  if(!T){ERR.push(sc._n+': unknown template "'+sc.template+'"');return}
  if(!(sc.from in SIDX)||!(sc.to in SIDX)){ERR.push(sc._n+': from/to must be sentence ids');return}
  const a=SIDX[sc.from],b=SIDX[sc.to];
  if(b<a)ERR.push(sc._n+': "to" is before "from"');
  if(a!==prevTo+1)ERR.push(sc._n+': starts at '+sc.from+' but the previous scene ended at '+(SIDS[prevTo]||'(start)')+(a>prevTo+1?' - sentences '+SIDS[prevTo+1]+'..'+SIDS[a-1]+' are not covered':' - scenes overlap'));
  prevTo=b;sc.start=SENT[sc.from][1];sc.end=SENT[sc.to][2];sc.p=sc.p||{};
  (T.req||[]).forEach(k=>{if(sc.p[k]===undefined)ERR.push(sc._n+': template "'+sc.template+'" needs p.'+k)});
  const cues=[];resolve(sc.p,sc,cues);if(sc.hi){try{sc.hi.at=cue(sc.hi.at===undefined?sc.from+':'+sc.hi.word:sc.hi.at,sc);cues.push({t:sc.hi.at,k:'hi'})}catch(e){ERR.push(sc._n+': highlight: '+e.message)}}
  if(sc.lead&&typeof sc.lead==='object'&&Array.isArray(sc.lead.pose))sc.lead.pose.forEach(q=>{try{q[0]=cue(q[0],sc);cues.push({t:q[0],k:'pose'})}catch(e){ERR.push(sc._n+': lead pose cue: '+e.message)}});
  if(sc.headline&&wordsOf(sc.headline)>7)WARN.push(sc._n+': headline longer than 7 words');
  if(sc.extras)resolve(sc.extras,sc,cues);checkText(sc.p,sc,'p');checkText(sc.extras||[],sc,'extras');checkIcons(sc.p,sc,'p');checkIcons(sc.extras||[],sc,'extras');sc.cues=cues;sc.T=T;SCN.push(sc)});
 if(prevTo!==SIDS.length-1)ERR.push('last scene ends at '+SIDS[prevTo]+' but the narration ends at '+SIDS[SIDS.length-1]+' - sentences '+SIDS[prevTo+1]+'..'+SIDS[SIDS.length-1]+' are not covered');
 if(ERR.length)return;
 // transitions between scenes
 SCN.forEach((sc,i)=>{if(i===SCN.length-1)return;const nx=SCN[i+1];let ts=sc.end-.1,te=nx.start+.1;
  if(te-ts<.5){const m=(sc.end+nx.start)/2;ts=m-.25;te=m+.25}if(te-ts>1.1){ts=sc.end-.1;te=ts+1.1}
  sc.tr=[ts,te];const gap=nx.start-sc.end;if(gap<.12)WARN.push('scene '+(i+1)+'/'+(i+2)+': the cut falls between sentences with almost no pause ('+gap.toFixed(2)+' s); the scroll may cover words. Cut at a longer pause.')});
 // static-hold check
 SCN.forEach((sc,i)=>{const ts=[sc.start,sc.end,...sc.cues.map(c=>c.t)].filter(t=>t>=sc.start-.5&&t<=sc.end+.5).sort((x,y)=>x-y);for(let k=1;k<ts.length;k++)if(ts[k]-ts[k-1]>3.8)WARN.push('scene '+(i+1)+' ('+sc.template+'): nothing changes between '+ts[k-1].toFixed(1)+'s and '+ts[k].toFixed(1)+'s; add a cue ("at") so something appears on a word.')});
 // lead actor keys
 const leadOf=sc=>{if(sc.lead===false)return null;const d=sc.T.lead;const L=sc.lead&&typeof sc.lead==='object'?sc.lead:{};const slot=L.slot||(d||null);if(!slot&&!L.x)return null;return{x:L.x||SLOTX[slot],face:L.face||1,who:L.who||(typeof LEAD_DEFAULT!=='undefined'?LEAD_DEFAULT:'pastor')}};
 let prev=null,pose=[];
 SCN.forEach((sc,i)=>{const cur=leadOf(sc),tr=i?SCN[i-1].tr:null;
  if(cur){const L=sc.lead&&typeof sc.lead==='object'?sc.lead:{};
   if(prev&&tr){const dx=cur.x-prev.x,fc=dx<-5?-1:dx>5?1:prev.face;PK.push({t:tr[0],x:prev.x,walk:7,face:fc,who:prev.who},{t:tr[1],x:cur.x,face:cur.face,who:cur.who})}
   else{PK.push({t:sc.start+.05,x:cur.x,gy:900,vis:1,on:1.1,face:cur.face,who:cur.who})}
   pose.push([sc.start,'idle']);
   if(sc.T.leadPose)sc.T.leadPose(sc,sc.p).forEach(q=>pose.push(q));
   if(typeof L.pose==='string')pose.push([sc.start+.05,L.pose]);else if(Array.isArray(L.pose))L.pose.forEach(q=>pose.push(q))}
  else if(prev&&i){const tr0=SCN[i-1].tr;PK.push({t:tr0[0],x:prev.x,walk:7,face:1,who:prev.who},{t:tr0[1],x:2150},{t:tr0[1]+.05,vis:0})}
  prev=cur});
 PK.push({t:DUR+5,x:(prev&&prev.x)||960});
 PK.sort((a,b)=>a.t-b.t);
 pose.sort((a,b)=>a[0]-b[0]);pose.forEach((q,i)=>{if(!POSE[q[1]])ERR.push('unknown pose "'+q[1]+'"');PPOSE.push(q)});if(!PPOSE.length)PPOSE.push([0,'idle']);
 // sfx
 SCN.forEach((sc,i)=>{if(sc.headline)FX.push({t:sc.start+.1,type:'scratch',dur:1.2});
  sc.cues.forEach(c=>{const ty=FXKEY[c.k];if(ty)FX.push({t:c.t,type:ty,dur:ty==='scratch'?.5:.3})});
  if(sc.tr)FX.push({t:sc.tr[0],type:'rustle',dur:sc.tr[1]-sc.tr[0]})});
 PK.forEach(k=>{if(k.on)FX.push({t:k.t,type:'scratch',dur:1})});
 FX.sort((a,b)=>a.t-b.t);for(let i=FX.length-1;i>0;i--)if(FX[i].type===FX[i-1].type&&FX[i].t-FX[i-1].t<.18)FX.splice(i,1);
 // special-case: ticking sounds on a 'bomb' icon etc. are not automatic; keep it simple
}
/* ---- lead actor (screen space, walks between scenes) ---- */
let PST={J:null,vis:false};
function leadState(t){
 let k=0;for(let i=0;i<PK.length;i++)if(PK[i].t<=t)k=i;
 let vis=false,on=1,ont=0,who='pastor';
 for(let i=0;i<=k;i++){if(PK[i].vis===1){vis=true;on=PK[i].on;ont=PK[i].t}if(PK[i].vis===0)vis=false;if(PK[i].who)who=PK[i].who}
 if(!vis)return{vis:false};
 const a=PK[k];let b=PK[k+1];while(b&&b.t===a.t){b=PK[++k+1]}
 let x=a.x;if(b&&b.x!==undefined&&a.walk)x=lerp(a.x,b.x,eio(clamp((t-a.t)/(b.t-a.t))));
 let P=seqPose(PPOSE,t,.45);P=Object.assign({},P,{head:P.head+Math.sin(t*2.2)*1.5});
 if(a.walk&&b){const w=eio(clamp(Math.min((t-a.t)/.18,(b.t-t)/.18)));P=lerpPose(P,walkPose(t*a.walk,1,P),w)}
 const acc=ACC[who]||ACC.pastor,F=Fig(P,x,a.gy||900,1.5,a.face||1,Object.assign({seed:11},acc));
 return{vis:true,F,J:F.J,p:eo(clamp((t-ont)/on)),scroll:!!acc.scroll}}
/* ---- extras: free-placed callouts any scene can add ({text|icon|arrow, x, y, size, col, at}) ---- */
const COLS={red:RED,blue:BLUE,gray:GR,ink:INK};
function drawExtras(sc){
 sc.extras.forEach((q,i)=>{const t0=A(q.at,sc.start),col=COLS[q.col]||INK;
  if(q.arrow){const k='xa'+sc._n+i;ink(G(k,()=>mkGroup(arrS(q.arrow[0],q.arrow[1],q.arrow[2],q.arrow[3],A(q.bend,0),COLS[q.col]||GR,6,20+i))),eo(K(t0,.5)));return}
  if(q.text){const size=fitSize(q.text,A(q.size,54),A(q.maxW,900)),w=tw(q.text,size),ax=q.align||'c',x0=ax==='c'?q.x-w/2:q.x;
   if(q.hl)HL(x0-14,q.y-size*.78,w+28,size*.98,t0+.3,.4,5+i);T(q.text,q.x,q.y,size,col,t0,.6,{align:ax})}
  if(q.icon){const sz=A(q.size,90),y=q.ground?900-72*sz/100:q.y;drawIcon(q.icon,q.x,y,sz,eo(K(t0,.7)),{col:q.col?col:undefined});if(q.crossAt!==undefined)xAt(q.x,y,sz*.9,q.crossAt)}
  else if(q.crossAt!==undefined)xAt(q.x,q.y,A(q.size,90)*.9,q.crossAt)})}
/* ---- frame ---- */
function renderAt(t){
 NOW=t;ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
 PST=leadState(t);
 let cur=0,tin=-1;
 for(let j=0;j<SCN.length-1;j++){const tr=SCN[j].tr;if(t>=tr[1])cur=j+1;if(t>=tr[0]&&t<tr[1])tin=j}
 const dp=(i,ox)=>{ctx.save();ctx.translate(ox,0);const sc=SCN[i];sc.T.draw(sc,sc.p);if(sc.extras)drawExtras(sc);ctx.restore()};
 if(tin>=0){const tr=SCN[tin].tr,e=eio((t-tr[0])/(tr[1]-tr[0]));dp(tin,-W*e);dp(tin+1,W*(1-e))}else dp(cur,0);
 if(PST.vis){drawFig(PST.F,PST.p);if(PST.scroll&&PST.p>.9)scrollAt(PST.J.bL[2])}
 ctx.globalCompositeOperation='multiply';ctx.drawImage(grain,0,0);ctx.globalCompositeOperation='source-over'}
function sceneAt(t){let cur=0;for(let j=0;j<SCN.length-1;j++)if(t>=SCN[j].tr[1])cur=j+1;return cur}

compileScenes();
