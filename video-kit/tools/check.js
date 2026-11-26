// Validates scenes against the timing map without a browser. Usage: node check.js <engineDir> <timing.json> <scenesDir> [out.json]
const fs=require('fs'),path=require('path'),vm=require('vm');
const [eng,timingPath,scenesDir,outPath]=process.argv.slice(2);
const rd=f=>fs.readFileSync(f,'utf8');
const files=['core.js','icons.js','templates.js'].map(f=>rd(path.join(eng,f)));
const sceneFiles=fs.existsSync(scenesDir)?fs.readdirSync(scenesDir).filter(f=>f.endsWith('.js')).sort():[];
let src='const TIMING='+rd(timingPath)+';\n'+files.join('\n')+'\nconst SCENES=[];\n';
const owner=[];
sceneFiles.forEach(f=>{src+='SCENES.length;'+'\n'+rd(path.join(scenesDir,f))+'\n'});
src+='\n'+rd(path.join(eng,'scenes.js'))+'\n({ERR,WARN,SCN:SCN.map(s=>({from:s.from,to:s.to,template:s.template,start:s.start,end:s.end,tr:s.tr||null,raw:SCENES[SCN.indexOf(s)]})),n:SCENES.length,fx:FX.length})';
const ctx={console,Math,JSON,Object,Array,String,Number,Date,parseInt,parseFloat,isNaN,Error,RegExp,Set,Map};
vm.createContext(ctx);
let res;
try{res=vm.runInContext(src,ctx,{filename:'project'})}catch(e){res={ERR:['Could not load scenes: '+e.message.split('\n')[0]+' (check for a typo, a missing comma, or an unclosed bracket in the scene files)'],WARN:[],SCN:[],n:0,fx:0}}
if(outPath)fs.writeFileSync(outPath,JSON.stringify(res));
res.ERR.forEach(e=>console.log('ERROR  '+e));res.WARN.forEach(w=>console.log('WARN   '+w));
const use={};res.SCN.forEach(s=>use[s.template]=(use[s.template]||0)+1);
console.log('\n'+res.n+' scenes, '+res.fx+' sound cues. Templates used: '+Object.entries(use).map(([k,v])=>k+' x'+v).join(', '));
console.log(res.ERR.length?'RESULT: '+res.ERR.length+' error(s) - fix these before building.':'RESULT: OK'+(res.WARN.length?' ('+res.WARN.length+' warning(s))':''));
process.exit(res.ERR.length?1:0);
