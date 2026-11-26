/* ===== AUDIO: original music + SFX in Web Audio, driven by the timing map ===== */
const MUS=[];
(function(){
 const bpm=100,beat=60/bpm,r=rng(42),mf=m=>440*Math.pow(2,(m-69)/12);
 const SETS=[[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],[[48,52,55],[55,59,62],[57,60,64],[53,57,60]],[[53,57,60],[48,52,55],[55,59,62],[57,60,64]],[[57,60,64],[55,59,62],[53,57,60],[52,56,59]]];
 const pent=[69,72,74,76,79,81];
 const tEnd=DUR-3.3;let bar=0;
 for(let t0=0.05;t0<tEnd-.01;t0+=beat*4,bar++){
  const set=SETS[Math.floor(bar/8)%SETS.length],ch=set[bar%4],sec=Math.floor(bar/8)%3; // 0 full, 1 sparse, 2 piano-led
  MUS.push({t:t0,k:'bass',f:mf(ch[0]-24),d:.5,v:.5},{t:t0+beat*2,k:'bass',f:mf(ch[2]-24),d:.5,v:.38});
  const pat=[0,1,2,1,2,1,2,1];
  pat.forEach((q,i)=>{if(r()<(sec===1?.55:sec===2?.4:.2))return;const note=ch[q]+(i%4===3?12:0)+12;MUS.push({t:t0+i*beat/2,k:'pluck',f:mf(note),d:.5,v:(sec===2?.15:.22)+(i%2?0:.08)})});
  if(bar%2===1||sec===2){[0,2,1,3,2].forEach((ix,i)=>{if(r()<.25)return;MUS.push({t:t0+i*beat*.8+(i>2?.1:0),k:'piano',f:mf(pent[(ix+bar)%6]),d:1.2,v:sec===2?.32:.26})})}
  if(sec!==1)for(let i=0;i<8;i++)MUS.push({t:t0+i*beat/2,k:'brush',d:.07,v:(i%4===2)?.5:(i%2?.2:.1)});
 }
 [48,55,60,64,67].forEach((m,i)=>MUS.push({t:tEnd+i*.07,k:'piano',f:mf(m),d:3.0,v:.3}));
 MUS.push({t:tEnd,k:'bass',f:mf(36),d:1.5,v:.5});
 MUS.sort((a,b)=>a.t-b.t)})();
/* ducking curve from the timing map: down while words are spoken, up in pauses */
function duckAt(t){
 let c=0;const n=7;
 for(let i=0;i<n;i++){const tt=t+(i-3)*.05;let sp=0;for(const s of TIMING.sentences){if(tt>=s.start&&tt<=s.end){sp=1;break}}c+=sp}
 c/=n;let g=1-.55*c;
 g*=clamp(t/1.0);g*=clamp((DUR-t)/1.5);return g}
function mkNoise(ac){const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0),q=rng(5);for(let i=0;i<d.length;i++)d[i]=q()*2-1;return b}
function env(g,when,a,dec,peak){g.gain.setValueAtTime(0.0001,when);g.gain.exponentialRampToValueAtTime(peak,when+a);g.gain.exponentialRampToValueAtTime(0.0001,when+a+dec)}
function voiceM(ac,dest,e,when,NB){
 const g=ac.createGain();g.connect(dest);
 if(e.k==='pluck'){const o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter();o.type='triangle';o2.type='sine';o.frequency.value=e.f;o2.frequency.value=e.f*2.003;f.type='lowpass';f.frequency.setValueAtTime(3200,when);f.frequency.exponentialRampToValueAtTime(700,when+.3);
  o.connect(f);o2.connect(f);f.connect(g);env(g,when,.004,.42,e.v*.5);o.start(when);o2.start(when);o.stop(when+.6);o2.stop(when+.6)}
 else if(e.k==='piano'){[[1,1],[2,.28],[3,.1]].forEach(([m,a])=>{const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.value=e.f*m;gg.gain.value=a;o.connect(gg);gg.connect(g);o.start(when);o.stop(when+e.d+.3)});env(g,when,.008,e.d,e.v*.4)}
 else if(e.k==='bass'){const o=ac.createOscillator(),o2=ac.createOscillator();o.type='sine';o2.type='triangle';o.frequency.value=e.f;o2.frequency.value=e.f;const gg=ac.createGain();gg.gain.value=.3;o2.connect(gg);gg.connect(g);o.connect(g);env(g,when,.006,e.d,e.v*.6);o.start(when);o2.start(when);o.stop(when+e.d+.2);o2.stop(when+e.d+.2)}
 else if(e.k==='brush'){const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=NB;f.type='bandpass';f.frequency.value=6000;f.Q.value=.6;s.connect(f);f.connect(g);env(g,when,.006,e.d,e.v*.16);s.start(when,Math.random()*0+((e.t*7.3)%1.5));s.stop(when+.15)}}
