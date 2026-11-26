// Worked example: the "single pastor" article, drawn with the template library.
// Cue syntax:  's9:fit' = the word "fit" in sentence s9 ;  's9' = start of s9 ;  's9:end' ;  add '@-0.2' / '@+0.3' to shift in seconds.
SCENES.push(
 { from:'s1', to:'s1', template:'talk', headline:"Marriage isn't a must", hi:{word:'must'},
   lead:{pose:[['s1:said','say']]},
   p:{ bubble:{ kind:'say', at:'s1:said', out:'s2@-0.1', items:[{ icon:'rings', at:'s1:marriage', crossAt:"s1:isn't" }] } },
   extras:[{ text:'Ugandan pastor', x:300, y:640, size:46, at:'s1:ugandan@-0.1' }] },

 { from:'s2', to:'s2', template:'list', headline:'What he argued',
   lead:{pose:[['s2:singleness','think'],['s2:stop','stop']]},
   p:{ items:[ { text:'Singleness', at:'s2:singleness', hl:true },
               { text:'self-discovery', at:'s2:self-discovery' },
               { text:'spiritual maturity', at:'s2:spiritual', icon:'tree' },
               { text:'stop pressuring pastors', at:'s2:stop', mark:'cross', icon:'church' } ] } },

 { from:'s3', to:'s7', template:'compare', headline:'With a qualifier',
   lead:{pose:[['s3','shrug'],['s4:automatically','think'],['s7','point']]},
   p:{ left:{ title:'automatically a problem?', at:'s4:automatically', stamp:'No.', stampAt:'s5' },
       right:{ title:'Probably a problem?', at:'s6:probably', stamp:'Yes.', stampAt:'s7' } } },

 { from:'s8', to:'s8', template:'talk', headline:'Godly or fruitful?', lead:{pose:[['s8','think']]},
   p:{ bubble:{ kind:'think', at:'s8:whether', items:[{ icon:'heart', text:'godly', at:'s8:godly' },{ icon:'tree', text:'fruitful', at:'s8:fruitful' }] } } },

 { from:'s9', to:'s9', template:'story', headline:'What the apostles expected', lead:false,
   p:{ people:[{ name:'the apostles', who:'scribe', pose:'say', x:1250, at:'s9:apostles' }],
       bubble:{ from:0, text:'fit to pastor', at:'s9:fit@-0.3' } } },

 { from:'s10', to:'s10', template:'quote', headline:'Paul says',
   p:{ name:'Paul', who:'scribe', text:'a one-woman man', at:'s10', textAt:'s10:one-woman@-0.3' },
   extras:[ { text:'character', x:560, y:790, size:104, hl:true, at:'s10:character@-0.05' },
            { icon:'scroll', x:1010, y:730, size:95, at:'s10:marriage' },
            { text:'marriage certificate', x:1010, y:880, size:44, at:'s10:marriage' },
            { icon:'xmark', x:1010, y:730, size:100, at:'s10:certificate@-0.1' } ] },

 { from:'s11', to:'s11', template:'story', headline:'Manage his own household',
   lead:{slot:'C', pose:[["s11:can't",'slump'],['s11:care@-0.3','point']]},
   p:{ place:'house', people:[{ who:'woman', pose:'idle', x:600, face:1, at:'s11:household' },{ who:'child', pose:'idle', x:690, face:1, at:'s11:household@+0.4' }] },
   extras:[ { icon:'question', x:340, y:380, size:70, col:'red', at:"s11:can't" },
            { icon:'church', x:1620, ground:true, size:220, at:'s11:care@-0.2' },
            { icon:'question', x:1620, y:400, size:70, col:'red', at:'s11:church' } ] },

 { from:'s12', to:'s12', template:'focus', headline:'God\'s proving ground', lead:{pose:[['s12','point']]},
   p:{ icon:'house', label:'proving ground', at:'s12:household', labelAt:'s12:proving', sparks:true } },

 { from:'s13', to:'s14', template:'compare', headline:'A magic checkbox?', lead:{slot:'C'},
   p:{ left:{ title:'a magic checkbox', at:'s13:magic', icon:'tick' }, right:{ title:'ordinary training ground', at:'s14:ordinary', icon:'shield' } },
   extras:[ { icon:'xmark', x:450, y:590, size:100, at:'s13:checkbox@+0.1' } ] },

 { from:'s15', to:'s15', template:'crowd', headline:'Burden of proof',
   p:{ n:4, outlier:{ label:'outlier', at:'s15:outlier' }, burden:{ label:'proof', dropAt:'s15:burden' } } },

 { from:'s16', to:'s17', template:'focus', headline:'What about Paul?', lead:{ who:'scribe', pose:[['s16','shrug'],['s17:gift@-0.3','point']] },
   p:{ icon:'gift', label:'rare, extraordinary gift', at:'s17:gift@-0.4', labelAt:'s17:rare' },
   extras:[ { text:'Paul', x:520, y:985, size:44, at:'s16:paul' }, { text:'single', x:520, y:350, size:70, hl:true, at:'s17:single' } ] },

 { from:'s18', to:'s18', template:'stat', headline:'Luther',
   p:{ big:'one in a thousand', at:'s18:one', label:'Luther said', labelAt:'s18' } },

 { from:'s19', to:'s19', template:'focus', headline:'Burning with passion', lead:{pose:[['s19:burning@-0.2','anx']]},
   p:{ icon:'bomb', label:'ticking time bomb', at:'s19:ticking@-0.3', labelAt:'s19:ticking' },
   extras:[ { icon:'flame', x:540, y:340, size:60, at:'s19:burning' },
            { icon:'gift', x:900, y:740, size:70, at:"s19:isn't" }, { icon:'xmark', x:900, y:740, size:80, at:'s19:gifted' } ] },

 { from:'s20', to:'s20', template:'verdict', lead:{slot:'C'},
   p:{ text:'Character is the real qualification', at:'s20', mark:'tick', markAt:'s20:qualification', family:true, familyAt:'s20:husband@-0.5',
       labels:[{ text:'a husband', x:960, at:'s20:husband' },{ text:'a father', x:1420, at:'s20:father' }] },
   extras:[ { text:'ordinarily', x:470, y:600, size:84, hl:true, at:'s20:ordinarily@-0.05' } ] }
);
