import { spawn } from "node:child_process";
const port = 9600 + Math.floor(Math.random()*200);
const chrome = spawn(process.env.CHROME_PATH||"google-chrome", ["--headless=new","--disable-gpu","--no-sandbox","--remote-debugging-port="+port,"--user-data-dir=/tmp/chrome-err-"+port,"about:blank"],{stdio:"ignore"});
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
let id=0; const rpc=(ws,method,params)=>new Promise((res,rej)=>{const my=++id;const on=(ev)=>{const m=JSON.parse(ev.data);if(m.id!==my)return;ws.removeEventListener("message",on);m.error?rej(new Error(JSON.stringify(m.error))):res(m.result)};ws.addEventListener("message",on);ws.send(JSON.stringify({id:my,method,params:params||{}}))});
(async()=>{
  let page=null;
  for(let i=0;i<100&&!page;i++){try{page=(await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==="page")}catch(e){} if(!page)await sleep(200)}
  const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  await rpc(ws,"Runtime.enable"); await rpc(ws,"Log.enable");
  ws.addEventListener("message",(ev)=>{const m=JSON.parse(ev.data);
    if(m.method==="Runtime.exceptionThrown") console.log("EXC:", m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description?.split("\n")[0]);
    if(m.method==="Log.entryAdded" && m.params.entry.level!=="verbose") console.log("LOG:", m.params.entry.level, m.params.entry.text.slice(0,200));
    if(m.method==="Runtime.consoleAPICalled") console.log("CON:", m.params.type, (m.params.args||[]).map(a=>a.value||a.description).join(" ").slice(0,300));
  });
  await rpc(ws,"Page.enable");
  await rpc(ws,"Page.navigate",{url:"http://127.0.0.1:8081/"});
  await sleep(12000);
  const st = await rpc(ws,"Runtime.evaluate",{expression:"JSON.stringify({k:typeof window.K, draw:typeof window.drawAt, p:window.__bootPhase, log:window.__phaseLog, err:window.__bootError, ready:window.__ready})",returnByValue:true});
  console.log("STATE:", st.result.value);
  ws.close(); chrome.kill("SIGKILL"); process.exit(0);
})().catch(e=>{console.error(e);chrome.kill("SIGKILL");process.exit(1)});
