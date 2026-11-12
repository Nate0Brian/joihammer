var mid=new URLSearchParams(location.search).get("id"),M=null,openS={},CPMATCH=null,cpModalTab="core";
var CP_ARM_DB=window.CP_ARMAMENTARIUM||null;
function cpArmRows(){return CP_ARM_DB&&CP_ARM_DB.patrols?Object.keys(CP_ARM_DB.patrols).map(function(k){return CP_ARM_DB.patrols[k]}):[]}
function cpArmSelection(r){return {id:r.id,selectionId:r.category+":"+r.id,name:r.displayName||r.name,group:r.group,sourceFaction:r.faction,armamentarium:true,category:r.category,sourceEdition:r.edition,editionLabel:r.category==="11-current"?"11th Edition":"10th Edition",fallback:r.category!=="11-current",record:r}}
function cpPatrolList(ed){
 if(CP_ARM_DB){var rows=cpArmRows(),list=[];
  if(ed==="10")return rows.filter(function(r){return r.category==="10-original"||r.category==="10-new"}).map(cpArmSelection);
  if(ed==="11"){
   var current=rows.filter(function(r){return r.category==="11-current"}),factions={};current.forEach(function(r){factions[r.faction]=true});
   list=current.map(cpArmSelection);
   var fallback={};rows.filter(function(r){return r.category==="10-new"}).forEach(function(r){fallback[r.faction]=r});
   rows.filter(function(r){return r.category==="10-original"}).forEach(function(r){if(!fallback[r.faction])fallback[r.faction]=r});
   Object.keys(fallback).forEach(function(f){if(!factions[f])list.push(cpArmSelection(fallback[f]))});
   return list;
  }
 }
 if(!CPMATCH)return[];
 if(ed==="11")return (CPMATCH.factions||[]).filter(function(f){return !!f.url11}).map(function(f){return{id:f.id,name:f.patrol11Name,group:f.group,url:f.url11,sourceFaction:f.name}}).concat(CPMATCH.patrols11_extra||[]);
 return (CPMATCH.factions||[]).filter(function(f){return f.edition10Available!==false}).map(function(f){return{id:f.id,name:f.name,group:f.group,url:f.pdf10,sourceFaction:f.name}})
}
function cpEditionFor(s){var ps=PS(s);return ps.cpEdition||""}
function cpEditionsMatch(){return true}
function cpPatrolFor(s){var ps=PS(s),ed=cpEditionFor(s);if(!ed)return null;var arr=cpPatrolList(ed),found=arr.filter(function(x){return x.selectionId===ps.cpPatrolId||x.id===ps.cpPatrolId})[0];if(found)return found;/* Compatibility with matches saved before the Armamentarium IDs were added. */if(CPMATCH&&ps.cpPatrolId){var faction=(CPMATCH.factions||[]).filter(function(f){return f.id===ps.cpPatrolId})[0];if(faction&&CP_ARM_DB){var rows=cpArmRows().filter(function(r){return r.faction===faction.name&&(ed==='10'?r.category==='10-original':r.category==='11-current')});if(rows.length){var preferred=ed==='11'?(faction.patrol11Name||''):faction.name;var hit=rows.filter(function(r){return (r.displayName||r.name).toLowerCase().indexOf(preferred.toLowerCase())>=0})[0]||rows[0];return cpArmSelection(hit)}}}return null}
function cpOwnSide(){if(!M)return null;if(App.me===M.a)return"a";if(App.me===M.b)return"b";return null}
function cpSource(s){var p=cpPatrolFor(s);return p&&p.url?p.url:""}
function matchScore(ps){return M&&M.type==="combat-patrol"?(ps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(ps)}
function cpModalOpen(id){var x=$(id);if(x){x.hidden=false;document.body.classList.add("modal-open")}}
function cpModalClose(id){var x=$(id);if(x)x.hidden=true;document.body.classList.remove("modal-open")}
function cpSetTab(tab){cpModalTab=tab;var core=$("cpCoreStratPanel"),patrol=$("cpPatrolStratPanel");if(core)core.hidden=tab!=="core";if(patrol)patrol.hidden=tab!=="patrol";document.querySelectorAll("[data-cp-tab]").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-cp-tab")===tab)})}
function cpRecordFor(side){
 if(!M)return null;
 var patrol=cpPatrolFor(side),ps=PS(side),rec=null;
 if(patrol&&patrol.record)rec=Object.assign({},patrol.record);
 if(!rec&&window.CP_CONTENT&&CP_CONTENT.patrols){
  rec=CP_CONTENT.patrols[(ps.cpEdition||'')+":"+ps.cpPatrolId]||null;
 }
 if(!rec&&patrol)rec={edition:patrol.sourceEdition||Number(ps.cpEdition),id:patrol.id,name:patrol.name,sourceFaction:patrol.sourceFaction||patrol.group,rules:patrol.record&&patrol.record.rules||[],units:patrol.record&&patrol.record.units||[]};
 if(!rec)return null;
 if(!rec.mission&&window.CP_CONTENT&&CP_CONTENT.patrols){
  var candidates=Object.keys(CP_CONTENT.patrols).map(function(k){return CP_CONTENT.patrols[k]});
  var mr=candidates.filter(function(x){return x.sourceFaction=== (patrol&&patrol.sourceFaction) && x.mission && x.edition===Number(ps.cpEdition)})[0];
  if(mr)rec.mission=mr.mission;
 }
 if(!rec.mission){
  rec.mission={name:"Contested Ground — misiune comunitară",summary:"Misiune fan-made de rezervă pentru patrulele fără misiune documentată. Nu este o misiune oficială Games Workshop.",scoring:[
   "La sfârșitul fiecărei Command phase, din Battle Round 2: primești 5 VP dacă controlezi cel puțin un obiectiv.",
   "La sfârșitul fiecărei Command phase, din Battle Round 2: primești încă 5 VP dacă controlezi mai multe obiective decât adversarul."
  ],fanMade:true};
 }
 var secondaries=(rec.rules||[]).filter(function(x){return x.type==="Secondary Objective"});
 if(!secondaries.length){
  rec.rules=(rec.rules||[]).concat([
   {name:"Secure the Field",type:"Secondary Objective",characteristics:{Description:"Fan-made: la sfârșitul turei tale, primești 2 VP dacă controlezi un obiectiv din zona neutră. Maximum 10 VP pe bătălie."}},
   {name:"Break Their Lines",type:"Secondary Objective",characteristics:{Description:"Fan-made: la sfârșitul turei tale, primești 2 VP dacă o unitate a armatei tale se află în zona de desfășurare adversă. Maximum 10 VP pe bătălie."}}
  ]);
 }
 return rec;
}
function cpArmProfiles(rec,type){return (rec&&rec.rules||[]).filter(function(x){return x.type===type})}
function cpSelectedEnhancement(side,rec){var ps=PS(side),items=cpArmProfiles(rec,"Enhancement");return items.filter(function(x){return x.name===ps.cpEnhancementId})[0]||null}
function cpEnhancementOptions(rec){
 var direct=cpArmProfiles(rec,"Enhancement");if(direct.length)return direct.map(function(x){var c=x.characteristics||{};return{name:x.name,characteristics:{Restriction:c.Restriction||"",Effect:c.Effect||""}}});
 var out=[];(rec&&rec.units||[]).forEach(function(u){(u.profiles||[]).forEach(function(p){if(p.type!=="Abilities"||p.name.indexOf("Enhancement:")!==0)return;var raw=String((p.characteristics||{}).Description||""),base=raw,marker="(Default enhancement; may be replaced with ",at=raw.indexOf(marker),defaultName=p.name.replace(/^Enhancement:\s*/,"").replace(/\s*\(Warlord\)\s*$/,"");if(at>=0)base=raw.slice(0,at).trim();var restriction=u.name+" (Warlord)";out.push({name:defaultName,characteristics:{Restriction:restriction,Effect:base}});if(at>=0){var tail=raw.slice(at+marker.length).replace(/\)\s*$/,"").trim(),colon=tail.indexOf(":");if(colon>0){out.push({name:tail.slice(0,colon).trim(),characteristics:{Restriction:restriction,Effect:tail.slice(colon+1).trim()}})}}})});return out;
}
function cpNativeStratHtml(items){return (items||[]).map(function(x){return '<details class="core-strat-card"><summary><span class="core-strat-summary-main"><strong>'+esc(x.name)+'</strong><small>'+esc(x.phase||'Combat Patrol')+'</small></span><span class="core-strat-cp">'+x.cp+' CP</span><span class="core-strat-chevron">＋</span></summary><div class="core-strat-details"><div class="core-strat-field"><b>WHEN</b><p>'+esc(x.when)+'</p></div><div class="core-strat-field"><b>TARGET</b><p>'+esc(x.target)+'</p></div><div class="core-strat-field"><b>EFFECT</b><p>'+esc(x.effect)+'</p></div></div></details>'}).join('')||'<p class="empty">Nu există stratageme locale verificate pentru această patrulă.</p>'}
function cpOpenPatrolModal(kind){var side=cpOwnSide();if(!side){alert("Doar participanții la meci pot vedea regulile propriei patrule.");return}var patrol=cpPatrolFor(side),rec=cpRecordFor(side);if(!patrol){alert("Alege mai întâi Combat Patrol-ul tău.");return}var edition=cpEditionFor(side)||"11",label=patrol.name+" · "+edition+"th Edition"+(patrol.fallback?" (fallback din 10th)":"");if(kind==="strat"){$("stratModalTitle").textContent="Stratagems · "+label;$ ("stratModalDesc").textContent="Core Stratagems eligibile + stratagemele exclusiv ale patrulei tale.";$ ("cpPatrolStratLabel").textContent="Combat Patrol propriu: "+label;var core=edition==="11"?CORE_STRATAGEMS.filter(function(x){return ["Explosives","Crushing Impact","Rapid Ingress"].indexOf(x.name)<0}):[];if(edition==="11")renderCoreStratagems($("matchCoreStratagemList"),$("matchStratQ").value,core);else $("matchCoreStratagemList").innerHTML="<p class=\"cp-status\">Biblioteca Core Stratagems 10th Edition nu este încă integrată local. Nu afișăm stratageme din ediția greșită.</p>";$ ("cpPatrolStratPanel").innerHTML='<div id="cpPatrolNativeStrats" class="match-strat-list">'+(rec&&rec.category?cpArmProfiles(rec,'Stratagem').map(function(x){var c=x.characteristics||{};return '<details class="core-strat-card"><summary><span class="core-strat-summary-main"><strong>'+esc(x.name)+'</strong><small>Combat Patrol</small></span><span class="core-strat-cp">'+esc(c.CP||'')+'</span></summary><div class="core-strat-details"><div class="core-strat-field"><b>WHEN</b><p>'+esc(c.When||'')+'</p></div><div class="core-strat-field"><b>TARGET</b><p>'+esc(c.Target||'')+'</p></div><div class="core-strat-field"><b>EFFECT</b><p>'+esc(c.Effect||'')+'</p></div></div></details>'}).join(''):cpNativeStratHtml(rec&&rec.stratagems))+'</div>'; $("cpCoreRulesFrame")&&($("cpCoreRulesFrame").hidden=true);$("cpStratTabs").hidden=false;$("cpCoreStratPanel").hidden=false;cpSetTab("core");cpModalOpen("coreStratagemModal");return}
 var modal=kind==="data"?"patrolDatasheetModal":"patrolMissionModal",title=kind==="data"?"patrolDatasheetTitle":"patrolMissionTitle",desc=kind==="data"?"patrolDatasheetDesc":"patrolMissionDesc",body=kind==="data"?"patrolDatasheetBody":"patrolMissionBody";$(title).textContent=(kind==="data"?"Datasheets & Army Rules · ":"Mission · ")+label;$(desc).textContent=kind==="data"?"Conținutul local al patrulei tale.":"Misiunea și scoring-ul propriu patrulei tale.";$(body).innerHTML=kind==="data"?cpNativeRecordHtml(rec):cpNativeMissionHtml(rec);cpModalOpen(modal)}
function cpProfileTable(profile){
 var labels={M:"Mișcare",T:"Rezistență",Sv:"Salvare",W:"Răni",Ld:"Leadership",OC:"Control obiective",Inv:"Salvare invulnerabilă"};
 var vals={};String(profile||"").split(/[·|,;]/).forEach(function(part){var m=part.trim().match(/^(M|T|Sv|W|Ld|OC|Inv|InSv)\s*[: ]\s*(.+)$/i);if(m){var k=m[1].toLowerCase();vals[k]=m[2].trim()}});
 var order=["M","T","Sv","W","Ld","OC","Inv"],cells=order.filter(function(k){return vals[k.toLowerCase()]||vals[k.toLowerCase()==="inv"?"insv":k.toLowerCase()]});
 if(!cells.length)return '<p class="cp-profile-fallback"><b>Profil:</b> '+esc(profile||"Date de profil indisponibile")+'</p>';
 return '<div class="cp-table-wrap"><table class="cp-data-table cp-profile-table"><thead><tr>'+cells.map(function(k){return'<th>'+k+'</th>'}).join('')+'</tr></thead><tbody><tr>'+cells.map(function(k){return'<td>'+esc(vals[k.toLowerCase()]||vals[k.toLowerCase()==="inv"?"insv":k.toLowerCase()])+'</td>'}).join('')+'</tr></tbody></table><div class="cp-profile-key">'+cells.map(function(k){return'<span><b>'+k+'</b> '+labels[k]+'</span>'}).join('')+'</div></div>';
}
function cpWeaponTable(weapons){
 if(!weapons||!weapons.length)return '<p class="cp-muted">Nu sunt listate arme pentru această unitate.</p>';
 var rows=weapons.map(function(raw){
  var txt=String(raw||"").trim(),parts=txt.split(/[—–:]/),name=parts.shift().trim(),stats=parts.join(" ").trim();
  var kw="";if(stats.indexOf(";")>=0){var z=stats.split(";");stats=z.shift().trim();kw=z.join(";").trim()}
  var vals={range:"—",a:"—",skill:"—",s:"—",ap:"—",d:"—"};
  var m=stats.match(/^(Melee|[\d.]+\s*["”]?)\s*,?\s*(.*)$/i);if(m){vals.range=m[1];stats=m[2]}
  var patterns=[["a",/(?:^|,\s*)(?:A|AD)\s*([0-9dD+]+(?:\s*[-+]\s*[0-9dD]+)?)/i],["skill",/(?:^|,\s*)(BS|WS)\s*([0-9+]+|—)/i],["s",/(?:^|,\s*)S\s*([0-9+]+)/i],["ap",/(?:^|,\s*)AP\s*([0-9+-]+)/i],["d",/(?:^|,\s*)D(?:D)?\s*([0-9dD+]+)/i]];
  patterns.forEach(function(pair){var x=stats.match(pair[1]);if(x)vals[pair[0]]=pair[0]==="skill"?x[1]+" "+x[2]:x[1]});
  var known=stats.match(/\b(Torrent|Rapid Fire\s*\d*|Assault|Heavy|Pistol|Blast|Lethal Hits|Sustained Hits\s*\d*|Anti-[^,;]+)/gi);if(known)kw=[kw].concat(known).filter(Boolean).join(", ");
  return '<tr><th scope="row">'+esc(name)+'</th><td>'+esc(vals.range)+'</td><td>'+esc(vals.a)+'</td><td>'+esc(vals.skill)+'</td><td>'+esc(vals.s)+'</td><td>'+esc(vals.ap)+'</td><td>'+esc(vals.d)+'</td></tr>'+(kw?'<tr class="cp-weapon-keywords"><td colspan="7"><b>Reguli armă:</b> '+esc(kw)+'</td></tr>':'');
 }).join('');
 return '<div class="cp-table-wrap"><table class="cp-data-table cp-weapon-table"><thead><tr><th>Armă</th><th>Rază</th><th>A</th><th>BS/WS</th><th>S</th><th>AP</th><th>D</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function cpAbilityHtml(abilities){
 if(!abilities||!abilities.length)return '<p class="cp-muted">Nu sunt listate abilități suplimentare.</p>';
 return '<div class="cp-abilities">'+abilities.map(function(a){var t=String(a||""),i=t.indexOf(":");return'<div class="cp-ability"><b>'+esc(i>0?t.slice(0,i).trim():"Abilitate")+'</b><p>'+esc(i>0?t.slice(i+1).trim():t)+'</p></div>'}).join('')+'</div>';
}

function cpRuleDescriptionHtml(value){
 var raw=String(value==null?'':value).replace(/\s+/g,' ').trim();
 if(!raw)return '';
 /* Split long official descriptions into readable sentence-sized paragraphs. */
 var parts=raw.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)||[raw];
 var terms=['ASTRA MILITARUM','OFFICER','COMMAND phase','BATTLE-SHOCKED','TRANSPORT','Battle-shocked','Battle Round','Move characteristic','Weapon Skill characteristic','Ballistic Skill characteristic','Attacks characteristic','Rapid Fire','within 6"'];
 function emphasize(text){
  var out=esc(text);
  terms.forEach(function(term){
   var safe=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   out=out.replace(new RegExp('('+safe+')','gi'),'<strong>$1</strong>');
  });
  return out;
 }
 return '<div class="cp-rule-description">'+parts.map(function(part){
  var sentence=part.trim();
  return sentence?'<p>'+emphasize(sentence)+'</p>':'';
 }).join('')+'</div>';
}

function cpArmamentariumRecordHtml(r){
 if(!r)return '<p class="cp-status">Datele acestei patrule nu sunt disponibile local.</p>';
 var h='',rules=r.rules||[];
 /* Army Rules and detachment rules are grouped and displayed as readable cards.
    Stratagems live in the Stratagems tab; secondary objectives live in mission scoring. */
 var army=rules.filter(function(x){return x.type==='Army Rule'});
 var detach=rules.filter(function(x){return x.type==='Detachment'});
 var enhancements=rules.filter(function(x){return x.type==='Enhancement'});
 function ruleSection(title,items,kind){
  if(!items.length)return;
  h+='<section class="cp-rule-section '+kind+'"><h3 class="cp-rule-section-title">'+title+'</h3>';
  items.forEach(function(x){
   var c=x.characteristics||{};
   h+='<article class="cp-content-card cp-rule-card"><h4>'+esc(x.name)+'</h4>';
   Object.keys(c).forEach(function(k){
    var value=c[k];
    if(value===null||value===undefined||String(value).trim()==='')return;
    h+='<div class="cp-rule-field"><b>'+esc(k)+'</b>'+(String(k).toLowerCase()==='description'?cpRuleDescriptionHtml(value):'<p>'+esc(value)+'</p>')+'</div>';
   });
   h+='</article>';
  });
  h+='</section>';
 }
 ruleSection('REGULA ARMATEI',army,'cp-army-rule-group');
 ruleSection('REGULILE DETACHMENT-ULUI',detach,'cp-detachment-rule-group');
 ruleSection('ENHANCEMENTS',enhancements,'cp-enhancement-rule-group');
 (r.units||[]).forEach(function(u){
  h+='<article class="cp-content-card cp-unit-card"><h3>'+esc(u.name)+' <span>'+esc(u.models==null?'':u.models)+' modele</span></h3>';
  var unit=(u.profiles||[]).filter(function(p){return p.type==='Unit'}),weapons=(u.profiles||[]).filter(function(p){return p.type==='Ranged Weapons'||p.type==='Melee Weapons'}),abilities=(u.profiles||[]).filter(function(p){return p.type==='Abilities'&&p.name.indexOf('Enhancement:')!==0});
  unit.forEach(function(p){var c=p.characteristics||{},keys=['M','T','SV','W','LD','OC'];h+='<p class="cp-note"><b>'+esc(p.name)+'</b></p><div class="cp-table-wrap"><table class="cp-data-table cp-profile-table"><thead><tr>'+keys.map(function(k){return'<th>'+k+'</th>'}).join('')+'</tr></thead><tbody><tr>'+keys.map(function(k){return'<td>'+esc(c[k]||'—')+'</td>'}).join('')+'</tr></tbody></table><div class="cp-profile-key"><span><b>M</b> Mișcare</span><span><b>T</b> Toughness / Rezistență</span><span><b>SV</b> Salvare</span><span><b>W</b> Răni</span><span><b>LD</b> Leadership</span><span><b>OC</b> Control obiective</span></div></div>'});
  if(weapons.length){h+='<h4>Arme</h4><div class="cp-table-wrap"><table class="cp-data-table cp-weapon-table"><thead><tr><th>Armă</th><th>Rază</th><th>A</th><th>BS/WS</th><th>S</th><th>AP</th><th>D</th><th>Reguli</th></tr></thead><tbody>'+weapons.map(function(p){var c=p.characteristics||{};return'<tr><th>'+esc(p.name)+'</th><td>'+esc(c.Range||'—')+'</td><td>'+esc(c.A||'—')+'</td><td>'+esc(c.BS||c.WS||'—')+'</td><td>'+esc(c.S||'—')+'</td><td>'+esc(c.AP||'—')+'</td><td>'+esc(c.D||'—')+'</td><td>'+esc(c.Keywords||'—')+'</td></tr>'}).join('')+'</tbody></table></div>'}
  if(abilities.length){h+='<h4>Abilități</h4>'+abilities.map(function(p){var c=p.characteristics||{};return'<div class="cp-ability"><b>'+esc(p.name)+'</b><p>'+esc(c.Description||'')+'</p></div>'}).join('')}
  if(u.keywords&&u.keywords.length)h+='<p class="cp-keywords"><b>Keywords:</b> '+esc(u.keywords.join(', '))+'</p>';
  if(u.wargear&&u.wargear.length)h+='<details><summary>Echipament fix</summary>'+u.wargear.map(function(w){return'<p>'+esc(w.name)+'</p>'}).join('')+'</details>';
  h+='</article>';
 });
 return h||'<p class="empty">Nu există reguli de armată sau datasheets în înregistrarea locală.</p>';
}
function cpNativeRecordHtml(r){if(r&&r.units&&r.category)return cpArmamentariumRecordHtml(r);
 if(!r)return '<p class="cp-status">Nu avem încă date locale verificate pentru patrula selectată. Nu afișăm linkuri externe și nu inventăm conținut.</p>';
 var h='';
 (r.armyRules||[]).forEach(function(x){h+='<article class="cp-content-card"><h3>Regula armatei · '+esc(x.name)+'</h3><p>'+esc(x.text)+'</p></article>'});
 (r.detachmentRules||[]).forEach(function(x){h+='<article class="cp-content-card"><h3>Regula patrulei · '+esc(x.name)+'</h3><p>'+esc(x.text)+'</p></article>'});
 (r.enhancements||[]).forEach(function(x){h+='<article class="cp-content-card"><h3>Îmbunătățire · '+esc(x.name)+'</h3><small>Unitate: '+esc(x.unit)+'</small><p>'+esc(x.text)+'</p></article>'});
 if(r.roster&&r.roster.length){h+='<article class="cp-content-card"><h3>Componența patrulei</h3><ul class="cp-roster">'+r.roster.map(function(x){return'<li><span>'+esc(x[0])+'</span><b>'+esc(x[1])+' modele</b></li>'}).join('')+'</ul></article>'}
 if(r.status&&r.status.indexOf('datasheets-incomplete')>=0)h+='<p class="cp-status">Fișe de unitate în curs de completare: profilurile și armele nu sunt încă verificate integral pentru această patrulă.</p>';
 (r.units||[]).forEach(function(x){h+='<article class="cp-content-card cp-unit-card"><h3>'+esc(x.name)+' <span>'+esc(x.models)+' modele</span></h3><h4>Profilul unității</h4>'+cpProfileTable(x.profile)+'<h4>Arme</h4>'+cpWeaponTable(x.weapons)+'<h4>Abilități</h4>'+cpAbilityHtml(x.abilities)+(x.keywords&&x.keywords.length?'<p class="cp-keywords"><b>Etichete:</b> '+esc(x.keywords.join(", "))+'</p>':'')+(x.factionKeywords&&x.factionKeywords.length?'<p class="cp-keywords"><b>Etichete de facțiune:</b> '+esc(x.factionKeywords.join(", "))+'</p>':'')+'</article>'});
 return h||'<p class="empty">Nu există fișe locale pentru această patrulă.</p>';
}
function cpNativeMissionHtml(r){
 if(!r||!r.mission)return '<p class="cp-status">Misiunea acestei patrule nu este încă disponibilă în biblioteca locală.</p>';
 var m=r.mission,h='<article class="cp-content-card cp-mission-card"><h3>'+esc(m.name)+'</h3><p>'+esc(m.summary||"Descrierea misiunii nu este disponibilă.")+'</p>';
 if(m.scoring&&m.scoring.length){h+='<h4>Condiții de punctare</h4><ol class="cp-mission-scoring">'+m.scoring.map(function(x){return'<li>'+esc(x)+'</li>'}).join('')+'</ol>'}else h+='<p class="cp-status">Condițiile de punctare nu sunt încă verificate.</p>';
 if(m.actions&&m.actions.length){h+='<h4>Acțiuni</h4>'+m.actions.map(function(x){return'<section class="cp-mission-action"><h4>'+esc(x.name)+'</h4><dl><dt>Momentul începerii</dt><dd>'+esc(x.starts||"Nespecificat")+'</dd><dt>Unitate eligibilă</dt><dd>'+esc(x.unit||"Nespecificată")+'</dd><dt>Limită</dt><dd>'+esc(x.limit||"Nespecificată")+'</dd><dt>Momentul finalizării</dt><dd>'+esc(x.completes||"Nespecificat")+'</dd><dt>Efect</dt><dd>'+esc(x.effect||"Nespecificat")+'</dd></dl></section>'}).join('')}
 h+='</article>';return h;
}
function cpSideSetupHtml(s){var ps=PS(s),mine=own(s),live=M.status==="active",ed=cpEditionFor(s),arr=ed?cpPatrolList(ed):[],selected=cpPatrolFor(s),other=PS(s==="a"?"b":"a"),h='<section class="side setup"><h2>'+esc(P(s).name)+(App.me===M[s]?' <small>(tu)</small>':'')+(ps.ready?' <small class="ok">✓ confirmat</small>':'')+'</h2><div class="info">Combat Patrol · '+(ed?ed+'th Edition':'ediție nealeasă')+'</div>';
 if(mine&&live&&!ps.ready){h+='<label class="opt">Alege ediția ta<select data-act="cpEdition" data-s="'+s+'"><option value="">Selectează ediția…</option><option value="11"'+(ed==="11"?' selected':'')+'>11th Edition</option><option value="10"'+(ed==="10"?' selected':'')+'>10th Edition</option></select></label>';if(ed){var originals=arr.filter(function(p){return p.category==='10-original'}),newer=arr.filter(function(p){return p.category==='10-new'}),current=arr.filter(function(p){return p.category==='11-current'}),opts='';function option(p){return'<option value="'+esc(p.selectionId||p.id)+'"'+((p.selectionId===ps.cpPatrolId||p.id===ps.cpPatrolId)?' selected':'')+'>'+esc(p.name)+' · '+esc(p.sourceFaction||p.group)+(p.fallback?' · fallback 10th':'')+'</option>'}if(ed==='10'){opts+='<optgroup label="10TH EDITION — COMBAT PATROL-URI ORIGINALE">'+originals.map(option).join('')+'</optgroup><optgroup label="10TH EDITION — COMBAT PATROL-URI NOI (LANSĂRI ULTERIOARE)">'+newer.map(option).join('')+'</optgroup>'}else{opts+='<optgroup label="11TH EDITION — COMBAT PATROL-URI ACTUALE">'+current.map(option).join('')+'</optgroup><optgroup label="ALTERNATIVE DIN 10TH EDITION (FALLBACK)">'+arr.filter(function(p){return p.fallback}).map(option).join('')+'</optgroup>'}var guide="<div class=\"cp-patrol-section-guide\">";if(ed==="10"){guide+="<div class=\"cp-patrol-section cp-original\"><b>10TH EDITION</b><span>Combat Patrol-uri originale</span><em>"+originals.length+" patrule</em></div><div class=\"cp-patrol-section cp-new\"><b>10TH EDITION</b><span>Combat Patrol-uri lansate ulterior</span><em>"+newer.length+" patrule</em></div>"}else{guide+="<div class=\"cp-patrol-section cp-current\"><b>11TH EDITION</b><span>Combat Patrol-uri actuale</span><em>"+current.length+" patrule</em></div><div class=\"cp-patrol-section cp-fallback\"><b>ALTERNATIVE</b><span>Patrule din 10th Edition (fallback)</span><em>"+arr.filter(function(p){return p.fallback}).length+" patrule</em></div>"}guide+="</div>";var selectedLabel=selected?(selected.name+' · '+(selected.sourceFaction||selected.group)):'Selectează Combat Patrol-ul…';function patrolChoices(list,cls,title){if(!list.length)return'';return'<div class="cp-patrol-choice-group '+cls+'"><div class="cp-patrol-choice-heading">'+title+'</div>'+list.map(function(p){var val=p.selectionId||p.id,checked=(val===ps.cpPatrolId)?' checked':'';return'<label class="cp-patrol-choice"><input type="radio" name="cpPatrolChoice'+s+'" data-act="cpPatrol" data-s="'+s+'" value="'+esc(val)+'"'+checked+'><span>'+esc(p.name)+' <small>· '+esc(p.sourceFaction||p.group)+'</small></span></label>'}).join('')+'</div>'}var choiceGroups=ed==='10'?patrolChoices(originals,'cp-original','10TH EDITION · ORIGINALE')+patrolChoices(newer,'cp-new','10TH EDITION · LANSATE ULTERIOR'):patrolChoices(current,'cp-current','11TH EDITION · CURENTE')+patrolChoices(arr.filter(function(p){return p.fallback}),'cp-fallback','ALTERNATIVE · 10TH EDITION');h+='<div class="opt cp-patrol-picker"><span class="cp-patrol-label">Alege Combat Patrol-ul tău</span><details class="cp-patrol-dropdown"><summary>'+esc(selectedLabel)+'</summary><div class="cp-patrol-options">'+choiceGroups+'</div></details></div>'}
 if(selected){h+='<div class="cp-mission-summary"><b>'+esc(selected.name)+'</b><p class="legend">'+esc(selected.sourceFaction||selected.group)+' · '+esc(selected.category==='11-current'?'Datasheets native 11th Edition':selected.category==='10-new'?'Fallback: Combat Patrol nou din 10th Edition':selected.category==='10-original'?'Combat Patrol original din 10th Edition':'')+'</p></div>';var selectedRec=cpRecordFor(s),enh=cpEnhancementOptions(selectedRec);if(enh.length){h+='<label class="opt">Alege un Enhancement (maximum unul)<select data-act="cpEnhancement" data-s="'+s+'"><option value="">Fără Enhancement</option>'+enh.map(function(x){return'<option value="'+esc(x.name)+'"'+(ps.cpEnhancementId===x.name?' selected':'')+'>'+esc(x.name)+' · '+esc((x.characteristics||{}).Restriction||'Fără restricție listată')+'</option>'}).join('')+'</select></label>';var chosen=cpSelectedEnhancement(s,selectedRec);if(chosen)h+='<p class="legend"><b>'+esc(chosen.name)+':</b> '+esc((chosen.characteristics||{}).Effect||'')+'</p>'}}
 h+='<div class="vpb">'+B("ready",s,"Confirmă Combat Patrol-ul",'',!selected)+'</div><div class="legend">Fiecare jucător își alege independent ediția și patrula. Pot fi folosite ediții diferite (10th vs 11th).'+'</div>';
 }else{h+='<div class="info">Combat Patrol ales: <b>'+esc(selected?selected.name:"Încă nu a ales")+'</b></div>';if(selected&&mine&&live)h+='<div class="vpb">'+B("unready",s,"Schimbă Combat Patrol-ul",'',false,"ghost")+'</div>'}
 return h+'</section>'}


function rd(){return M.turn>=10?5:Math.floor(M.turn/2)+1}
function actS(){if(M.first==null||M.turn>=10)return null;return M.turn%2===0?M.first:(M.first==="a"?"b":"a")}
function own(s){return App.isAdmin||App.me===M[s]}
function P(s){return M[s==="a"?"pa":"pb"]}
function PS(s){return M[s==="a"?"sa":"sb"]}
function upd(o){return App.db.collection("matches").doc(mid).update(o).catch(fail)}
function cpBalance(ps,s,events){var base=(ps.log||[]).reduce(function(a,e){return a+(e.k==="cp"?e.v:0)},0);return base+(events||M.cpAuto||[]).reduce(function(a,e){return a+(e.s===s?e.v:0)},0)}
function cpEvent(events,s,v,k,label,ps,targetRound,targetTurn){var current=cpBalance(ps,s,events),amount=v>0?Math.min(v,Math.max(0,25-current)):v;if(!amount)return;events.push({s:s,v:amount,k:k,l:label,r:targetRound,t:targetTurn,at:Date.now()})}
function awardCommandCP(events,players,roundStart,targetRound,targetTurn){["a","b"].forEach(function(s){cpEvent(events,s,1,"cp_base","CP de bază – Command Phase",players[s],targetRound,targetTurn);if(M&&M.type!=="combat-patrol"&&roundStart&&players[s]&&players[s].warlordExtraCP)cpEvent(events,s,1,"cp_warlord","CP Warlord – Battle Round",players[s],targetRound,targetTurn)})}
function saveTurnEnd(){var ref=App.db.collection("matches").doc(mid);return App.db.runTransaction(function(tx){return tx.get(ref).then(function(doc){if(!doc.exists)throw new Error("Meciul nu există.");var d=doc.data();if(d.status!=="active"||d.first==null||d.turn>=10)throw new Error("Meciul nu mai este într-o tură activă.");var oldTurn=d.turn||0,oldTs=d.ts||0,tt=Object.assign({},d.tt||{}),cur=oldTurn%2===0?d.first:(d.first==="a"?"b":"a");if(oldTs)tt[cur]=(tt[cur]||0)+Math.max(0,Date.now()-oldTs);var events=(d.cpAuto||[]).slice(),players={a:d.pa||{},b:d.pb||{}},next=oldTurn+1;M=Object.assign({},M,d);awardCommandCP(events,players,next%2===0,Math.floor(next/2)+1,next);tx.update(ref,{turn:next,ts:Date.now(),tt:tt,cpAuto:events,turnUndo:{turn:oldTurn,ts:oldTs,tt:d.tt||{},cpAuto:d.cpAuto||[],savedAt:Date.now()}})})}) .catch(fail)}
function undoTurn(){var ref=App.db.collection("matches").doc(mid);return App.db.runTransaction(function(tx){return tx.get(ref).then(function(doc){if(!doc.exists)throw new Error("Meciul nu există.");var d=doc.data(),u=d.turnUndo;if(!u)throw new Error("Nu există o tură de anulat.");tx.update(ref,{turn:u.turn,ts:Date.now(),tt:u.tt||{},cpAuto:u.cpAuto||[],turnUndo:firebase.firestore.FieldValue.delete()})})}).catch(fail)}
function saveS(s){var o={};o[s==="a"?"sa":"sb"]=PS(s);if(M&&M.turnUndo)o.turnUndo=firebase.firestore.FieldValue.delete();upd(o)}
function logAdd(ps,k,v,l,f){ps.log.push({k:k,v:v,l:String(l).slice(0,60),r:rd(),f:!!f,t:M.turn})}
function mut(s,fn){var ps=PS(s);fn(ps);saveS(s);render()}
function deckOf(ps){return SEC.map(function(c){return c.n}).filter(function(n){return ps.hand.indexOf(n)<0&&ps.used.indexOf(n)<0})}
function cardOf(n){return SEC.filter(function(c){return c.n===n})[0]}
function rm(a,n){var i=a.indexOf(n);if(i>=0)a.splice(i,1)}
function baseOf(s){
  var me=P(s),op=P(s==="a"?"b":"a");
  return FDM[me.fd][FDS.indexOf(op.fd)];
}
function primOf(s){return M.twist==="Scrambled Communications"?baseOf(s==="a"?"b":"a"):baseOf(s)}
function B(act,s,label,extra,dis,cls){
  return '<button class="sm'+(cls?' '+cls:'')+'" data-act="'+act+'"'+(s?' data-s="'+s+'"':'')+(extra||'')+(dis?' disabled':'')+'>'+label+'</button>';
}
function tag(L){
  var r=L.min===L.max?"R"+L.min:(L.max===5?"R"+L.min+"+":"R"+L.min+"–"+L.max);
  return (L.w==="F"?"Final bătălie":L.w==="C"?"Command":"Final tură")+(L.w==="F"?"":" · "+r);
}
function fixedSum(ps,n){return ps.log.reduce(function(a,e){return a+(e.k==="sec"&&e.l===n?e.v:0)},0)}
function cardHtml(c){return '<b class="t">'+esc(c.n)+'</b><ul>'+c.r.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>'}

/* înainte de start: tot ce alege un jucător e sus, într-un singur card, cu butonul de salvare */
function setupHtml(s){
  var ps=PS(s),pl=P(s),mine=own(s),live=M.status==="active";
  var fo=Data.fdsFor(pl.army,pl.dets),fdOk=fo.indexOf(pl.fd)>=0;
  var okFix=fdOk&&(ps.mode==="T"||(ps.mode==="F"&&ps.fixed.length===2));
  var pn=primOf(s),pr=PRI[pn];
  var h='<section class="side setup"><h2>'+esc(pl.name)+(App.me===M[s]?' <small>(tu)</small>':'')+(M.atk?' <span class="role">'+(M.atk===s?'Atacator':'Defender')+'</span>':'')+(ps.ready?' <span class="ok">✓ salvat</span>':'')+'</h2><div class="info">'+esc([pl.army,pl.det].filter(Boolean).join(" · ")||"Armata nu e aleasă")+'</div>';
  if(mine&&live&&!ps.ready){
    if(!fo.length)h+='<div class="legend">Alege armata și detașamentul în <a href="profile.html">Profil</a>; se preiau automat aici.</div>';
    else h+='<label class="opt">Force Disposition <select data-act="fd" data-s="'+s+'">'+(fdOk?'':'<option value="">Alege…</option>')+fo.map(function(f){return '<option'+(f===pl.fd?' selected':'')+'>'+f+'</option>'}).join("")+'</select></label>';
    h+='<div class="info">Misiune primară: <b>'+esc(pn)+'</b></div>';
    h+='<details class="mis" data-k="pr'+s+'"'+(openS["pr"+s]?' open':'')+'><summary>Regulile misiunii</summary>'+(pr.a?'<div class="act">'+esc(pr.a)+'</div>':'')+'<ul>'+pr.r.map(function(l){var L=parseLine(l);return '<li><span class="tag">'+tag(L)+'</span> '+esc(L.text)+'</li>'}).join("")+'</ul></details>';
    h+='<label class="opt">Secundare <select data-act="mode" data-s="'+s+'"><option value=""'+(ps.mode?'':' selected')+'>Alege…</option><option value="T"'+(ps.mode==="T"?" selected":"")+'>Tactical (tragi cărți)</option><option value="F"'+(ps.mode==="F"?" selected":"")+'>Fixed (2 cărți fixe)</option></select></label>';
    if(ps.mode==="F")h+='<div class="vpb">'+SEC.filter(function(c){return c.fx}).map(function(c){return '<label class="opt"><input type="checkbox" data-act="fix" data-s="'+s+'" data-n="'+esc(c.n)+'"'+(ps.fixed.indexOf(c.n)>=0?' checked':'')+'> '+esc(c.n)+'</label>'}).join("")+'</div>';
    h+='<div class="vpb">'+B("ready",s,"Salvează alegerea",'',!okFix)+'</div>';
    if(!okFix)h+='<div class="legend">'+(!fdOk?'Alege un Force Disposition permis de detașamentele tale.':!ps.mode?'Alege tipul de secundare.':'Alege exact 2 cărți Fixed.')+'</div>';
  }else{
    h+='<div class="info">Force Disposition: <b>'+(fdOk?esc(pl.fd):'neales')+'</b></div><div class="info">Misiune primară: <b>'+esc(pn)+'</b></div>';
    h+=ps.ready?'<div class="info">Secundare: <b>'+(ps.mode==="T"?"Tactical":"Fixed – "+esc(ps.fixed.join(", ")))+'</b></div>':'<div class="info">Încă nu a salvat alegerile.</div>';
    if(ps.ready&&mine&&live)h+='<div class="vpb">'+B("unready",s,"Schimbă alegerea","",false,"ghost")+'</div>';
  }
  return h+'</section>';
}

function sideHtml(s){
  var ps=PS(s),pl=P(s),started=M.first!=null,ended=M.turn>=10,a=actS(),mine=own(s),live=M.status==="active",r=rd(),cp=cpOf(ps,s),capP={t:sums(ps,"pri")>=45,r:roundVP(ps,"pri",r)>=15},capS={t:sums(ps,"sec")>=45,r:roundVP(ps,"sec",r)>=15};
  var h='<section class="side"><h2>'+esc(pl.name)+(App.me===M[s]?' <small>(tu)</small>':'')+(M.atk?' <span class="role">'+(M.atk===s?'Atacator':'Defender')+'</span>':'')+'</h2><div class="info">'+esc([pl.army,pl.det].filter(Boolean).join(" · "))+'</div>';
  var fo=Data.fdsFor(pl.army,pl.dets),fdOk=fo.indexOf(pl.fd)>=0;
  if(!started&&mine&&live){
    if(!fo.length)h+='<div class="legend">Nu ai ales armata și detașamentul. Alege-le în <a href="profile.html">Profil</a>; se preiau automat aici.</div>';
    else h+='<label class="opt">Force Disposition <select data-act="fd" data-s="'+s+'"'+(ps.ready?' disabled':'')+'>'+(fdOk?'':'<option value="">Alege…</option>')+fo.map(function(f){return '<option'+(f===pl.fd?' selected':'')+'>'+f+'</option>'}).join("")+'</select></label><div class="legend">Poți alege doar dintre Force Disposition-urile detașamentelor tale.</div>';
  }else h+='<div class="info">Force Disposition: <b>'+(fdOk||started?esc(pl.fd):'neales')+'</b></div>';

  if(started)h+='<div class="info">Timp jucat: <b>'+fmtT((M.tt&&M.tt[s])||0)+'</b></div>';
  h+='<div class="board"><div><span>Primar</span><b>'+sums(ps,"pri")+'</b></div><div><span>Secundar</span><b>'+sums(ps,"sec")+'</b></div><div><span>Pictată</span><b>'+(ps.br?10:0)+'</b></div><div class="bt"><span>Total VP</span><b>'+totalPS(ps)+'</b></div></div>';
  h+='<div class="cpbox'+(mine&&live?'':' ro')+'">'+(mine&&live?B("cp",s,"−",' data-v="-1" aria-label="Scade CP"',cp<=0):'')+'<div class="cpnum"><span>CP</span><b>'+cp+'</b></div>'+(mine&&live?B("cp",s,"+",' data-v="1" aria-label="Adaugă CP"',false):'')+'</div>';
  h+='<div class="legend">Pe runde (max 15): primar '+[1,2,3,4,5].map(function(i){return roundVP(ps,"pri",i)}).join(" / ")+' · secundar '+[1,2,3,4,5].map(function(i){return roundVP(ps,"sec",i)}).join(" / ")+'</div>';
  if(capP.t||capP.r||capS.t||capS.r)h+='<div class="legend">'+(capP.t?'Primar: maxim 45 VP atins. ':capP.r?'Primar: 15/15 VP în runda curentă. ':'')+(capS.t?'Secundar: maxim 45 VP atins. ':capS.r?'Secundar: 15/15 VP în runda curentă. ':'')+'Se pot doar scădea puncte.</div>';
  h+='<div class="vpb">'+B("man",s,"−1 VP primar",' data-k="pri" data-v="-1"',!(mine&&live&&started)||roundVP(ps,"pri",r)<=0,"ghost")+B("man",s,"+1 VP primar",' data-k="pri" data-v="1"',!(mine&&live&&started)||capP.t||capP.r,"ghost")+B("man",s,"−1 VP secundar",' data-k="sec" data-v="-1"',!(mine&&live&&started)||roundVP(ps,"sec",r)<=0,"ghost")+B("man",s,"+1 VP secundar",' data-k="sec" data-v="1"',!(mine&&live&&started)||capS.t||capS.r,"ghost")+'</div>';
  h+='<label class="opt" style="margin-top:8px"><input type="checkbox" data-act="br" data-s="'+s+'"'+(ps.br?' checked':'')+(mine&&live?'':' disabled')+'> Armată pictată (+10 VP)</label>';

  /* primară */
  var pn=primOf(s),pr=PRI[pn];
  h+='<h3>Misiune primară: '+esc(pn)+'</h3><div class="mis">'+(pr.a?'<div class="act">'+esc(pr.a)+'</div>':'')+pr.r.map(function(line,i){
    var L=parseLine(line),ok=mine&&live&&started&&((L.w==="F"&&ended)||(L.w!=="F"&&!ended&&a===s&&r>=L.min&&r<=L.max))&&!(capP.t||(L.w!=="F"&&capP.r));
    return '<div class="ln"><span class="tag">'+tag(L)+'</span> '+esc(L.text)+'<div class="vpb">'+L.v.map(function(v){return B("pv",s,'+'+v+' VP',' data-i="'+i+'" data-v="'+v+'"',!ok)}).join("")+'</div></div>';
  }).join("")+'</div>';

  /* secundare */
  h+='<h3>Misiuni secundare'+(ps.mode&&started?' ('+(ps.mode==="T"?"Tactical":"Fixed")+')':'')+'</h3>'+(M.atk&&started?'<div class="legend">Pachetul de secundare al '+(M.atk===s?'Atacatorului':'Defender-ului')+' (cărțile sunt identice în ambele pachete).</div>':'');
  if(!started){
    var okFix=fdOk&&(ps.mode==="T"||(ps.mode==="F"&&ps.fixed.length===2));
    if(mine&&live&&!ps.ready){
      h+='<div class="legend">Alege tipul de secundare înainte de start.</div><select data-act="mode" data-s="'+s+'"><option value=""'+(ps.mode?'':' selected')+'>Alege…</option><option value="T"'+(ps.mode==="T"?" selected":"")+'>Tactical (tragi cărți)</option><option value="F"'+(ps.mode==="F"?" selected":"")+'>Fixed (2 cărți fixe)</option></select>';
      if(ps.mode==="F")h+='<div class="vpb">'+SEC.filter(function(c){return c.fx}).map(function(c){return '<label class="opt"><input type="checkbox" data-act="fix" data-s="'+s+'" data-n="'+esc(c.n)+'"'+(ps.fixed.indexOf(c.n)>=0?' checked':'')+'> '+esc(c.n)+'</label>'}).join("")+'</div><div class="legend">Alege exact 2 cărți Fixed.</div>';
      h+='<div class="vpb">'+B("ready",s,"Confirmă alegerea",'',!okFix)+'</div>'+(fdOk?'':'<div class="legend">Ca să confirmi, ai nevoie de un Force Disposition permis de detașamentele tale.</div>');
    }else{
      h+=ps.ready?'<div class="info">Alegere confirmată: <b>'+(ps.mode==="T"?"Tactical":"Fixed – "+esc(ps.fixed.join(", ")))+'</b></div>':'<div class="info">Încă nu a ales.</div>';
      if(ps.ready&&mine&&live)h+='<div class="vpb">'+B("unready",s,"Schimbă alegerea","",false,"ghost")+'</div>';
    }
  }else if(ps.mode==="F"){
    h+=ps.fixed.map(function(n){
      var c=cardOf(n),used=fixedSum(ps,n);
      return '<div class="mis">'+cardHtml(c)+'<div class="legend">Acumulat: '+used+' / 20 VP (Fixed nu se aruncă)</div><div class="vpb">'+SECV[n].f.map(function(v){return B("sv",s,'+'+v+' VP',' data-n="'+esc(n)+'" data-v="'+v+'"',!(mine&&live&&started&&used+v<=20&&!capS.t&&!capS.r))}).join("")+'</div></div>';
    }).join("")||'<div class="legend">Nicio carte Fixed aleasă.</div>';
  }else{
    var deck=deckOf(ps),canDraw=mine&&live&&started&&!ended&&a===s&&ps.drawT!==M.turn&&deck.length>0;
    var why=!started?"Alege mai întâi cine începe.":ended?"Bătălia s-a încheiat.":a!==s?"Tragi doar la începutul propriei ture.":ps.drawT===M.turn?"Ai tras deja în tura aceasta.":deck.length?"":"Pachetul e gol.";
    h+='<div class="vpb">'+B("draw",s,"Trage 2 cărți (faza Command)","",!canDraw)+'</div><div class="legend">'+why+' Pachet: '+deck.length+' cărți.</div>';
    h+=ps.hand.map(function(n){
      var c=cardOf(n),w=WD[n],myT=mine&&live&&started&&!ended&&a===s;
      var canW=w&&myT&&ps.fresh.indexOf(n)>=0&&ps.drawT===M.turn&&(!w.o||ps.hand.indexOf(w.o)>=0)&&(!w.r1||r===1);
      return '<div class="mis">'+cardHtml(c)+'<div class="vpb">'+SECV[n].t.map(function(v){return B("sv",s,'+'+v+' VP îndeplinită',' data-n="'+esc(n)+'" data-v="'+v+'"',!(mine&&live&&started&&!capS.t&&!capS.r))}).join("")
        +B("toss",s,"Aruncă (+1 CP)",' data-n="'+esc(n)+'"',!myT,"ghost")
        +B("mull",s,"Re-trage (1 CP, o dată)",' data-n="'+esc(n)+'"',!(myT&&ps.drawT===M.turn&&!ps.rd&&cp>=1),"ghost")
        +(w?B("wd",s,"Re-trage („când e trasă”)",' data-n="'+esc(n)+'"',!canW,"ghost"):'')+'</div></div>';
    }).join("")||'<div class="legend">Nicio carte activă.</div>';
  }

  h+='<details data-k="log'+s+'"'+(openS["log"+s]?' open':'')+'><summary>Istoric ('+(ps.log.length+(M.cpAuto||[]).filter(function(e){return e.s===s}).length)+')</summary>'+(ps.log.concat((M.cpAuto||[]).filter(function(e){return e.s===s}).map(function(e){return {k:"cp",v:e.v,l:e.l,r:e.r,auto:true}}))).map(function(e,i){
    return '<div class="lg">R'+e.r+' · '+(e.k==="cp"?"CP":e.k==="pri"?"Primar":"Secundar")+' '+(e.v>0?"+":"")+e.v+' · '+esc(e.l)+(App.isAdmin&&live&&!e.auto?' '+B("rm",s,"×",' data-i="'+i+'"',false,"ghost"):e.auto?' <small>(automat)</small>':'')+'</div>';
  }).reverse().join("")+'</details></section>';
  return h;
}

function cpMissionScoreButtons(record,s,enabled){
 var m=record&&record.mission;if(!m)return '';
 var out='<div class="cp-mission-inline"><h4>Primary Objectives</h4>';
 var lines=Array.isArray(m.scoring)?m.scoring:[];
 if(lines.length){out+='<ul>';lines.forEach(function(line,i){
  var safe=String(line||''),nums=[],rx=/(\d+)\s*VP\b/gi,match;
  while((match=rx.exec(safe))!==null)nums.push(+match[1]);
  out+='<li><span>'+esc(safe)+'</span><div class="cp-mission-awards">'+(nums.length?nums.map(function(n){return enabled?'<button type="button" data-act="cpvp" data-s="'+s+'" data-v="'+n+'" data-n="'+esc(safe.replace(/"/g,'&quot;'))+'">+'+n+' VP</button>':'<span>+'+n+' VP</span>'}).join(''):(enabled?'<button type="button" data-act="cpvp" data-s="'+s+'" data-v="1" data-n="'+esc(safe.replace(/"/g,'&quot;'))+'">+1 VP</button>':''))+'</div></li>';
 });out+='</ul>';}else out+='<p class="legend">Nu există condiții Primary structurate pentru această patrulă. Poți introduce punctajul manual.</p>';
 out+='</div>';
 var secondaries=cpArmProfiles(record,'Secondary Objective');
 if(secondaries.length){out+='<div class="cp-mission-inline cp-secondary"><h4>Secondary Objectives</h4><ul>'+secondaries.map(function(x){var c=x.characteristics||{},desc=c.Description||c.Effect||c.Rule||Object.keys(c).map(function(k){return k+': '+c[k]}).join(' · ');return '<li><b>'+esc(x.name)+'</b><p>'+esc(desc)+'</p>'+(enabled?'<button type="button" data-act="cpvp" data-s="'+s+'" data-v="1" data-n="'+esc(('Secondary: '+x.name).replace(/"/g,'&quot;'))+'">+1 VP</button>':'')+'</li>'}).join('')+'</ul></div>';}
 else out+='<div class="cp-mission-inline cp-secondary"><h4>Secondary Objectives</h4><p class="legend">Nu există Secondary Objectives specifice în catalog pentru această patrulă. Poți înregistra manual punctele dacă regulile folosite la masă permit.</p></div>';
 if(record.status&&(record.status.indexOf('partial')>=0||record.status.indexOf('incomplete')>=0))out+='<p class="cp-status">Unele condiții sau fișe ale acestei patrule sunt încă în curs de verificare.</p>';
 return out;
}
function cpSideGameHtml(s){var ps=PS(s),pl=P(s),mine=own(s),live=M.status==="active",started=M.first!=null,ended=M.turn>=10,patrol=cpPatrolFor(s),cp=cpOf(ps,s),score=(ps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0),h='<section class="side"><h2>'+esc(pl.name)+(App.me===M[s]?' <small>(tu)</small>':'')+'</h2><div class="info">'+esc(patrol?patrol.name:"Combat Patrol neales")+' · '+(cpEditionFor(s)||"?")+'th Edition</div><div class="board"><div class="bt"><span>Mission VP</span><b>'+score+'</b></div><div><span>Battle Round</span><b>'+rd()+'/5</b></div></div><div class="cpbox'+(mine&&live?'':' ro')+'">'+(mine&&live?B("cp",s,"−",' data-v="-1" aria-label="Scade CP"',cp<=0):'')+'<div class="cpnum"><span>CP</span><b>'+cp+'</b></div>'+(mine&&live?B("cp",s,"+",' data-v="1" aria-label="Adaugă CP"',false):'')+'</div>';
 h+='<div class="cp-score-entry"><input type="text" maxlength="90" placeholder="Obiectiv: Primary / Secondary / Mission Rule" data-cp-reason="'+s+'" '+(!mine||!live||!started||ended?'disabled':'')+'><button type="button" data-act="cpvp" data-s="'+s+'" data-v="1" '+(!mine||!live||!started||ended?'disabled':'')+'>+1 VP</button><button type="button" class="ghost" data-act="cpvp" data-s="'+s+'" data-v="-1" '+(!mine||!live||!started||ended||score<=0?'disabled':'')+'>−1 VP</button></div>';
 h+='<div class="legend">Înregistrează separat VP pentru Primary, Secondary și reguli de misiune. Fiecare apăsare este salvată în jurnal cu runda curentă.</div>';
 if(patrol){var rec=cpRecordFor(s),chosen=cpSelectedEnhancement(s,rec);h+='<div class="cp-mission-summary"><b>Misiune · '+esc(rec&&rec.mission?rec.mission.name:patrol.name)+'</b><p class="legend">'+esc(rec&&rec.mission&&rec.mission.summary||"Misiunea patrulei selectate.")+'</p>'+cpMissionScoreButtons(rec,s,mine&&live&&started&&!ended)+'</div>';if(patrol.fallback)h+='<p class="legend">Fallback automat: nu există date native 11th pentru această facțiune; este folosită cea mai nouă patrulă disponibilă din 10th.</p>';if(chosen)h+='<div class="cp-mission-summary"><b>Enhancement ales · '+esc(chosen.name)+'</b><p>'+esc((chosen.characteristics||{}).Restriction||'')+'</p><p>'+esc((chosen.characteristics||{}).Effect||'')+'</p></div>';}
 h+='<details><summary>Istoric ('+(ps.log.length+(M.cpAuto||[]).filter(function(e){return e.s===s}).length)+')</summary>'+(ps.log.concat((M.cpAuto||[]).filter(function(e){return e.s===s}).map(function(e){return{k:"cp",v:e.v,l:e.l,r:e.r}}))).map(function(e){return'<div class="lg">R'+e.r+' · '+(e.k==="cp"?"CP":e.k==="cpvp"?"Mission VP":"")+' '+(e.v>0?"+":"")+e.v+' · '+esc(e.l)+'</div>'}).reverse().join("")+'</details></section>';return h}

function fmtT(ms){
  var s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+":"+(m<10?"0":""):"")+m+":"+(x<10?"0":"")+x;
}
function cumul(ps){
  var out=[],t=0;
  for(var r=1;r<=5;r++){t+=Math.min(15,Math.max(0,roundVP(ps,"pri",r)))+Math.min(15,Math.max(0,roundVP(ps,"sec",r)));out.push(t)}
  out.push(totalPS(ps));
  return out;
}
function chart(ca,cb){
  var W=320,H=150,px=30,py=14,mx=Math.max(10,Math.max.apply(null,ca.concat(cb))),L=["R1","R2","R3","R4","R5","Final"];
  function X(i){return px+i*(W-px-12)/5}
  function Y(v){return H-22-(v/mx)*(H-22-py)}
  function line(c,col){return '<polyline fill="none" stroke-width="3" style="stroke:'+col+'" points="'+c.map(function(v,i){return X(i)+","+Y(v)}).join(" ")+'"/>'+c.map(function(v,i){return '<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3.5" style="fill:'+col+'"/>'}).join("")}
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="VP cumulat pe runde"><line x1="'+px+'" y1="'+Y(0)+'" x2="'+(W-12)+'" y2="'+Y(0)+'" style="stroke:var(--line)"/>'
    +L.map(function(l,i){return '<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" style="fill:var(--muted)">'+l+'</text>'}).join("")
    +'<text x="2" y="'+(py+4)+'" font-size="11" style="fill:var(--muted)">'+mx+'</text>'+line(ca,"var(--brass)")+line(cb,"var(--blood)")+'</svg>';
}
function summaryHtml(){
  var m=M,na=esc(m.pa.name),nb=esc(m.pb.name);
  if(m.type==="combat-patrol"){
    function csum(ps){return (ps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0)}
    return '<section class="summ"><h2>Combat Patrol · Rezumat</h2><div class="tblw"><table class="tbl"><tr><th>Jucător</th><th>Combat Patrol</th><th>Mission VP</th><th>CP</th></tr><tr><td>'+na+'</td><td>'+esc(cpPatrolFor("a")?cpPatrolFor("a").name:"—")+'</td><td>'+csum(m.sa)+'</td><td>'+cpOf(m.sa,"a")+'</td></tr><tr><td>'+nb+'</td><td>'+esc(cpPatrolFor("b")?cpPatrolFor("b").name:"—")+'</td><td>'+csum(m.sb)+'</td><td>'+cpOf(m.sb,"b")+'</td></tr></table></div></section>';
  }
  var h='<section class="summ"><h2>Rezumat</h2>'+chart(cumul(m.sa),cumul(m.sb))+'<div class="legend"><span style="color:var(--brass)">■</span> '+na+' · <span style="color:var(--blood)">■</span> '+nb+' · VP cumulat pe runde</div>';
  h+='<div class="tblw"><table class="tbl"><tr><th></th><th>Jucător</th>'+[1,2,3,4,5].map(function(i){return '<th>R'+i+'</th>'}).join("")+'<th>F</th><th>+10</th><th>Total</th></tr>';
  ["a","b"].forEach(function(s){
    var ps=m["s"+s],fin=ps.log.reduce(function(a,e){return a+(e.f?e.v:0)},0);
    h+='<tr><td>'+(m.atk?(m.atk===s?"A":"D"):"")+'</td><td>'+esc(m["p"+s].name)+'</td>'+[1,2,3,4,5].map(function(i){return '<td>'+(Math.min(15,Math.max(0,roundVP(ps,"pri",i)))+Math.min(15,Math.max(0,roundVP(ps,"sec",i))))+'</td>'}).join("")+'<td>'+fin+'</td><td>'+(ps.br?10:0)+'</td><td><b>'+totalPS(ps)+'</b></td></tr>';
  });
  h+='</table></div>';
  ["a","b"].forEach(function(s){
    var ps=m["s"+s],gain=0,spent=0;
    ps.log.forEach(function(e){if(e.k==="cp"){if(e.v>0)gain+=e.v;else spent-=e.v}});(m.cpAuto||[]).forEach(function(e){if(e.s===s){if(e.v>0)gain+=e.v;else spent-=e.v}});
    var top=ps.log.filter(function(e){return e.k!=="cp"&&e.v>0}).sort(function(x,y){return y.v-x.v}).slice(0,3);
    h+='<div class="info"><b>'+esc(m["p"+s].name)+'</b> · Primar '+sums(ps,"pri")+' · Secundar '+sums(ps,"sec")+' · CP câștigat '+gain+', folosit '+spent+(m.tt&&m.tt[s]?' · timp jucat '+fmtT(m.tt[s]):'')
      +(top.length?'<div class="wev">Cele mai mari punctaje: '+top.map(function(e){return '+'+e.v+' '+(e.k==="pri"?"Primar":"Secundar")+' (R'+e.r+')'}).join(", ")+'</div>':'')+'</div>';
  });
  if(m.atk)h+='<div class="info">Atacator: <b>'+esc(m["p"+m.atk].name)+'</b> · Defender: <b>'+esc(m["p"+(m.atk==="a"?"b":"a")].name)+'</b></div>';
  return h+'</section>';
}

function render(){
  var m=M,started=m.first!=null,ended=m.turn>=10,a=actS(),live=m.status==="active";
  ["sa","sb"].forEach(function(k){m[k]=Object.assign(newPS(),m[k])});
  var rdy=!!(m.sa.ready&&m.sb.ready),roleOk=!!m.atk,na=esc(m.pa.name),nb=esc(m.pb.name);
  var h='<h1>'+na+' <span class="vs">vs</span> '+nb+'</h1>';
  h+='<div class="depbar"><div class="info">'+(m.type==="tournament"?"Meci de turneu":m.type==="combat-patrol"?"Combat Patrol · ediție aleasă individual":"Meci amical")+(m.deploy?' · Deployment: <b>'+esc(m.deploy)+'</b>'+(DEPNOTE[m.deploy]?'<br><small>'+esc(DEPNOTE[m.deploy])+'</small>':''):'')+(m.twist?' · Twist: <b>'+esc(m.twist)+'</b> – '+esc(TWISTS[m.twist]):'')+'</div>'+(m.deploy?Data.depImg(m.deploy):'')+'</div>';
  if(m.status==="invited"){
    h+='<div class="banner">'+(m.type==="combat-patrol"?"Invitație Combat Patrol în așteptare.":"Invitație în așteptare.")+(App.me===m.b?'<div class="vpb" style="justify-content:center">'+B("acc","","Acceptă","")+B("dec","","Refuză","",false,"ghost")+'</div>':' Așteaptă răspunsul lui '+esc(m.b)+'.'+(App.me===m.a?'<div class="vpb" style="justify-content:center">'+B("dec","","Anulează invitația","",false,"ghost")+'</div>':''))+'</div>';
    $("box").innerHTML=h;return;
  }
  if(m.status==="declined"||m.status==="cancelled"){$("box").innerHTML=h+'<div class="banner">'+(m.status==="cancelled"?"Meciul a fost anulat.":"Invitația a fost refuzată sau anulată.")+'</div>';return}

  var head=h;
  h='<div class="banner">'+(started||m.status!=="active"?'<div class="bigsc">'+matchScore(m.sa)+' – '+matchScore(m.sb)+'</div>':'');
  if(m.status==="done"){
    h+=(m.winner==="draw"?'Remiză':'Câștigător: <b>'+esc(m.winner==="a"?m.pa.name:m.pb.name)+'</b>'+(m.wo?' (neprezentare)':'')+(m.early?' (încheiat anticipat)':''))+(App.isAdmin?'<div class="vpb" style="justify-content:center">'+B("reopen","","Redeschide meciul","",false,"ghost")+'</div>':'');
  }else if(m.status==="confirm"){
    var pn=esc(m["p"+m.pBy].name),res=m.pw==="draw"?'remiză':'câștigă <b>'+esc(m["p"+m.pw].name)+'</b>',other=m.pBy==="a"?"b":"a";
    h+='<div>'+pn+' propune '+(m.early?'încheierea anticipată cu scorul':'scorul final')+' <b>'+m.pta+' – '+m.ptb+'</b>, '+res+'.</div>';
    if(App.isAdmin||App.me===m[other])h+='<div class="vpb" style="justify-content:center">'+B("confirm","","Confirmă scorul")+B("contest","","Contestă","",false,"ghost")+'</div>';
    else h+='<div class="legend">Se așteaptă confirmarea adversarului.</div><div class="vpb" style="justify-content:center">'+B("withdraw","","Retrage propunerea","",false,"ghost")+'</div>';
  }else if(!started){
    var oth=m.atk==="a"?"b":"a";
    h+='<div class="steps"><div><b>1. Rolul</b> (câștigătorul zarului alege)<div class="vpb">'
      +(m.atk?'Atacator: <b>'+esc(m["p"+m.atk].name)+'</b> · Defender: <b>'+esc(m["p"+oth].name)+'</b> '+B("atk","","Inversează",' data-v="'+oth+'"',false,"ghost"):B("atk","",na+" atacator",' data-v="a"')+B("atk","",nb+" atacator",' data-v="b"'))
      +'</div>'+(m.atk?'<div class="legend">Defender-ul își așază primul unitățile, iar Atacatorul începe redeployment-ul.</div>':'')+'</div>'
      +'<div><b>2. Alegerile</b> (salvate de fiecare jucător în cardul lui): '+na+(m.sa.ready?' ✓':' …')+' · '+nb+(m.sb.ready?' ✓':' …')+'</div>'
      +'<div><b>3. Cine joacă prima tură</b> (zar, câștigătorul decide)<div class="vpb">'+B("first","",na,' data-v="a"',!(rdy&&roleOk))+B("first","",nb,' data-v="b"',!(rdy&&roleOk))+B("first","","Zar random",' data-v="rand"',!(rdy&&roleOk),"ghost")+'</div></div></div>';
  }else if(!ended){
    var an=m[a];
    h+='Runda <b>'+rd()+'</b> din 5 · Tura lui <b>'+esc(P(a).name)+'</b> · <span class="timer" id="tmr" data-ts="'+(m.ts||0)+'"></span><div class="vpb" style="justify-content:center">'+B("end","","Termină tura",'',!(App.isAdmin||App.me===an))+B("back","","Undo End Turn","",!m.turnUndo,"ghost")+'</div>';
  }else{
    h+=(m.type==="combat-patrol"?"Bătălia Combat Patrol s-a încheiat. Propune scorul final.":"Bătălia s-a încheiat. Adaugă punctele „Final bătălie” (F), apoi propune scorul final.")+'<div class="vpb" style="justify-content:center">'+((App.me===m.a||App.me===m.b)?B("propose","","Propune scorul final",""):'')+(App.isAdmin?B("finish","","Încheie direct (admin)","",false,"ghost"):'')+B("back","","Undo End Turn","",!m.turnUndo,"ghost")+'</div>';
  }
  var fr=(m.type==="friendly"||m.type==="combat-patrol")&&m.status==="active"&&(App.isAdmin||App.me===m.a||App.me===m.b);
  if(fr){var cpGame=m.type==="combat-patrol";h+='<div class="vpb" style="justify-content:center">'+B("early","",cpGame?"Oprește jocul cu scorul curent":"Încheie cu scorul de acum",'',!started,"ghost")+B("cancel","",cpGame?"Anulează jocul complet":"Anulează meciul",'',false,"ghost")+'</div><div class="legend">'+(cpGame?'Poți opri partida după ce a început: scorul curent este propus adversarului și devine final după confirmare. Anularea marchează partida ca anulată și nu o înregistrează ca rezultat.':'Încheierea anticipată propune scorul actual și cere confirmarea adversarului. Anularea nu se numără în statistici.')+'</div>';}
  h+='</div>';
  var bn=h;h=head;
  var first=App.me===m.b?"b":"a",second=first==="a"?"b":"a",pre=!started&&m.status==="active";
  var sd='<div class="sides">'+(pre?(m.type==="combat-patrol"?cpSideSetupHtml(first)+cpSideSetupHtml(second):setupHtml(first)+setupHtml(second)):(m.type==="combat-patrol"?cpSideGameHtml(first)+cpSideGameHtml(second):sideHtml(first)+sideHtml(second)))+'</div>';
  h+=pre?sd+bn:bn+(m.status==="done"?summaryHtml():'')+sd;
  if(App.isAdmin)h+='<p style="margin-top:24px">'+B("del","","Șterge meciul","",false,"ghost")+'</p>';
  $("box").innerHTML=h;
  var isCP=m.type==="combat-patrol",ownSide=cpOwnSide(),ownPatrol=ownSide&&cpPatrolFor(ownSide);
  $("openCoreStratagems").textContent=isCP?"⚔ Stratagems":"⚔ Core Stratagems";
  $("openPatrolDatasheets").hidden=!isCP;
  $("matchToolsHint").textContent=isCP?(ownPatrol?"Core + "+ownPatrol.name:"Alege-ți Combat Patrol-ul pentru a încărca regulile."):"Referință rapidă · fără să părăsești meciul";
  [].forEach.call(document.querySelectorAll("details[data-k]"),function(d){d.addEventListener("toggle",function(){openS[d.getAttribute("data-k")]=d.open})});
}

/* înainte de start, profilul de armată/detașamente se preia în meci (fără să pierzi alegerile deja făcute) */
function syncProfile(){
  if(!M||M.first!=null||M.status!=="active")return;
  ["a","b"].forEach(function(s){
    if(App.me!==M[s]||PS(s).ready)return;
    var cur=App.players.filter(function(x){return x.name===M[s]})[0];if(!cur)return;
    var old=P(s),opts=Data.fdsFor(cur.army,cur.dets),fd=opts.indexOf(old.fd)>=0?old.fd:(opts.indexOf(cur.fd)>=0?cur.fd:old.fd);
    if(old.army===cur.army&&JSON.stringify(old.dets||[])===JSON.stringify(cur.dets||[])&&old.fd===fd&&old.warlordName===(cur.warlordName||"")&&!!old.warlordExtraCP===!!cur.warlordExtraCP)return;
    var o={};o[s==="a"?"pa":"pb"]=Object.assign({},old,{army:cur.army,det:cur.det,dets:cur.dets,fd:fd,warlordName:cur.warlordName||"",warlordExtraCP:!!cur.warlordExtraCP});upd(o);
  });
}
function afterDone(){if(M.type==="tournament"&&M.tid)Tourney.tryAdvance(M.tid).catch(fail)}
function verdict(){
  var ta=M.type==="combat-patrol"?M.sa.log.filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(M.sa),tb=M.type==="combat-patrol"?M.sb.log.filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(M.sb),w=ta>tb?"a":(tb>ta?"b":"draw");
  if(w==="draw"&&M.type==="tournament"&&(M.fmt||"elim")==="elim")w=confirm("Egalitate "+ta+"–"+tb+". "+M.pa.name+" trece mai departe? OK = "+M.pa.name+", Anulează = "+M.pb.name)?"a":"b";
  return {ta:ta,tb:tb,w:w};
}

function go(a,el){
  var s=el.getAttribute("data-s"),n=el.getAttribute("data-n"),v=+el.getAttribute("data-v"),i=+el.getAttribute("data-i");
  if(a==="acc"){upd({status:"active",pa:App.snapOr(M.a,M.pa),pb:App.snapOr(M.b,M.pb)});return}
  if(a==="dec"){upd({status:"declined"});return}
  if(a==="ready"){if(M.type==="combat-patrol"&&(!PS(s).cpEdition||!PS(s).cpPatrolId))return;mut(s,function(ps){ps.ready=true});return}
  if(a==="unready"){mut(s,function(ps){ps.ready=false});return}
  if(a==="cpvp"){var reason=document.querySelector('[data-cp-reason="'+s+'"]'),label=n||reason&&reason.value.trim()||"Punctaj misiune";if(v<0){var bal=(PS(s).log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(t,e){return t+e.v},0);if(bal<=0)return}mut(s,function(ps){logAdd(ps,"cpvp",v,label)});return}
  if(a==="atk"){upd({atk:el.getAttribute("data-v")});return}
  if(a==="first"){if(!(M.sa.ready&&M.sb.ready&&M.atk))return;var chosen=el.getAttribute("data-v")==="rand"?pick(["a","b"]):el.getAttribute("data-v");var ref=App.db.collection("matches").doc(mid);App.db.runTransaction(function(tx){return tx.get(ref).then(function(doc){var d=doc.data();if(!doc.exists||d.first!=null||d.status!=="active")return;var events=(d.cpAuto||[]).slice();M=Object.assign({},M,d);awardCommandCP(events,{a:d.pa||{},b:d.pb||{}},true,1,0);tx.update(ref,{first:chosen,ts:Date.now(),cpAuto:events,turnUndo:null})})}).catch(fail);return}
  if(a==="end"){saveTurnEnd();return}
  if(a==="back"){undoTurn();return}
  if(a==="reopen"){upd({status:"active",winner:null,pw:null,pBy:null});return}
  if(a==="del"){if(confirm("Ștergi meciul definitiv?"))App.db.collection("matches").doc(mid).delete().then(function(){location.href="index.html"}).catch(fail);return}
  if(a==="finish"){var f=verdict();upd({status:"done",winner:f.w,fta:f.ta,ftb:f.tb}).then(afterDone);return}
  if(a==="propose"){var q=verdict();upd({status:"confirm",pw:q.w,pBy:App.me===M.b?"b":"a",pta:q.ta,ptb:q.tb});return}
  if(a==="confirm"){upd({status:"done",winner:M.pw,fta:M.pta,ftb:M.ptb}).then(afterDone);return}
  if(a==="contest"||a==="withdraw"){upd({status:"active",pw:null,pBy:null,early:false});return}
  if(a==="cancel"){if(confirm(M.type==="combat-patrol"?"Anulezi complet partida Combat Patrol? Nu va fi înregistrată ca rezultat.":"Anulezi meciul? Nu se va număra în statistici și dispare din Live."))upd({status:"cancelled",pw:null,pBy:null,early:false});return}
  if(a==="early"){var e=verdict();if(confirm("Oprești jocul cu scorul curent ("+e.ta+" – "+e.tb+")? Adversarul trebuie să confirme scorul."))upd({status:"confirm",pw:e.w,pBy:App.me===M.b?"b":"a",pta:e.ta,ptb:e.tb,early:true});return}
  if(a==="pv"){var pn=primOf(s),L=parseLine(PRI[pn].r[i]);mut(s,function(ps){logAdd(ps,"pri",v,pn+" – "+L.text.slice(0,45),L.w==="F")});return}
  if(a==="sv"){mut(s,function(ps){logAdd(ps,"sec",v,n);if(ps.mode==="T"){rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n)}});return}
  if(a==="toss"){mut(s,function(ps){var amount=Math.min(1,Math.max(0,25-cpBalance(ps,s)));if(amount)logAdd(ps,"cp",amount,"CP Tactical discard: "+n);rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n)});return}
  if(a==="mull"){mut(s,function(ps){
    logAdd(ps,"cp",-1,"Re-trage: "+n);rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n);ps.rd=true;
    var d=shuffle(deckOf(ps));if(d.length){ps.hand.push(d[0]);ps.fresh.push(d[0])}
  });return}
  if(a==="wd"){
    var w=WD[n];if(w.ask&&!confirm(w.ask))return;
    mut(s,function(ps){
      rm(ps.hand,n);rm(ps.fresh,n);if(!w.b)ps.used.push(n);
      var d=shuffle(deckOf(ps).filter(function(x){return x!==n}));
      if(d.length){ps.hand.push(d[0]);ps.fresh.push(d[0])}
    });return;
  }
  if(a==="draw"){mut(s,function(ps){var d=shuffle(deckOf(ps));ps.fresh=[];for(var k=0;k<2&&k<d.length;k++){ps.hand.push(d[k]);ps.fresh.push(d[k])}ps.drawT=M.turn});return}
  if(a==="rm"){
    if(!App.isAdmin)return;
    var t=JSON.parse(JSON.stringify(PS(s)));t.log.splice(i,1);
    var neg=cpOf(t,s)<0;["pri","sec"].forEach(function(k){for(var q=1;q<=5;q++)if(roundVP(t,k,q)<0)neg=true});
    if(neg){alert("Nu se poate șterge: CP-ul sau VP-ul unei runde ar deveni negativ. Șterge mai întâi scăderile de după.");return}
    mut(s,function(ps){ps.log.splice(i,1)});return;
  }
  if(a==="cp"){var bal=cpOf(PS(s),s),amount=v>0?Math.min(v,Math.max(0,25-bal)):v;if(amount<0&&bal+amount<0)return;if(!amount)return;mut(s,function(ps){logAdd(ps,"cp",amount,amount>0?"CP manual":"CP cheltuit manual")});return}
  if(a==="man"){var k=el.getAttribute("data-k");if(v<0&&roundVP(PS(s),k,rd())+v<0)return;mut(s,function(ps){logAdd(ps,k,v,"manual")});return}
}

function onChange(el){
  var a=el.getAttribute("data-act"),s=el.getAttribute("data-s");
  if(a==="br")mut(s,function(ps){ps.br=el.checked});
  if(a==="cpPatrol"){if(cpPatrolList(cpEditionFor(s)).some(function(p){return p.selectionId===el.value||p.id===el.value}))mut(s,function(ps){ps.cpPatrolId=el.value;ps.cpEnhancementId="";ps.ready=false})}
  if(a==="cpEdition"){if(["10","11"].indexOf(el.value)>=0)mut(s,function(ps){ps.cpEdition=el.value;ps.cpPatrolId="";ps.cpEnhancementId="";ps.ready=false})}
  if(a==="cpEnhancement"){var rec=cpRecordFor(s),allowed=cpEnhancementOptions(rec).map(function(x){return x.name});if(!el.value||allowed.indexOf(el.value)>=0)mut(s,function(ps){ps.cpEnhancementId=el.value||""})}
  if(a==="mode")mut(s,function(ps){ps.mode=el.value;if(el.value!=="F")ps.fixed=[]});
  if(a==="fd"){if(!el.value||Data.fdsFor(P(s).army,P(s).dets).indexOf(el.value)<0)return;var o={};o[s==="a"?"pa":"pb"]=Object.assign({},P(s),{fd:el.value});upd(o)}
  if(a==="fix"){
    var n=el.getAttribute("data-n"),ps=PS(s);
    if(el.checked&&ps.fixed.length>=2){el.checked=false;return}
    mut(s,function(ps){if(el.checked)ps.fixed.push(n);else rm(ps.fixed,n)});
  }
}

App.start(function(){
  var stratModal=$("coreStratagemModal"),stratSearch=$("matchStratQ"),stratList=$("matchCoreStratagemList");
  function closeStratagems(){cpModalClose("coreStratagemModal");}
  function openStratagems(){if(!stratModal)return;if(M&&M.type==="combat-patrol")cpOpenPatrolModal("strat");else{stratModal.hidden=false;$("cpStratTabs").hidden=true;$("cpPatrolStratPanel").hidden=true;$("matchCoreStratagemList").hidden=false;$("matchStratQ").hidden=false;$("stratModalTitle").textContent="Core Stratagems";$("stratModalDesc").textContent="Core Rules reference";renderCoreStratagems(stratList,stratSearch.value)}}
  $("openCoreStratagems").addEventListener("click",openStratagems);
  $("openPatrolDatasheets").addEventListener("click",function(){cpOpenPatrolModal("data")});
  $("closeCoreStratagems").addEventListener("click",closeStratagems);
  stratModal.addEventListener("click",function(e){if(e.target===stratModal)closeStratagems()});
  document.querySelectorAll("[data-cp-tab]").forEach(function(b){b.addEventListener("click",function(){cpSetTab(this.getAttribute("data-cp-tab"))})});
  document.querySelectorAll("[data-close-modal]").forEach(function(b){b.addEventListener("click",function(){cpModalClose(this.getAttribute("data-close-modal"))})});
  ["patrolDatasheetModal"].forEach(function(id){var x=$(id);x.addEventListener("click",function(e){if(e.target===x)cpModalClose(id)})});
  stratSearch.addEventListener("input",function(){if(M&&M.type==="combat-patrol"){var ed=cpOwnSide()?cpEditionFor(cpOwnSide()):"";if(ed==="11")renderCoreStratagems(stratList,stratSearch.value,CORE_STRATAGEMS.filter(function(x){return ["Explosives","Crushing Impact","Rapid Ingress"].indexOf(x.name)<0}));}else renderCoreStratagems(stratList,stratSearch.value)});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"){closeStratagems();cpModalClose("patrolDatasheetModal");cpModalClose("patrolMissionModal")}});
  App.onPlayers=syncProfile;
  setInterval(function(){var e=$("tmr");if(e){var ts=+e.getAttribute("data-ts");e.textContent=ts?fmtT(Date.now()-ts):""}},1000);
  fetch("data/combat-patrol.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("Nu pot încărca biblioteca Combat Patrol.");return r.json()}).catch(function(e){console.warn(e);CPMATCH={factions:[],patrols11_extra:[],sources:{}}}).then(function(data){if(data)CPMATCH=data;App.db.collection("matches").doc(mid).onSnapshot(function(d){
    if(!d.exists){$("box").innerHTML='<p class="err">Meciul nu există.</p>';return}
    M=Object.assign({id:d.id,cpAuto:[]},d.data());if(!Array.isArray(M.cpAuto))M.cpAuto=[];render();syncProfile();
  },fail)}).catch(fail);
  $("box").addEventListener("click",function(e){var mission=e.target.closest("[data-open-own-mission]");if(mission){cpOpenPatrolModal("mission");return}var el=e.target.closest("button[data-act]");if(el&&!el.disabled&&M)go(el.getAttribute("data-act"),el)});
  $("box").addEventListener("change",function(e){if(M&&e.target.getAttribute("data-act"))onChange(e.target)});
});
