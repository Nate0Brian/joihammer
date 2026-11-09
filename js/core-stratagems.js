/* Core Stratagems transcrise/sumarizate din Core Rules PDF furnizat, sec. 15.02–15.12, pp. 55–57. */
var CORE_STRATAGEMS = [
 {name:'Command Re-roll',turnType:'either',cp:1,ref:'15.02 · p.56',when:'Orice fază, imediat după ce faci pentru o unitate/model friendly un Advance, Charge, Damage, Hazard, Hit sau Wound roll, un Save roll ori o aruncare pentru numărul de Attacks.',target:'Unitatea sau modelul pentru care ai făcut aruncarea.',effect:'Re-aruncă acel zar. Dacă ai aruncat mai multe zaruri simultan, alegi unul singur; la Charge roll trebuie re-aruncată întreaga aruncare.',tags:['Any phase','Re-roll']},
 {name:'Epic Challenge',turnType:'either',cp:1,ref:'15.03 · p.56',when:'Fight phase, imediat după ce o unitate CHARACTER friendly este selectată să lupte.',target:'Acea unitate CHARACTER.',effect:'Alege un model CHARACTER din unitate. Până la sfârșitul fazei, armele lui melee primesc [PRECISION].',tags:['Fight phase','Precision']},
 {name:'Insane Bravery',turnType:'your',cp:1,ref:'15.04 · p.56',when:'Battle-shock step din Command phase, chiar înainte să faci un Battle-shock roll pentru o unitate friendly.',target:'Acea unitate.',effect:'Battle-shock roll-ul reușește automat.',restriction:'Nu poți folosi acest stratagem mai mult de o dată pe bătălie.',tags:['Command phase','Battle-shock']},
 {name:'Explosives',turnType:'your',cp:1,ref:'15.05 · p.56',when:'În propria Shooting phase.',target:'O unitate friendly EXPLOSIVES/GRENADES, unengaged, eligibilă să tragă și care nu a făcut Advance în acest tur.',effect:'Alege un model EXPLOSIVES/GRENADES din unitate; apoi o unitate inamică unengaged, vizibilă și în 8” de acel model. Aruncă 6D6: pentru fiecare 4+, ținta suferă 1 mortal wound.',tags:['Your Shooting phase','Mortal wounds']},
 {name:'Crushing Impact',turnType:'your',cp:1,ref:'15.06 · p.56',when:'În propria Charge phase, imediat după ce o unitate MONSTER/VEHICLE friendly termină un Charge move.',target:'Acea unitate MONSTER/VEHICLE.',effect:'Alege o unitate inamică engaged cu unitatea ta și un model din unitatea ta engaged cu ea. Aruncă un număr de D6 egal cu Toughness-ul modelului: pentru fiecare 1, unitatea ta suferă 1 mortal wound; pentru fiecare 5+, unitatea inamică suferă 1 mortal wound (maximum 6 mortal wounds per unit).',tags:['Your Charge phase','Monster / Vehicle']},
 {name:'Rapid Ingress',turnType:'opponent',cp:1,ref:'15.07 · p.57',when:'La sfârșitul Movement phase a adversarului.',target:'O unitate friendly aflată în Strategic Reserves (cu excepția AIRCRAFT).',effect:'Unitatea ta face un Ingress move (20.04).',restriction:'Nu poți folosi acest stratagem în primul Battle Round.',tags:['Opponent Movement phase','Reserves']},
 {name:'Fire Overwatch',turnType:'opponent',cp:1,ref:'15.08 · p.57',when:'La sfârșitul Movement phase a adversarului.',target:'O unitate friendly unengaged (cu excepția unităților TITANIC).',effect:'Unitatea ta trage folosind Snap Shooting (15.09): poate ținti o singură unitate inamică vizibilă și eligibilă în 24”; fiecare atac lovește doar pe un hit roll nemodificat de 6; nu poți re-arunca hit rolls.',tags:['Opponent Movement phase','Shooting']},
 {name:'Smokescreen',turnType:'opponent',cp:1,ref:'15.10 · p.57',when:'La începutul Shooting phase a adversarului.',target:'O unitate friendly cu keyword SMOKE.',effect:'Până la sfârșitul fazei, când un atac țintește unitatea SMOKE sau o unitate care nu este complet vizibilă atacatorului din cauza unuia sau mai multor modele din unitatea SMOKE, ținta primește Benefit of Cover împotriva acelui atac.',tags:['Opponent Shooting phase','Cover']},
 {name:'Heroic Intervention',turnType:'opponent',cp:1,ref:'15.11 · p.57',when:'La sfârșitul Charge phase a adversarului.',target:'O unitate friendly unengaged aflată la 12” de una sau mai multe unități inamice. Poți selecta un VEHICLE doar dacă este CHARACTER/WALKER.',effect:'Rezolvă un charge cu unitatea. Înainte de Charge roll, alege un mod: Leap to Defend – poți ținti doar unități inamice care au făcut Charge move în această fază și sunt în distanța maximă; sau Into the Fray – dacă Charge roll-ul modificat este mai mare de 6, îl schimbi în 6, iar țintele pot fi unități inamice în 6” și în distanța maximă. Acest mod costă +1 CP.',tags:['Opponent Charge phase','Counter-charge']},
 {name:'Counter-offensive',turnType:'opponent',cp:2,ref:'15.12 · p.57',when:'În Fight step din Fight phase a adversarului, imediat după ce o unitate inamică și-a rezolvat atacurile.',target:'O unitate friendly eligibilă să lupte.',effect:'Până la sfârșitul fazei, unitatea ta primește Fights First și trebuie să fie următoarea unitate pe care o selectezi să lupte (12.04).',tags:['Opponent Fight phase','Fights First']}
];
/* Turn-colour key follows the Core Rules stratagem key (p.55):
   your turn / either player's turn / opponent's turn. */
