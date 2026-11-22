import { spawn } from "node:child_process";
const port = 9500 + Math.floor(Math.random()*300);
const chrome = spawn(process.env.CHROME_PATH||"google-chrome", ["--headless=new","--disable-gpu","--no-sandbox","--autoplay-policy=no-user-gesture-required","--disable-background-timer-throttling","--remote-debugging-port="+port,"--user-data-dir=/tmp/chrome-phase-"+port,"http://127.0.0.1:8081/"],{stdio:"ignore"});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let id=0; const rpc=(ws,method,params)=>new Promise((res,rej)=>{const my=++id;const on=(ev)=>{const m=JSON.parse(ev.data);if(m.id!==my)return;ws.removeEventListener("message",on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)};ws.addEventListener("message",on);ws.send(JSON.stringify({id:my,method,params:params||{}}))});
(async()=>{
  let page=null;
  for(let i=0;i<100&&!page;i++){try{page=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==="page")}catch(e){} if(!page)await sleep(200)}
  const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  await rpc(ws,"Runtime.enable");
  const t0=Date.now();
  for(let i=0;i<240;i++){
    const v=await rpc(ws,"Runtime.evaluate",{expression:"JSON.stringify(window.__phaseLog||[])",returnByValue:true}).catch(()=>null);
    const log=v&&v.result&&v.result.value?JSON.parse(v.result.value):[];
    if(i%4===0) console.log(Math.round((Date.now()-t0)/100)/10+"s", log.join(" "), "ready:"+ (await rpc(ws,"Runtime.evaluate",{expression:"!!window.__ready",returnByValue:true}).then(r=>r.result.value).catch(()=>false)));
    if(await rpc(ws,"Runtime.evaluate",{expression:"!!window.__ready",returnByValue:true}).then(r=>r.result.value).catch(()=>false)){console.log("READY at", Math.round((Date.now()-t0)/100)/10+"s", log.join(" "));break}
    await sleep(500);
  }
  ws.close(); chrome.kill("SIGKILL"); process.exit(0);
})().catch(e=>{console.error(e);chrome.kill("SIGKILL");process.exit(1)});