function voiceS(ac,dest,e,when,NB){
 const g=ac.createGain();g.connect(dest);const nz=(f1,f2,q)=>{const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=NB;s.loop=true;f.type='bandpass';f.frequency.setValueAtTime(f1,when);f.frequency.linearRampToValueAtTime(f2,when+e.dur);f.Q.value=q;s.connect(f);f.connect(g);s.start(when,(e.t*3.1)%1.5);s.stop(when+e.dur+.05)};
 if(e.type==='scratch'){nz(3400,4200,1.4);const q=rng(Math.floor(e.t*100));g.gain.setValueAtTime(0.0001,when);for(let t=0;t<e.dur;t+=.06)g.gain.linearRampToValueAtTime(.12+q()*.22,when+t+.02);g.gain.linearRampToValueAtTime(.0001,when+e.dur+.03)}
 else if(e.type==='rustle'){nz(900,2600,.8);g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(.3,when+e.dur*.35);g.gain.linearRampToValueAtTime(.0001,when+e.dur)}
 else if(e.type==='swoosh'){nz(500,3200,1.1);g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(.28,when+.15);g.gain.linearRampToValueAtTime(.0001,when+.4)}
 else if(e.type==='pop'){const o=ac.createOscillator();o.frequency.setValueAtTime(760,when);o.frequency.exponentialRampToValueAtTime(260,when+.09);o.connect(g);env(g,when,.004,.1,.45);o.start(when);o.stop(when+.2)}
 else if(e.type==='thud'){const o=ac.createOscillator();o.frequency.setValueAtTime(110,when);o.frequency.exponentialRampToValueAtTime(40,when+.25);o.connect(g);env(g,when,.004,.3,.9);o.start(when);o.stop(when+.4)}
 else if(e.type==='tick'){const o=ac.createOscillator();o.type='square';o.frequency.value=1900;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2000;o.connect(f);f.connect(g);env(g,when,.002,.03,.22);o.start(when);o.stop(when+.08)}
 else if(e.type==='boing'){const o=ac.createOscillator(),l=ac.createOscillator(),lg=ac.createGain();o.frequency.setValueAtTime(220,when);o.frequency.exponentialRampToValueAtTime(560,when+.12);o.frequency.exponentialRampToValueAtTime(240,when+.5);l.frequency.value=18;lg.gain.value=14;l.connect(lg);lg.connect(o.frequency);o.connect(g);env(g,when,.01,.5,.3);o.start(when);l.start(when);o.stop(when+.6);l.stop(when+.6)}}
/* schedule everything from time `from` (seconds on master audio); out: {m:musicBus, s:sfxBus} */
function scheduleAll(ac,bus,from,withMusic=true,withSfx=true,t0=ac.currentTime+.05){
 const NB=mkNoise(ac);const at=t=>t0+(t-from);
 if(withMusic){for(const e of MUS){if(e.t<from-.01)continue;voiceM(ac,bus.m,e,at(e.t),NB)}
  const mg=bus.mg;mg.gain.setValueAtTime(duckAt(from),t0);for(let t=Math.ceil(from*20)/20;t<=DUR;t+=.05)mg.gain.linearRampToValueAtTime(duckAt(t),at(t))}
 if(withSfx){for(const e of FX){if(e.t<from-.01)continue;voiceS(ac,bus.s,e,at(e.t),NB)}}}
/* render a stem for [a,b) seconds (chunked so long videos stay light); 4 s pre-roll lets notes ring across chunk edges */
async function renderStemRange(which,a,b){
 const sr=48000,pre=a>0?4:0,from=a-pre,len=b-from,ac=new OfflineAudioContext(1,Math.ceil(len*sr),sr);
 const mg=ac.createGain(),m=ac.createGain(),s=ac.createGain();mg.connect(m);m.connect(ac.destination);s.connect(ac.destination);
 scheduleAll(ac,{m:mg,mg:mg,s:s},from,which==='music',which==='sfx',0);
 const buf=await ac.startRendering();return buf.getChannelData(0).subarray(Math.round(pre*sr))}
