// "Copyright Is Not Holy" — 77 s argument. Cue syntax: 's9:fit' = the word "fit" in s9.
SCENES.push(
 { from:'s1', to:'s1', template:'title', p:{ text:'Copyright Is Not Holy', sub:'a case against holy copyright' } },

 { from:'s2', to:'s2', template:'talk', headline:'Made up', lead:{pose:[['s2','think'],['s2:invented','say']]},
   p:{ bubble:{ kind:'think', at:'s2@+0.2', items:[ { icon:'scroll', text:'invented', at:'s2:invented@-0.2' },
                                                   { icon:'book', text:'discovered', at:'s2:discovered@-0.2', crossAt:'s2:discovered@+0.25' } ] } } },

 { from:'s3', to:'s5', template:'compare', headline:'Theft is not copying',
   lead:{pose:[['s3','think'],['s5:sing','say']]},
   p:{ left:{ title:'theft', sub:'the ox is gone', icon:'ox', at:'s3:theft' },
       right:{ title:'copying', sub:'the ox is still there', icon:'song', at:'s5:learn@-0.1' } },
   extras:[ { text:'his ox', x:930, y:250, size:56, at:'s4:ox' },
            { icon:'xmark', x:450, y:590, size:130, at:'s4:ox@+0.35' } ] },

 { from:'s6', to:'s6', template:'focus', headline:'A granted privilege',
   lead:{pose:[['s6','think'],['s6:privilege','point']]},
   p:{ icon:'crown', label:'a monopoly', at:'s6:government-granted@-0.2', labelAt:'s6:production' },
   extras:[ { text:'a privilege', x:1000, y:250, size:54, hl:true, at:'s6:privilege@-0.2' },
            { icon:'xmark', x:1390, y:295, size:44, at:'s6:natural@+0.2' },
            { text:'natural right', x:1620, y:300, size:46, col:'gray', at:'s6:natural@-0.2' } ] },

 { from:'s7', to:'s7', template:'list', headline:'Policy, not morality',
   lead:{pose:[['s7','idle'],['s7:policy','point']]},
   p:{ items:[ { text:'terms', at:'s7:terms' },
               { text:'exceptions', at:'s7:exceptions' },
               { text:'compulsory licenses', at:'s7:compulsory' },
               { text:'expiration dates', at:'s7:expiration', hl:true } ] } },

 { from:'s8', to:'s8', template:'scale', headline:'Positive law',
   lead:{pose:[['s8','think'],['s8:foolish','shrug']]},
   p:{ left:{ label:'wise', icon:'gavel', at:'s8:wise' },
       right:{ label:'foolish', icon:'question', at:'s8:foolish' },
       tip:'level', tipAt:'s8:foolish@+0.4' } },

 { from:'s9', to:'s10', template:'talk', headline:"That's marketing",
   lead:{pose:[['s9','say'],['s10:calling','think']]},
   p:{ bubble:{ kind:'say', at:'s9:treat', items:[ { text:'piracy', at:'s9:piracy', crossAt:'s10:stealing@+0.2' },
                                                  { text:'stealing', at:'s9:stealing', crossAt:'s10:stealing@+0.2' } ] } } },

 { from:'s11', to:'s11', template:'compare', headline:'Rules that change',
   lead:{pose:[['s11','think'],['s11:differ','shrug']]},
   p:{ left:{ title:'every few decades', icon:'scroll', at:'s11:every' },
       right:{ title:'differs by country', icon:'book', at:'s11:differ' } },
   extras:[ { text:'not intrinsic', x:960, y:250, size:50, col:'red', at:'s11:immoral' } ] },

 { from:'s12', to:'s13', template:'list', headline:'The real moral duties',
   lead:{pose:[['s12','point']]},
   p:{ items:[ { text:"don't defraud", at:'s12:defraud', mark:'tick' },
               { text:"don't plagiarize", at:'s12:plagiarize', mark:'tick' },
               { text:'honor contracts', at:'s12:honor@-0.2', mark:'tick' },
               { text:"another's work", at:'s12:claim@-0.1', mark:'tick' },
               { text:'commanded', at:'s13:commanded', mark:'tick', hl:true } ] } },

 { from:'s14', to:'s14', template:'focus', headline:'Dressed in clothing',
   lead:{pose:[['s14','point']]},
   p:{ icon:'contract', label:'a legal bargain', at:'s14:legal@-0.2', labelAt:'s14:legal' },
   extras:[ { text:'moral clothing', x:980, y:290, size:54, hl:true, at:'s14:clothing' },
            { icon:'coat', x:980, y:470, size:70, at:'s14:clothing@+0.15' } ] },

 { from:'s15', to:'s15', template:'compare', headline:'Limited monopolies',
   lead:{pose:[['s15','think'],['s15:manufacture','shrug']]},
   p:{ left:{ title:'may grant', sub:'limited monopolies', icon:'crown', at:'s15:may' },
       right:{ title:'cannot manufacture', sub:'sin', stamp:'No.', stampAt:'s15:manufacture' } } },

 { from:'s16', to:'s16', template:'focus', headline:'Stop baptizing',
   lead:{pose:[['s16','point']]},
   p:{ icon:'crown', label:'as righteousness', at:'s16@+0.1', labelAt:'s16:righteousness', cross:true, crossAt:'s16:statutory@+0.1' } },

 { from:'s17', to:'s18', template:'verdict', lead:{slot:'C'},
   p:{ text:'Prudent, not holy', at:'s17@-0.2', y:240, mark:'xmark', markAt:'s18:not@-0.1' } }
);
