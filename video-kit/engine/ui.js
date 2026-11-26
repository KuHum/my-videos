/* ===== PLAYER UI ===== */
const $=id=>document.getElementById(id);
let actx=null,sess=null,bus=null,playing=false,startCtx=0,startT=0,curT=0,voBuf=null,expDest=null,lastBlob=null,lastExt='webm';
const fmt=t=>{t=Math.max(0,t);return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')};
function msg(s){$('msg').textContent=s}
async function ensureAudio(){
 if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
 if(actx.state==='suspended')await actx.resume();
 if(!voBuf&&window.VO_B64){try{const bin=atob(window.VO_B64),ab=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)ab[i]=bin.charCodeAt(i);voBuf=await actx.decodeAudioData(ab.buffer)}catch(e){msg('Could not decode the built-in voiceover. Use "Load voiceover".')}}}
function stopAudio(){if(sess){try{sess.gain.value=0;sess.disconnect()}catch(e){}sess=null}}
function startAudio(from){
 stopAudio();sess=actx.createGain();sess.connect(actx.destination);if(expDest)sess.connect(expDest);
 const mv=actx.createGain(),sv=actx.createGain(),mg=actx.createGain();mg.connect(mv);mv.connect(sess);sv.connect(sess);
 mv.gain.value=+$('mvol').value;sv.gain.value=+$('svol').value;bus={m:mg,mg:mg,s:sv,mv,sv};
 const t0=actx.currentTime+.06;
 scheduleAll(actx,bus,from,true,true,t0);
 if(voBuf){const s=actx.createBufferSource();s.buffer=voBuf;s.connect(sess);s.start(t0,from);}
 startCtx=t0;startT=from}
async function play(from){await ensureAudio();if(from===undefined)from=curT>=DUR-.05?0:curT;playing=true;startAudio(from);$('pp').textContent='Pause'}
function pause(){if(playing){curT=clamp(startT+(actx.currentTime-startCtx),0,DUR)}playing=false;stopAudio();$('pp').textContent='Play'}
function seek(t){curT=clamp(t,0,DUR);if(playing)startAudio(curT)}
function loop(){
 let t=curT;if(playing){t=clamp(startT+(actx.currentTime-startCtx),0,DUR);if(t>=DUR){curT=DUR;playing=false;stopAudio();$('pp').textContent='Play';if(rec&&rec.state==='recording')rec.stop()}}
 renderAt(t);$('seek').value=t*100;$('tm').textContent=fmt(t)+' / '+fmt(DUR);requestAnimationFrame(loop)}
let rec=null;
async function doExport(){
 await ensureAudio();pause();curT=0;
 const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'];
 const mt=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t));
 if(!mt){msg('This browser cannot record video here. Open the page in a desktop browser to export.');return}
 expDest=actx.createMediaStreamDestination();
 const st=cv.captureStream(30);expDest.stream.getAudioTracks().forEach(t=>st.addTrack(t));
 const chunks=[];rec=new MediaRecorder(st,{mimeType:mt,videoBitsPerSecond:8e6,audioBitsPerSecond:192e3});
 rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 rec.onstop=()=>{expDest=null;lastExt=mt.startsWith('video/mp4')?'mp4':'webm';lastBlob=new Blob(chunks,{type:mt.split(';')[0]});
  const v=$('prev');v.src=URL.createObjectURL(lastBlob);v.hidden=false;$('dl').disabled=false;
  msg(lastExt==='mp4'?'Export finished: MP4. If Download does nothing, long-press or right-click the video to save it.':'Export finished as WebM, not MP4 (this browser cannot record MP4). If Download does nothing, long-press or right-click the video to save it.')};
 msg('Exporting in real time ('+Math.round(DUR)+' s). Keep this tab open.');rec.start(500);await play(0)}
function saveBlob(b,name){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove()}
async function boot(){
 await document.fonts.load('700 40px Caveat');await document.fonts.ready;
 cv=$('cv');ctx=cv.getContext('2d');makeGrain();
 if(ERR.length){msg('This project has scene errors. Run the check command. First: '+ERR[0]);window.SCENE_ERRORS=ERR;return}
 renderAt(Math.min(3.3,DUR/2));
 $('seek').max=DUR*100;
 $('pp').onclick=()=>playing?pause():play();
 $('rs').onclick=()=>{curT=0;if(playing)startAudio(0)};
 $('seek').oninput=e=>seek(e.target.value/100);
 $('mvol').oninput=e=>{if(bus)bus.mv.gain.value=+e.target.value};$('svol').oninput=e=>{if(bus)bus.sv.gain.value=+e.target.value};
 $('ex').onclick=doExport;$('dl').onclick=()=>lastBlob&&saveBlob(lastBlob,'ink-pastor-explainer.'+lastExt);
 $('th').onclick=()=>{thumbCanvas(THUMB_T,THUMB_TITLE).toBlob(b=>saveBlob(b,'thumbnail.png'))};
 $('vo').onchange=async e=>{const f=e.target.files[0];if(!f)return;await ensureAudio();try{voBuf=await actx.decodeAudioData(await f.arrayBuffer());msg('Voiceover loaded ('+voBuf.duration.toFixed(2)+' s).')}catch(err){msg('That file could not be decoded.')}};
 addEventListener('keydown',e=>{if(e.code==='Space'&&e.target.tagName!=='INPUT'){e.preventDefault();playing?pause():play()}});
 loop()}
function thumbCanvas(t,title){const c=document.createElement('canvas');c.width=1280;c.height=720;const x=c.getContext('2d');renderAt(t);x.drawImage(cv,0,0,1280,720);
 if(title){x.save();x.font='700 84px Caveat';const w=x.measureText(title).width;x.fillStyle='rgba(244,239,228,.94)';x.fillRect(40,612,w+70,100);x.fillStyle=INK;x.textBaseline='alphabetic';x.fillText(title,75,688);x.strokeStyle=RED;x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(72,700);x.lineTo(40+w+40,696);x.stroke();x.restore()}
 return c}
window.ready=boot();window.getInfo=()=>({duration:DUR,scenes:SCN.map(s=>({t:s.template,a:s.start,b:s.end})),errors:ERR,warnings:WARN});window.thumbCanvas=thumbCanvas;window.frameJpeg=t=>{renderAt(t);return cv.toDataURL('image/jpeg',.92).split(',')[1]};
window.stemB64=async(w,a,b)=>{const f=await renderStemRange(w,a,b);const i=new Int16Array(f.length);for(let k=0;k<f.length;k++)i[k]=Math.max(-32768,Math.min(32767,Math.round(f[k]*32767)));let s='';const u=new Uint8Array(i.buffer);for(let k=0;k<u.length;k+=32768)s+=String.fromCharCode.apply(null,u.subarray(k,k+32768));return btoa(s)};