(function(){
 if(document.getElementById('coreStratagemTurnStyles')) return;
 var st=document.createElement('style'); st.id='coreStratagemTurnStyles';
 st.textContent=
 '.core-strat-card.turn-your{border-left:5px solid #005078!important}'+
 '.core-strat-card.turn-either{border-left:5px solid #00836f!important}'+
 '.core-strat-card.turn-opponent{border-left:5px solid #c00000!important}'+
 '.core-strat-turn{display:inline-flex;align-items:center;gap:5px;width:max-content;max-width:100%;font:700 10px/1.2 "Source Sans 3",sans-serif;letter-spacing:.045em;text-transform:uppercase;border-radius:4px;padding:4px 7px;margin-top:3px}'+
 '.turn-your .core-strat-turn{background:rgba(0,80,120,.22);color:#8bc9eb}'+
 '.turn-either .core-strat-turn{background:rgba(0,131,111,.22);color:#7fe0cb}'+
 '.turn-opponent .core-strat-turn{background:rgba(192,0,0,.20);color:#ff9292}'+
 '.core-strat-legend{display:flex;flex-wrap:wrap;gap:7px;margin:8px 0 12px;font:600 12px/1.3 "Source Sans 3",sans-serif}'+
 '.core-strat-legend span{padding:5px 8px;border-radius:5px;background:var(--surface);border:1px solid var(--line)}'+
 '.core-strat-legend .your{border-left:4px solid #005078}'+
 '.core-strat-legend .either{border-left:4px solid #00836f}'+
 '.core-strat-legend .opponent{border-left:4px solid #c00000}'+
 '.core-strat-card>summary{flex-wrap:wrap}'+
 '.core-strat-summary-main{flex-basis:55%}';
 document.head.appendChild(st);
})();
function coreStratagemCard(s){
 var tags=s.tags.map(function(t){return '<span>'+esc(t)+'</span>'}).join('');
 var turnLabel=s.turnType==='your'?'Tura ta':s.turnType==='opponent'?'Tura adversarului':'Tura oricărui jucător';
 return '<details class="core-strat-card turn-'+s.turnType+'"><summary><span class="core-strat-summary-main"><strong>'+esc(s.name)+'</strong><small>'+esc(s.ref)+' · CORE STRATAGEM</small><span class="core-strat-turn">'+turnLabel+'</span></span><span class="core-strat-cp">'+s.cp+' CP</span><span class="core-strat-chevron" aria-hidden="true">＋</span></summary><div class="core-strat-details"><div class="core-strat-field"><b>WHEN</b><p>'+esc(s.when)+'</p></div><div class="core-strat-field"><b>TARGET</b><p>'+esc(s.target)+'</p></div><div class="core-strat-field"><b>EFFECT</b><p>'+esc(s.effect)+'</p></div>'+(s.restriction?'<div class="core-strat-restriction"><b>RESTRICTION</b><p>'+esc(s.restriction)+'</p></div>':'')+'<div class="core-strat-tags">'+tags+'</div></div></details>';
}
function renderCoreStratagems(container,query,source){
 var q=(query||'').toLocaleLowerCase('ro');
 var list=(source||CORE_STRATAGEMS).filter(function(s){return [s.name,s.when,s.target,s.effect,s.restriction||'',s.tags.join(' ')].join(' ').toLocaleLowerCase('ro').indexOf(q)>=0});
 container.innerHTML=list.map(coreStratagemCard).join('')||'<p class="empty">Nu am găsit stratageme.</p>';
 return list.length;
}
