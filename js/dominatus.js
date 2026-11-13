/* JoiHammer · Dominatus Campaign module
   Campaign administration is restricted to the existing Admin account.
   Players can submit battle reports; the Admin validates and records campaign outcomes. */
var DOM_DATA=null, DOM_CAMPAIGNS=[], DOM_CURRENT=null, DOM_REPORTS=[], DOM_REWARDS=[], DOM_REWARD_UNSUB=null, DOM_REWARD_CAMPAIGN_ID="";
var DOM_COLL="dominatusCampaigns";
function dEsc(v){return esc(v==null?"":String(v))}
function dAllianceName(id){return ({liberators:"Liberators",oppressors:"Oppressors",raiders:"Raiders"})[id]||id}
function dPhaseName(n){var p=(DOM_DATA.phases||[]).filter(function(x){return x.phase===Number(n)})[0];return p?p.name:"Phase "+n}
function dById(arr,id){return (arr||[]).filter(function(x){return x.id===id})[0]||null}
function dDate(ts){try{return ts&&ts.toDate?ts.toDate().toLocaleString("ro-RO"):ts?new Date(ts).toLocaleString("ro-RO"):"—"}catch(e){return "—"}}
function dPlayer(c,id){return (c.players||[]).filter(function(p){return p.id===id})[0]||{id:id,alliance:""}}
function dAgenda(id){return dById(DOM_DATA.agendaDetails,id)}
function dBriefing(alliance,phase){return dById(DOM_DATA.briefings,alliance+"_briefing_phase_"+phase)}
function dLocation(c){return dById(DOM_DATA.locations,c.locationId)}
function dRandomLocation(phase){
 var roll=1+Math.floor(Math.random()*6),matches=(DOM_DATA.locations||[]).filter(function(x){return Number(x.phase)===Number(phase)&&(x.dice||[]).indexOf(roll)>=0});
 if(!matches.length)matches=(DOM_DATA.locations||[]).filter(function(x){return Number(x.phase)===Number(phase)});
 return {roll:roll,location:matches.length?matches[Math.floor(Math.random()*matches.length)]:null};
}
function dAgendaOptions(alliance,phase){
 var b=dBriefing(alliance,phase),ids=b?b.agendaIds||[]:[];
 return ids.map(function(id){return dAgenda(id)}).filter(Boolean);
}
function dRandomAgenda(alliance,phase){
 var options=dAgendaOptions(alliance,phase);
 return options.length?options[Math.floor(Math.random()*options.length)]:null;
}
function dRandomAgendaAssignments(players,phase){
 var out={};
 (players||[]).forEach(function(p){var a=dRandomAgenda(p.alliance,phase);if(a)out[p.id]=a.id;});
 return out;
}
function dRandomForceDispositions(players){
 var options=DOM_DATA.forceDispositions||[],out={};
 (players||[]).forEach(function(p){if(options.length)out[p.id]=options[Math.floor(Math.random()*options.length)].id;});
 return out;
}
function dForceDispositionSelectHtml(player,selected){
 var opts=DOM_DATA.forceDispositions||[];
 return '<label class="opt dom-random-row"><span>'+dEsc(player.id)+' · Force Disposition</span><select data-dom-fd-choice="'+dEsc(player.id)+'">'+opts.map(function(x){return '<option value="'+dEsc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+dEsc(x.nameRo||x.nameEn||x.id)+'</option>'}).join('')+'</select></label>';
}
function dLocationOptions(phase){
 return (DOM_DATA.locations||[]).filter(function(x){return Number(x.phase)===Number(phase)});
}
function dAgendaSelectHtml(player,phase,selected){
 var opts=dAgendaOptions(player.alliance,phase);
 return '<label class="opt dom-random-row"><span>'+dEsc(player.id)+' · '+dEsc(dAllianceName(player.alliance))+'</span><select data-dom-agenda-choice="'+dEsc(player.id)+'"><option value="">Chapter Approved / no Agenda</option>'+opts.map(function(a){return '<option value="'+dEsc(a.id)+'" '+(a.id===selected?'selected':'')+'>'+dEsc(a.name)+'</option>'}).join('')+'</select></label>';
}
function dRenderRandomApproval(c){
 if(!App.isAdmin||c.phaseStatus!=="setup")return "";
 var phase=Number(c.phase||1),locs=dLocationOptions(phase);
 return '<section class="dom-panel dom-random-panel"><div class="dom-section-head"><div><span class="dom-kicker">WARMASTER · RANDOMIZED SETUP</span><h3>Verifică selecțiile înainte de aprobare</h3><p>Selecțiile au fost generate automat. Poți schimba orice rezultat.</p></div><span class="dom-status">Pending approval</span></div>'+
 '<label class="opt">Locație de război<select id="domApproveLocation">'+locs.map(function(x){return '<option value="'+dEsc(x.id)+'" '+(x.id===c.locationId?'selected':'')+'>'+dEsc(x.name)+'</option>'}).join('')+'</select></label>'+

 '<h4>Force Dispositions generate pentru jucători</h4><div class="dom-random-grid">'+(c.players||[]).map(function(p){return dForceDispositionSelectHtml(p,(c.forceDispositions||{})[p.id])}).join('')+'</div>'+
 '<h4>Agendas generate pentru jucători</h4><div class="dom-random-grid">'+(c.players||[]).map(function(p){return dAgendaSelectHtml(p,phase,(c.agendaSelections||{})[p.id])}).join('')+'</div>'+
 '<div class="dom-actions"><button id="domRerollSetup" class="ghost">🎲 Regenerează selecțiile</button><button id="domApproveSetup" class="primary">Aprobă și activează faza</button></div>'+
 '<p class="dom-muted">Agendas sunt randomizate din pool-ul Briefing-ului alianței și fazei. Până la completarea matricei Force Disposition, verifică selecția față de briefing-ul oficial înainte de aprobare.</p></section>';
}
function dRewardTypeLabel(t){return ({"Battle Honour":"Battle Honour","Battle Skill":"Battle Skill","Relic":"Relic","Path to Conquest":"Path to Conquest"})[t]||t}
function dRewardCardById(type,id){var arr=type==="Battle Honour"?DOM_DATA.battleHonours:type==="Battle Skill"?DOM_DATA.battleSkills:type==="Relic"?DOM_DATA.relics:DOM_DATA.battleHonours;return dById(arr,id)||((DOM_DATA.battleHonours||[]).filter(function(x){return x.id==="path_to_conquest"})[0])}
function dRewardSnapshot(card,type){return {id:card.id,name:card.name,who:card.who||"",type:type,effect:card.effectRo||card.effect||"",bonusEffect:card.bonusEffectRo||"",loreTextRo:card.loreTextRo||""}}
function dRandomSample(items,count){var a=shuffle(items||[]);return a.slice(0,Math.max(0,Math.min(count,a.length)))}
function dSelectedRewardIds(playerId,type){return DOM_REWARDS.filter(function(r){return r.playerId===playerId&&r.status==="selected"&&(!type||r.category===type)}).map(function(r){return r.selectedCardId})}
function dSelectedUnitUsed(c,playerId,unit,excludeId){var key=String(unit||"").trim().toLowerCase();return !!key&&(DOM_REWARDS.some(function(r){return r.playerId===playerId&&r.status==="selected"&&r.id!==excludeId&&String(r.assignedUnit||"").trim().toLowerCase()===key})||((c.upgrades||{})[playerId]||[]).some(function(u){return String(u.unit||"").trim().toLowerCase()===key}))}
function dLoadRewards(c){
 if(DOM_REWARD_CAMPAIGN_ID===c.id&&DOM_REWARD_UNSUB){dRenderRewardDecks(c);return;}
 if(DOM_REWARD_UNSUB)DOM_REWARD_UNSUB();DOM_REWARD_CAMPAIGN_ID=c.id;
 var q=App.db.collection(DOM_COLL).doc(c.id).collection("rewards");
 if(!App.isAdmin)q=q.where("playerId","==",App.me);
 DOM_REWARD_UNSUB=q.onSnapshot(function(s){DOM_REWARDS=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});if(DOM_CURRENT&&DOM_CURRENT.id===c.id)dRenderDetail(DOM_CURRENT);else dRenderRewardDecks(c);},function(e){var el=document.getElementById("domRewardDecks");if(el)el.innerHTML='<p class="err">Nu pot încărca recompensele: '+dEsc(e.message||e)+'</p>'});
}
function dRenderRewardDecks(c){
 var el=document.getElementById("domRewardDecks");if(!el)return;
 var list=DOM_REWARDS.filter(function(r){return App.isAdmin||r.playerId===App.me;});
 if(!list.length){el.innerHTML='<p class="empty">Nu există cărți trase încă. Recompensele vor fi generate automat după validarea bătăliilor și la încheierea fazelor.</p>';return;}
 el.innerHTML=list.sort(function(a,b){return (b.createdAt&&b.createdAt.toMillis?b.createdAt.toMillis():0)-(a.createdAt&&a.createdAt.toMillis?a.createdAt.toMillis():0)}).map(function(r){
  var owner=dPlayer(c,r.playerId),pending=r.status==="pending",selected=r.status==="selected",cards=r.candidates||[];
  var body='';
  if(pending&&r.playerId===App.me&&!App.isAdmin){
   var options=cards.map(function(x){return '<option value="'+dEsc(x.id)+'">'+dEsc(x.name)+'</option>'}).join("");
   var needsUnit=cards.some(function(x){return x.who&&x.who.indexOf("Campaign card")<0});
   body='<div class="dom-reward-choice">'+(cards.length>1?'<label class="opt">Alege cartea pe care o păstrezi<select id="domRewardCard_'+dEsc(r.id)+'">'+options+'</select></label>':'<p class="dom-muted">Cartea trasă: <b>'+dEsc(cards[0]&&cards[0].name||"—")+'</b></p>')+(needsUnit?'<label class="opt">Unitatea / modelul care primește upgrade-ul<input id="domRewardUnit_'+dEsc(r.id)+'" maxlength="100" placeholder="Ex. Captain in Terminator Armour" required></label>':'')+'<button class="primary sm" data-dom-keep-reward="'+dEsc(r.id)+'">Păstrează cartea</button></div>';
  }else if(selected){var kept=dRewardCardById(r.category,r.selectedCardId);body='<p class="dom-success">Păstrată: <b>'+dEsc(kept?kept.name:r.selectedCardId)+'</b>'+(r.assignedUnit?' · '+dEsc(r.assignedUnit):'')+'</p>'+(kept?'<p>'+dEsc(kept.effectRo||kept.effect||'')+'</p>':'');}
  else if(pending&&App.isAdmin){body='<p class="dom-muted">Așteaptă alegerea lui '+dEsc(r.playerId)+'. Cărți disponibile: '+dEsc(cards.map(function(x){return x.name}).join(", "))+'</p>';}
  else if(r.status==="exhausted"){body='<p class="dom-muted">Pachetul nu mai are cărți disponibile pentru această tragere.</p>';}
  return '<article class="dom-reward-card"><div class="dom-battle-top"><span class="dom-kicker">'+dEsc(dRewardTypeLabel(r.category))+' · PHASE '+dEsc(r.phase)+'</span><span class="dom-status '+(selected?'is-active':'')+'">'+(selected?'Kept':pending?'Awaiting choice':dEsc(r.status||"—"))+'</span></div><b>'+dEsc(r.playerId)+'</b>'+(r.reason?'<p class="dom-muted">'+dEsc(r.reason)+'</p>':'')+body+'</article>';
 }).join("");
 el.querySelectorAll('[data-dom-keep-reward]').forEach(function(b){b.onclick=function(){dKeepReward(c,b.getAttribute('data-dom-keep-reward'))}});
}
async function dKeepReward(c,rewardId){
 var r=DOM_REWARDS.filter(function(x){return x.id===rewardId})[0];if(!r||r.playerId!==App.me||r.status!=="pending")return;
 var cardId=(r.candidates||[]).length===1?r.candidates[0].id:(document.getElementById("domRewardCard_"+rewardId)||{}).value;
 var card=(r.candidates||[]).filter(function(x){return x.id===cardId})[0];if(!card){alert("Alege o carte validă.");return;}
 var needsUnit=card.who&&card.who.indexOf("Campaign card")<0,unit=needsUnit?((document.getElementById("domRewardUnit_"+rewardId)||{}).value||"").trim():"";
 if(needsUnit&&!unit){alert("Introdu unitatea/modelul care primește upgrade-ul.");return;}
 if(dSelectedRewardIds(App.me).indexOf(card.id)>=0||((c.upgrades||{})[App.me]||[]).some(function(u){return u.id===card.id})){alert("Deții deja această carte. Alege altă carte din tragere.");return;}
 if(unit&&dSelectedUnitUsed(c,App.me,unit,rewardId)){alert("Această unitate are deja un Upgrade. Regulile permit un singur Upgrade per unitate.");return;}
 try{await App.db.collection(DOM_COLL).doc(c.id).collection("rewards").doc(rewardId).update({selectedCardId:card.id,assignedUnit:unit,status:"selected",selectedAt:firebase.firestore.FieldValue.serverTimestamp()});}
 catch(e){fail(e)}
}
async function dCreateRewardDraw(c,playerId,category,phase,battleId,drawCount,reason){
 var rewardId=(battleId||("phase"+phase))+"_"+playerId+"_"+category.toLowerCase().replace(/[^a-z]+/g,"_");
 var ref=App.db.collection(DOM_COLL).doc(c.id).collection("rewards").doc(rewardId),old=await ref.get();if(old.exists)return;
 var pool=category==="Battle Honour"?(DOM_DATA.battleHonours||[]).filter(function(x){return Number(x.phase)===Number(phase)}):category==="Battle Skill"?(DOM_DATA.battleSkills||[]):category==="Relic"?(DOM_DATA.relics||[]).filter(function(x){return x.alliance===dPlayer(c,playerId).alliance}):[{id:"path_to_conquest",name:"Path to Conquest",who:"Campaign card",effect:"Recompensa finală pentru câștigătorul Phase 3.",effectRo:"Recompensa finală pentru câștigătorul Phase 3."}];
 var allRewards=await App.db.collection(DOM_COLL).doc(c.id).collection("rewards").get(),playerRewards=allRewards.docs.map(function(d){return d.data()}).filter(function(x){return x.playerId===playerId}),held=playerRewards.filter(function(x){return x.status==="selected"}).map(function(x){return x.selectedCardId}),reserved=playerRewards.filter(function(x){return x.status==="pending"}).reduce(function(a,x){return a.concat(x.candidateIds||[])},[]);
 held=held.concat(reserved).concat(((c.upgrades||{})[playerId]||[]).map(function(u){return u.id}));pool=pool.filter(function(x){return held.indexOf(x.id)<0});
 var cards=dRandomSample(pool,drawCount).map(function(x){return dRewardSnapshot(x,category)});
 await ref.set({playerId:playerId,category:category,phase:Number(phase),battleId:battleId||"",candidates:cards,candidateIds:cards.map(function(x){return x.id}),status:cards.length?"pending":"exhausted",reason:reason||"",createdAt:firebase.firestore.FieldValue.serverTimestamp(),selectedCardId:"",assignedUnit:""});
}
async function dCreateBattleRewards(c,b,r,earnedAchievement){
 var phase=Number(b.phase||c.phase||1),winner=r.winner,players=[b.a,b.b];
 for(var i=0;i<players.length;i++){
  var pid=players[i],isWinner=winner===pid,category="";
  if(phase===3){if(isWinner)category="Path to Conquest";}
  else if(winner==="draw"||!isWinner)category="Battle Skill";else category="Battle Honour";
  if(!category)continue;
  var extra=earnedAchievement&&earnedAchievement[pid]&&category!=="Path to Conquest"?1:0;
  var reason=category==="Path to Conquest"?"Phase 3 victor reward.":(category==="Battle Honour"?"Battle victor draw.":winner==="draw"?"Draw: both players receive a Battle Skill.":"Opponent of the battle victor receives a Battle Skill.");
  if(extra)reason+=" Agenda Achieved: one additional card drawn; keep one and return the rest.";
  await dCreateRewardDraw(c,pid,category,phase,b.id,1+extra,reason);
 }
}
async function dCreatePhaseRelicDraws(c){
 var phase=Number(c.phase||1);if(phase>=3)return;
 var reservedByAlliance={},existingRewards=await App.db.collection(DOM_COLL).doc(c.id).collection("rewards").get();
 existingRewards.docs.map(function(d){return d.data()}).filter(function(x){return x.category==="Relic"&&(x.status==="selected"||x.status==="pending")}).forEach(function(x){var a=dPlayer(c,x.playerId).alliance;reservedByAlliance[a]= (reservedByAlliance[a]||[]).concat(x.status==="selected"?[x.selectedCardId]:(x.candidateIds||[]));});
 for(var i=0;i<(c.players||[]).length;i++){
  var p=c.players[i],count=Number((c.agendaAchieved||{})[p.id]||0);if(count<=0)continue;
  var rewardId="phase"+phase+"_relic_"+p.id,ref=App.db.collection(DOM_COLL).doc(c.id).collection("rewards").doc(rewardId),old=await ref.get();if(old.exists){var existing=old.data()||{};reservedByAlliance[p.alliance]=(reservedByAlliance[p.alliance]||[]).concat(existing.status==="selected"?[existing.selectedCardId]:(existing.candidateIds||[]));continue;}
  var held=(reservedByAlliance[p.alliance]||[]).concat((c.players||[]).reduce(function(a,pl){return a.concat(((c.upgrades||{})[pl.id]||[]).filter(function(u){return u.type==="Relic"&&pl.alliance===p.alliance}).map(function(u){return u.id}))},[]));
  var pool=(DOM_DATA.relics||[]).filter(function(x){return x.alliance===p.alliance&&held.indexOf(x.id)<0});
  var cards=dRandomSample(pool,count).map(function(x){return dRewardSnapshot(x,"Relic")});
  reservedByAlliance[p.alliance]=(reservedByAlliance[p.alliance]||[]).concat(cards.map(function(x){return x.id}));
  await ref.set({playerId:p.id,category:"Relic",phase:phase,battleId:"",candidates:cards,candidateIds:cards.map(function(x){return x.id}),status:cards.length?"pending":"exhausted",reason:"Phase-end draw: "+count+" Relic card(s) for "+count+" Agenda Achieved card(s). Keep one and return the others.",createdAt:firebase.firestore.FieldValue.serverTimestamp(),selectedCardId:"",assignedUnit:""});
 }
}
function dStatus(s){return ({active:"În desfășurare",completed:"Încheiată",setup:"Configurare"})[s]||s||"—"}
function dCampaignCard(c){
 var loc=dLocation(c),mine=(c.players||[]).some(function(p){return p.id===App.me}),isAdmin=App.isAdmin;
 if(!mine&&!isAdmin)return "";
 return '<article class="dom-campaign-card"><div class="dom-card-top"><span class="dom-kicker">DOMINATUS · 11TH EDITION</span><span class="dom-status '+(c.status==="active"?"is-active":"")+'">'+dStatus(c.status)+'</span></div><h2>'+dEsc(c.name)+'</h2><div class="dom-meta"><span>Phase '+dEsc(c.phase||1)+' / 3</span><span>'+dEsc((c.players||[]).length)+' players</span><span>'+(loc?dEsc(loc.name):"Location pending")+'</span></div><div class="dom-card-actions"><a class="primary" href="dominatus.html?id='+encodeURIComponent(c.id)+'">Deschide campania</a>'+(isAdmin?'<button class="ghost sm" data-dom-delete-campaign="'+dEsc(c.id)+'">Șterge campania</button>':'')+'</div></article>';
}
function dRenderHome(){
 var el=document.getElementById("domApp");
 var visible=DOM_CAMPAIGNS.filter(function(c){return App.isAdmin||(c.players||[]).some(function(p){return p.id===App.me})});
 var h='<div class="dom-section-head"><div><span class="dom-kicker">CAMPAIGN OPERATIONS</span><h2>Campaign Archive</h2><p>Campanii active și istoricul operațiunilor.</p></div>';
 if(App.isAdmin)h+='<button id="domCreateToggle" class="primary">＋ Creează campanie</button>';
 h+='</div>';
 if(App.isAdmin)h+='<section id="domCreatePanel" class="dom-panel" hidden><h3>Campanie nouă</h3><label class="opt">Numele campaniei<input id="domNewName" maxlength="80" placeholder="The War for the Imperium"></label><p class="dom-muted">Selectează participanții și alianța fiecăruia. Liberators și Oppressors sunt obligatorii; Raiders este opțională.</p><div id="domNewPlayers" class="dom-player-picks">'+App.players.filter(function(p){return p.name!=="admin"}).map(function(p){return '<label class="dom-player-pick"><span><input type="checkbox" data-dom-player="'+dEsc(p.name)+'"> <b>'+dEsc(p.name)+'</b><small>'+dEsc(p.army||"Army not set")+' · '+dEsc(p.fd||"")+'</small></span><select data-dom-alliance="'+dEsc(p.name)+'"><option value="liberators">Liberators</option><option value="oppressors">Oppressors</option><option value="raiders">Raiders</option></select></label>'}).join("")+'</div><div class="dom-actions"><button id="domCreate" class="primary">Creează campania</button><button id="domCreateCancel" class="ghost">Anulează</button></div></section>';
 h+='<div class="dom-campaign-list">'+(visible.map(dCampaignCard).join("")||'<p class="empty">Nu există campanii disponibile. '+(App.isAdmin?'Creează prima campanie pentru a începe.':'Așteaptă ca Warmaster-ul să te adauge într-o campanie.')+'</p>')+'</div>';
 el.innerHTML=h;
 var toggle=document.getElementById("domCreateToggle");
 if(toggle)toggle.onclick=function(){var p=document.getElementById("domCreatePanel");p.hidden=!p.hidden};
 var cancel=document.getElementById("domCreateCancel");if(cancel)cancel.onclick=function(){document.getElementById("domCreatePanel").hidden=true};
 var create=document.getElementById("domCreate");if(create)create.onclick=dCreateCampaign;
 document.querySelectorAll("[data-dom-delete-campaign]").forEach(function(b){b.onclick=function(){dDeleteCampaign(b.getAttribute("data-dom-delete-campaign"))}});
}
async function dDeleteDocsInBatches(refs){
 for(var i=0;i<refs.length;i+=450){var batch=App.db.batch();refs.slice(i,i+450).forEach(function(r){batch.delete(r)});await batch.commit()}
}
async function dDeleteCampaign(campaignId){
 if(!App.isAdmin)return;
 var campaign=(DOM_CAMPAIGNS||[]).filter(function(c){return c.id===campaignId})[0];
 if(!campaign){alert("Campania nu a fost găsită.");return}
 if(!confirm("Ștergi definitiv campania „"+campaign.name+"”, meciurile, rapoartele, recompensele și legăturile participanților?"))return;
 try{
  var root=App.db.collection(DOM_COLL).doc(campaignId),refs=[];
  var reports=await root.collection("reports").get(),rewards=await root.collection("rewards").get();
  reports.docs.concat(rewards.docs).forEach(function(d){refs.push(d.ref)});
  (campaign.players||[]).forEach(function(p){refs.push(App.db.collection("dominatusUsers").doc(p.id).collection("campaigns").doc(campaignId))});
  (campaign.battles||[]).forEach(function(b){if(b.matchId)refs.push(App.db.collection("matches").doc(b.matchId))});
  await dDeleteDocsInBatches(refs);
  await root.delete();
  alert("Campania a fost ștearsă.");
  if(new URLSearchParams(location.search).get("id")===campaignId)location.href="dominatus.html";
 }catch(e){fail(e);alert("Nu am putut șterge campania: "+(e.message||e))}
}
async function dCreateCampaign(){
 var name=(document.getElementById("domNewName").value||"").trim(),checks=[].slice.call(document.querySelectorAll("[data-dom-player]:checked"));
 var players=checks.map(function(x){var id=x.getAttribute("data-dom-player"),p=App.players.filter(function(z){return z.name===id})[0]||{};return {id:id,alliance:document.querySelector('[data-dom-alliance="'+id+'"]').value,army:p.army||"",dets:p.dets||[],fd:p.fd||"",warlordName:p.warlordName||""}});
 var alliances={};players.forEach(function(p){alliances[p.alliance]=true});
 if(!name){alert("Introdu numele campaniei.");return}
 if(players.length<2){alert("Ai nevoie de cel puțin doi jucători.");return}
 if(!alliances.liberators||!alliances.oppressors){alert("Campania necesită cel puțin un jucător Liberators și unul Oppressors.");return}
 var loc=dRandomLocation(1),ref=App.db.collection(DOM_COLL).doc(),agendaSelections=dRandomAgendaAssignments(players,1),forceDispositions=dRandomForceDispositions(players);
 var doc={name:name,status:"setup",createdBy:App.me,createdAt:firebase.firestore.FieldValue.serverTimestamp(),phase:1,phaseStatus:"setup",locationId:loc.location?loc.location.id:"",locationRoll:loc.roll,agendaSelections:agendaSelections,forceDispositions:forceDispositions,players:players,playerIds:players.map(function(p){return p.id}),battles:[],agendaAchieved:{},upgrades:{},phaseHistory:[],notes:"",schemaVersion:1};
 try{var batch=App.db.batch();batch.set(ref,doc);players.forEach(function(p){var access=App.db.collection("dominatusUsers").doc(p.id).collection("campaigns").doc(ref.id);batch.set(access,{campaignId:ref.id,playerId:p.id,campaignName:name,createdAt:firebase.firestore.FieldValue.serverTimestamp()})});await batch.commit();location.href="dominatus.html?id="+ref.id}catch(e){fail(e)}
}
function dShufflePlayers(list){
 var a=(list||[]).slice();
 for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}
 return a;
}
function dCampaignMatchId(c,b){return "camp_"+String(c.id).replace(/[^a-zA-Z0-9_-]/g,"_")+"_"+String(b.id).replace(/[^a-zA-Z0-9_-]/g,"_")}
function dCampaignMatchContext(c,b,rewardRows){
 var loc=dLocation(c),pa=dPlayer(c,b.a),pb=dPlayer(c,b.b),aa=dAgenda(b.agendaA),ab=dAgenda(b.agendaB);
 function agendaInfo(a){return a?{id:a.id,name:a.name,alliance:a.alliance,lore:a.loreTextRo||"",agendaAchieved:a.agendaAchieved||[],primaryMission:a.primaryMission||{}}:null}
 function upgrades(pid){
  var list=(c.upgrades||{})[pid]||[];
  var selected=(rewardRows||[]).filter(function(r){return r.playerId===pid&&r.status==="selected"}).map(function(r){
   var pool=r.category==="Battle Honour"?DOM_DATA.battleHonours:r.category==="Battle Skill"?DOM_DATA.battleSkills:r.category==="Relic"?DOM_DATA.relics:[];
   var card=dById(pool,r.selectedCardId);
   return {id:r.selectedCardId,name:r.selectedCardName||(card&&card.name)||r.selectedCardId,type:r.category,unit:r.assignedUnit||"",effect:card&&(card.effectRo||card.effect)||""};
  });
  return list.map(function(u){return {id:u.id,name:u.name,type:u.type,unit:u.unit||"",effect:u.effectRo||u.effect||""}}).concat(selected);
 }
 return {campaignId:c.id,campaignName:c.name,campaignPhase:Number(b.phase||c.phase||1),campaignRound:Number(b.round||1),campaignBattleId:b.id,campaignLocation:loc?{id:loc.id,name:loc.name,lore:loc.loreTextRo||"",bonus:loc.bonus||{},warZoneRules:loc.warZoneRules||[]}:null,campaignPlayers:{a:{id:pa.id,alliance:pa.alliance,forceDisposition:(c.forceDispositions||{})[pa.id]||pa.fd||"",agenda:agendaInfo(aa),upgrades:upgrades(pa.id)},b:{id:pb.id,alliance:pb.alliance,forceDisposition:(c.forceDispositions||{})[pb.id]||pb.fd||"",agenda:agendaInfo(ab),upgrades:upgrades(pb.id)}},campaignBriefings:(DOM_DATA.briefings||[]).filter(function(x){return Number(x.phase)===Number(b.phase||c.phase)&&[pa.alliance,pb.alliance].indexOf(x.alliance)>=0}).map(function(x){return {id:x.id,alliance:x.alliance,phase:x.phase,lore:x.loreTextRo||x.narrativeSummary||"",strategicObjective:x.strategicObjective||""}})};
}
async function dEnsureCampaignMatchDocs(c,battles){
 var out=(battles||[]).map(function(b){return Object.assign({},b)}),batch=App.db.batch(),pending=0;
 var rewardSnap=await App.db.collection(DOM_COLL).doc(c.id).collection("rewards").get(),rewardRows=rewardSnap.docs.map(function(d){return d.data()}),existingSnap=await App.db.collection("matches").where("campaignId","==",c.id).get(),existingMatches=existingSnap.docs.map(function(d){return Object.assign({id:d.id},d.data())});
 function previousRoundDone(b){var round=Number(b.round||1);if(round<=1)return true;var prev=existingMatches.filter(function(x){return Number(x.campaignPhase||1)===Number(b.phase||c.phase||1)&&Number(x.campaignRound||1)===round-1});return [b.a,b.b].every(function(player){return prev.filter(function(x){return x.a===player||x.b===player}).every(function(x){return x.status==="done"})})}
 for(var i=0;i<out.length;i++){
  var b=out[i];if(b.status==="completed")continue;
  var matchId=b.matchId||dCampaignMatchId(c,b),ref=App.db.collection("matches").doc(matchId),old=await ref.get();
  var context=dCampaignMatchContext(c,b,rewardRows);
  if(!old.exists){
   var payload=App.newMatch({type:"campaign",a:b.a,b:b.b,status:previousRoundDone(b)?"active":"campaign_locked",pa:App.snap(b.a),pb:App.snap(b.b),campaignId:c.id,campaignBattleId:b.id,campaignContext:context,campaignPhase:Number(b.phase||c.phase||1),campaignRound:Number(b.round||1),campaignAgendaA:b.agendaA||"",campaignAgendaB:b.agendaB||"",campaignLocationId:b.locationId||c.locationId||"",campaignName:c.name||""});
   batch.set(ref,payload);pending++;
  }else{
   var oldData=old.data()||{},updates={campaignContext:context,campaignPhase:Number(b.phase||c.phase||1),campaignRound:Number(b.round||1),campaignAgendaA:b.agendaA||"",campaignAgendaB:b.agendaB||"",campaignLocationId:b.locationId||c.locationId||"",campaignName:c.name||""};
   if(oldData.first==null&&oldData.status!=="done")updates.status=previousRoundDone(b)?"active":(Number(b.round||1)>1?"campaign_locked":"active");
   batch.update(ref,updates);pending++;
  }
  b.matchId=matchId;
 }
 if(pending)await batch.commit();
 return out;
}
function dBuildPhaseMatches(c,phase,existing){
 var rounds=Number(phase)===3?1:2,players=(c.players||[]).slice(),used=(existing||[]).filter(function(b){return Number(b.phase)===Number(phase)}),created=[],stamp=Date.now();
 function pairKey(a,b){return [a,b].sort().join("::")}
 for(var round=1;round<=rounds;round++){
  var pool=dShufflePlayers(players),paired={};
  while(pool.length>1){
   var a=pool.shift(),best=-1,bestScore=-999;
   for(var i=0;i<pool.length;i++){
    var b=pool[i],cross=a.alliance!==b.alliance,repeat=used.concat(created).some(function(x){return pairKey(x.a,x.b)===pairKey(a.id,b.id)});
    var score=(cross?100:0)+(repeat?-1000:0)+Math.random()*20;
    if(score>bestScore){bestScore=score;best=i;}
   }
   var b=pool.splice(best,1)[0],agendaA=(c.agendaSelections||{})[a.id]||"",agendaB=(c.agendaSelections||{})[b.id]||"";
   created.push({id:"auto_p"+phase+"_r"+round+"_"+stamp+"_"+created.length,phase:Number(phase),round:round,a:a.id,b:b.id,agendaA:agendaA,agendaB:agendaB,locationId:c.locationId||"",battleSize:"Strike Force",status:"scheduled",generated:true,createdAt:Date.now()});
  }
 }
 return created;
}
async function dGeneratePhaseMatches(c,replaceScheduled){
 var phase=Number(c.phase||1),all=(c.battles||[]).slice();
 if(replaceScheduled)all=all.filter(function(b){return Number(b.phase)!==phase||b.status==="completed"});
 else if(all.some(function(b){return Number(b.phase)===phase})) {alert("Există deja meciuri pentru faza aceasta. Șterge meciurile programate înainte să generezi din nou.");return}
 var fresh=dBuildPhaseMatches(c,phase,all);
 if(!fresh.length){alert("Nu există suficienți jucători pentru a genera meciuri.");return}
 if(!confirm("Generez "+fresh.length+" meciuri pentru Phase "+phase+"?"+(phase===3?" Faza finală va avea o singură rundă.":" Faza va avea două runde, câte un meci per jucător în fiecare rundă.")+(replaceScheduled?" Meciurile programate existente din fază vor fi înlocuite.":"")))return;
 var scheduled=await dEnsureCampaignMatchDocs(c,all.concat(fresh));
 await dUpdateCampaign(c,{battles:scheduled});
}
async function dDeleteScheduledBattle(c,battleId){
 var battles=(c.battles||[]).filter(function(b){return b.id!==battleId});
 var target=(c.battles||[]).filter(function(b){return b.id===battleId})[0];
 if(!target||target.status==="completed")return;
 if(!confirm("Ștergi acest meci programat?"))return;
 if(target.matchId){try{await App.db.collection("matches").doc(target.matchId).delete()}catch(e){console.warn("Campaign match cleanup:",e)}}
 await dUpdateCampaign(c,{battles:battles});
}
var DOM_ARMAGEDDON_LAYOUT={
 the_mannheim_gap:{x:24,y:29,short:"Mannheim Gap"},
 volcanus_archipelago:{x:49,y:17,short:"Volcanus Archipelago"},
 the_morpheon_line:{x:75,y:34,short:"Morpheon Line"},
 cerbera_base:{x:48,y:62,short:"Cerbera Base"},
 victorinius_spaceport:{x:19,y:54,short:"Victorinius"},
 blackfire_death_pits:{x:82,y:67,short:"Blackfire Pits"},
 eyes_of_the_emperor_observatory:{x:67,y:18,short:"Eyes of the Emperor"},
 titangrave:{x:76,y:83,short:"Titangrave"},
 hive_acheron_subsprawl:{x:36,y:82,short:"Acheron Subsprawl"}
};
function dMapPhaseRecord(c,phase){
 return (c.phaseHistory||[]).filter(function(x){return Number(x.phase)===Number(phase)})[0]||null;
}
function dMapLocationRecord(c,locationId){
 return (c.phaseHistory||[]).filter(function(x){return x.locationId===locationId})[0]||null;
}
function dMapControlLabel(alliance){
 return alliance?dAllianceName(alliance):"În dispută";
}
function dMapLocationDetail(c,loc){
 if(!loc)return '<p class="arm-map-empty">Selectează un punct strategic de pe hartă.</p>';
 var rec=dMapLocationRecord(c,loc.id),isCurrent=loc.id===c.locationId,phase=Number(loc.phase||0);
 var control=rec?rec.controlAlliance:(isCurrent?"":null);
 var status=rec?("Controlat de "+dMapControlLabel(control)):(isCurrent?"Teatru activ · control în dispută":"Nu a fost selectat în această campanie");
 return '<div class="arm-map-detail-head"><div><span class="dom-kicker">PHASE '+dEsc(phase)+' · STRATEGIC LOCATION</span><h3>'+dEsc(loc.name)+'</h3></div><span class="arm-map-control '+(control?'alliance-'+dEsc(control):isCurrent?'is-contested':'is-neutral')+'">'+dEsc(status)+'</span></div>'+
 '<p>'+dEsc(loc.loreTextRo||"")+'</p>'+
 '<div class="arm-map-bonus"><b>'+dEsc(loc.bonus&&loc.bonus.name||"Location Bonus")+'</b><span>'+dEsc(loc.bonus&&loc.bonus.summary||"")+'</span></div>'+
 '<div class="arm-map-rules"><b>War Zone Rules</b><ul>'+(loc.warZoneRules||[]).map(function(r){return '<li><strong>'+dEsc(r.name)+'</strong> — '+dEsc(r.summary)+'</li>'}).join("")+'</ul></div>'+
 (rec?'<small class="arm-map-history">Faza încheiată · '+dEsc(rec.controlMethod||"Control stabilit la finalul fazei")+'</small>':isCurrent?'<small class="arm-map-history">Locația curentă a campaniei · D6 '+dEsc(c.locationRoll||"—")+'</small>':'');
}
function dRenderArmageddonMap(c){
 var locations=DOM_DATA.locations||[],used=(c.phaseHistory||[]).map(function(x){return x.locationId}),current=c.locationId;
 var pins=locations.map(function(loc){
  var xy=DOM_ARMAGEDDON_LAYOUT[loc.id]||{x:50,y:50},rec=dMapLocationRecord(c,loc.id),isCurrent=loc.id===current,owner=rec&&rec.controlAlliance;
  var cls=owner?"is-controlled alliance-"+owner:isCurrent?"is-current":"is-available";
  return '<button type="button" class="arm-map-pin '+cls+'" data-arm-location="'+dEsc(loc.id)+'" style="left:'+xy.x+'%;top:'+xy.y+'%" aria-label="'+dEsc(loc.name)+'"><span class="arm-map-pin-dot"></span><span class="arm-map-pin-label">'+dEsc(DOM_ARMAGEDDON_LAYOUT[loc.id].short)+'</span></button>';
 }).join("");
 var selected=dById(locations,current)||locations[0];
 var timeline=[1,2,3].map(function(ph){var rec=dMapPhaseRecord(c,ph),loc=rec?dById(locations,rec.locationId):null;return '<div class="arm-map-phase '+(Number(c.phase)===ph?'is-current':'')+'"><span>PHASE '+ph+'</span><b>'+(loc?dEsc(loc.name):"Awaiting theatre")+'</b><small>'+(rec?"Control: "+dEsc(dMapControlLabel(rec.controlAlliance)):(Number(c.phase)===ph?"Active · contested":"Not reached"))+'</small></div>'}).join("");
 return '<section class="dom-panel arm-map-section"><div class="dom-section-head"><div><span class="dom-kicker">THEATRE COMMAND · ARMAGEDDON PRIME & SECUNDUS</span><h3>Strategic War Map</h3></div><span class="arm-map-scale">SCHEMATIC · NOT TO SCALE</span></div>'+
 '<p class="arm-map-intro">Urmărește teatrele de operațiuni, locația fazei curente și controlul câștigat la încheierea fiecărei faze.</p>'+
 '<div class="arm-map-legend"><span><i class="pin-current"></i> Locație activă</span><span><i class="pin-imperium"></i> Liberators</span><span><i class="pin-orks"></i> Oppressors</span><span><i class="pin-raiders"></i> Raiders</span><span><i class="pin-neutral"></i> Nealocat</span></div>'+
 '<div class="arm-map-canvas"><img class="arm-map-art" src="images/armageddon-dominatus-map.jpg" alt="Hartă geografică Armageddon fără marcaje de campanie" loading="lazy">'+pins+'</div>'+
 '<div class="arm-map-detail" id="armMapDetail">'+dMapLocationDetail(c,selected)+'</div>'+
 '<div class="arm-map-phase-history">'+timeline+'</div>'+
 '<p class="arm-map-footnote">Pozițiile pinurilor sunt orientative, pentru navigarea în campanie; harta este o schemă strategică originală, nu o reproducere cartografică oficială Games Workshop.</p></section>';
}
async function dResolvePhaseControl(c,phase){
 var snap=await App.db.collection(DOM_COLL).doc(c.id).collection("rewards").get(),allRows=snap.docs.map(function(x){return x.data()}),pending=allRows.filter(function(x){return x.category==="Battle Honour"&&Number(x.phase)===Number(phase)&&x.status==="pending"}),rows=allRows.filter(function(x){return x.category==="Battle Honour"&&x.status==="selected"});
 if(pending.length){alert("Nu poți încheia faza: există "+pending.length+" Battle Honour draw(s) care nu au fost încă selectate de jucători.");return null}
 var tally={},total={};
 (c.players||[]).forEach(function(p){tally[p.alliance]=tally[p.alliance]||0;total[p.alliance]=total[p.alliance]||0});
 var seen={};
 rows.forEach(function(r){var a=dPlayer(c,r.playerId).alliance;if(!a)return;var key=r.playerId+"|"+r.selectedCardId;if(seen[key])return;seen[key]=true;total[a]=(total[a]||0)+1;if(Number(r.phase)===Number(phase))tally[a]=(tally[a]||0)+1});
 Object.keys(c.upgrades||{}).forEach(function(pid){var a=dPlayer(c,pid).alliance;(c.upgrades[pid]||[]).filter(function(u){return u.type==="Battle Honour"}).forEach(function(u){var key=pid+"|"+u.id;if(seen[key])return;seen[key]=true;total[a]=(total[a]||0)+1;if(Number(u.phase||1)===Number(phase))tally[a]=(tally[a]||0)+1})});
 var max=Math.max.apply(null,Object.keys(tally).map(function(a){return tally[a]}).concat([0])),leaders=Object.keys(tally).filter(function(a){return tally[a]===max});
 var method="Cele mai multe Battle Honours în Phase "+phase;
 if(leaders.length>1){
  var maxTotal=Math.max.apply(null,leaders.map(function(a){return total[a]||0}));leaders=leaders.filter(function(a){return (total[a]||0)===maxTotal});
  if(leaders.length===1)method+=" · departajare după totalul campaniei";
  else{
   var choice=prompt("Egalitate și după totalul Battle Honours. Warmaster, alege alianța care controlează locația:\\n"+leaders.join(", "));
   if(!choice||leaders.indexOf(choice.trim().toLowerCase())<0){alert("Nu ai selectat o alianță validă. Faza nu poate fi închisă.");return null}
   leaders=[choice.trim().toLowerCase()];method+=" · decizie Warmaster";
  }
 }
 return {controlAlliance:leaders[0]||"",controlMethod:method,controlBattleHonours:tally,totalBattleHonours:total};
}
function dRenderDetail(c){
 var el=document.getElementById("domApp"),isAdmin=App.isAdmin,mine=(c.players||[]).filter(function(p){return p.id===App.me})[0],loc=dLocation(c);
 if(!isAdmin&&!mine){el.innerHTML='<p class="err">Nu faci parte din această campanie.</p>';return}
 var h='<a class="dom-back" href="dominatus.html">← Campaign Archive</a><section class="dom-hero"><div class="dom-hero-top"><span class="dom-kicker">WAR FOR THE IMPERIUM · DOMINATUS</span><span class="dom-status '+(c.status==="active"?"is-active":"")+'">'+dStatus(c.status)+'</span></div><h2>'+dEsc(c.name)+'</h2><div class="dom-hero-stats"><div><small>CAMPAIGN PHASE</small><b>'+dEsc(c.phase||1)+' / 3</b><span>'+dEsc(dPhaseName(c.phase||1))+'</span></div><div><small>THEATRE OF WAR</small><b>'+(loc?dEsc(loc.name):"Not selected")+'</b><span>'+(c.locationRoll?"D6 roll: "+dEsc(c.locationRoll):"Awaiting location")+'</span></div><div><small>FORCES</small><b>'+dEsc((c.players||[]).length)+' players</b><span>'+dEsc(Object.keys(c.agendaAchieved||{}).reduce(function(a,k){return a+(c.agendaAchieved[k]||0)},0))+' Agenda Achieved</span></div></div></section>';
 h+=dRenderArmageddonMap(c);
 h+=dRenderRandomApproval(c);
 if(!isAdmin&&c.phaseStatus==="setup")h+='<section class="dom-panel"><b>Phase în curs de configurare</b><p>Warmaster verifică selecțiile aleatorii înainte de activarea fazei.</p></section>';
 if(isAdmin)h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">WARMASTER CONTROL</span><h3>Campaign Administration</h3></div><span class="dom-admin-mark">ADMIN</span></div><div class="dom-admin-actions"><button id="domRollLocation" class="ghost">Roll / reroll location</button><button id="domNextPhase" class="ghost">Advance phase</button><button id="domToggleStatus" class="ghost" '+(c.phaseStatus==="setup"?"disabled":"")+'>'+(c.status==="active"?"Închide campania":"Reactivează campania")+'</button><button id="domDeleteCampaignDetail" class="ghost">Șterge campania</button></div><p class="dom-muted">Warmaster este contul Admin existent al JoiHammer. Administrarea Dominatus nu creează un rol global nou.</p></section>';
 if(loc)h+='<section class="dom-location"><div class="dom-section-head"><div><span class="dom-kicker">CURRENT WAR ZONE</span><h3>'+dEsc(loc.name)+'</h3></div><span class="dom-dice">D6 · '+dEsc(c.locationRoll||"—")+'</span></div><p>'+dEsc(loc.loreTextRo||"")+'</p><div class="dom-bonus"><b>'+dEsc(loc.bonus&&loc.bonus.name||"Location bonus")+'</b><span>'+dEsc(loc.bonus&&loc.bonus.summary||"")+'</span></div><h4>War Zone Rules</h4><div class="dom-rule-grid">'+(loc.warZoneRules||[]).map(function(r){return '<article><b>'+dEsc(r.name)+'</b><p>'+dEsc(r.summary)+'</p></article>'}).join("")+'</div></section>';
 h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">ALLIANCE INTELLIGENCE</span><h3>Briefings & Agendas</h3></div></div>';
 var alliances=[]; (c.players||[]).forEach(function(p){if(alliances.indexOf(p.alliance)<0)alliances.push(p.alliance)});
 alliances.forEach(function(a){var b=dBriefing(a,c.phase||1),ag=dAgendaOptions(a,c.phase||1);if(!b)return;h+='<details class="dom-briefing" '+(mine&&mine.alliance===a?'open':'')+'><summary><b>'+dEsc(dAllianceName(a))+'</b><span>'+ag.length+' Agendas · Phase '+dEsc(c.phase||1)+'</span></summary><p class="dom-lore">'+dEsc(b.loreTextRo||b.narrativeSummary||"")+'</p><p class="dom-muted">'+dEsc(b.strategicObjective||"")+'</p><div class="dom-agenda-grid">'+ag.map(function(x){return '<article><span class="dom-kicker">AGENDA</span><h4>'+dEsc(x.name)+'</h4><p>'+dEsc(x.loreTextRo||"")+'</p><b>Agenda Achieved</b><ul>'+((x.agendaAchieved||[]).map(function(q){return '<li>'+dEsc((q.any||[]).join(" OR "))+'</li>'}).join(""))+'</ul><details><summary>Primary Mission scoring</summary><ul>'+((x.primaryMission&&x.primaryMission.scoring)||[]).map(function(q){return '<li><b>'+dEsc(q.vp)+' VP</b> · '+dEsc(q.when)+' — '+dEsc(q.condition)+'</li>'}).join("")+'</ul></details></article>'}).join("")+'</div><p class="dom-matrix-note">Selecția automată după Force Disposition este dezactivată până la verificarea exactă a celulelor matricei. Warmaster-ul confirmă Agenda manual folosind Briefing-ul oficial.</p></details>'});
 h+='</section>';
 h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">BATTLE OPERATIONS</span><h3>Battles</h3></div>'+(isAdmin&&c.phaseStatus==="active"?'<div class="dom-actions"><button id="domGeneratePhaseMatches" class="ghost">🎲 Generează meciurile fazei</button><button id="domAddBattle" class="primary">＋ Programează meci</button></div>':'')+'</div>';
 if(isAdmin)h+='<div id="domBattleForm" class="dom-battle-form" hidden><div class="dom-form-grid"><label class="opt">Player A<select id="domBattleA">'+(c.players||[]).map(function(p){return '<option value="'+dEsc(p.id)+'">'+dEsc(p.id)+' · '+dEsc(dAllianceName(p.alliance))+'</option>'}).join("")+'</select></label><label class="opt">Player B<select id="domBattleB">'+(c.players||[]).map(function(p){return '<option value="'+dEsc(p.id)+'">'+dEsc(p.id)+' · '+dEsc(dAllianceName(p.alliance))+'</option>'}).join("")+'</select></label><label class="opt">Agenda A<select id="domAgendaA"></select></label><label class="opt">Agenda B<select id="domAgendaB"></select></label><label class="opt">Battle Size<select id="domBattleSize"><option>Strike Force</option><option>Incursion</option><option>Onslaught</option></select></label></div><p class="dom-muted">Program implicit: 2 battles/player în Phase 1, 2 în Phase 2 și o bătălie finală în Phase 3. Warmaster poate ajusta numărul și dimensiunea în limitele regulilor. Agendele sunt selectate manual pe baza Briefing-ului și a Force Dispositions. Dacă un jucător refuză Agenda, alege „Chapter Approved / no Agenda”.</p><div class="dom-actions"><button id="domSaveBattle" class="primary">Salvează meciul</button><button id="domCancelBattle" class="ghost">Anulează</button></div></div>';
 var battles=c.battles||[];
 h+='<div class="dom-battle-list">'+(battles.map(function(b){var pa=dPlayer(c,b.a),pb=dPlayer(c,b.b),aa=dAgenda(b.agendaA),ab=dAgenda(b.agendaB);return '<article class="dom-battle-card"><div class="dom-battle-top"><span class="dom-kicker">PHASE '+dEsc(b.phase)+(b.round?' · ROUND '+dEsc(b.round):'')+' · '+dEsc(b.battleSize||"Strike Force")+(b.generated?' · AUTO':'')+'</span><span class="dom-status '+(b.status==="completed"?"is-active":"")+'">'+(b.status==="completed"?"Completed":"Scheduled")+'</span></div><div class="dom-versus"><b>'+dEsc(b.a)+'</b><span>VS</span><b>'+dEsc(b.b)+'</b></div><div class="dom-battle-agendas"><span>'+dEsc(aa?aa.name:"Chapter Approved / no Agenda")+'</span><span>'+dEsc(ab?ab.name:"Chapter Approved / no Agenda")+'</span></div>'+(b.matchId?'<a class="dom-open-match" href="match.html?id='+encodeURIComponent(b.matchId)+'">Deschide meciul ↗</a>':'<span class="dom-muted">Match disponibil după aprobarea fazei.</span>')+(b.status==="completed"?'<p class="dom-muted">Winner: '+dEsc(b.winner==="draw"?"Draw":b.winner)+' · '+dEsc(b.scoreA||0)+' – '+dEsc(b.scoreB||0)+'</p>':'')+((!b.matchId&&!isAdmin&&mine&&(mine.id===b.a||mine.id===b.b)&&b.status!=="completed")?'<button class="ghost sm" data-dom-report="'+dEsc(b.id)+'">Raportează rezultatul</button>':'')+(isAdmin&&b.status!=="completed"?'<button class="ghost sm" data-dom-delete-battle="'+dEsc(b.id)+'">Șterge meciul</button>':'')+'</article>'}).join("")||'<p class="empty">Nu au fost programate meciuri.</p>')+'</div><div id="domReportForm"></div></section>';
 h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">ORDER OF BATTLE</span><h3>Players & Alliances</h3></div></div><div class="dom-roster">'+(c.players||[]).map(function(p){var achieved=(c.agendaAchieved||{})[p.id]||0,ups=(c.upgrades||{})[p.id]||[],earned=DOM_REWARDS.filter(function(r){return r.playerId===p.id&&r.status==='selected'});return '<article><div><b>'+dEsc(p.id)+'</b><small>'+dEsc(p.army||"Army not configured")+' · '+dEsc((c.forceDispositions||{})[p.id]||p.fd||"Force Disposition not set")+'</small></div><span class="dom-alliance '+dEsc(p.alliance)+'">'+dEsc(dAllianceName(p.alliance))+'</span><span class="dom-count">'+achieved+'/3 Agenda Achieved</span><small>'+(ups.length+earned.length)+' upgrades</small></article>'}).join("")+'</div></section>';
 h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">STRATEGIC OVERVIEW</span><h3>Alliance Standings</h3></div></div><div class="dom-standings">'+alliances.map(function(a){var members=(c.players||[]).filter(function(p){return p.alliance===a}),ach=members.reduce(function(n,p){return n+((c.agendaAchieved||{})[p.id]||0)},0),honours=members.reduce(function(n,p){return n+(((c.upgrades||{})[p.id]||[]).filter(function(u){return u.type==="Battle Honour"&&Number(u.phase||c.phase)===Number(c.phase)}).length)+DOM_REWARDS.filter(function(r){return r.playerId===p.id&&r.category==="Battle Honour"&&r.status==="selected"&&Number(r.phase)===Number(c.phase)}).length},0);return '<article><b>'+dEsc(dAllianceName(a))+'</b><span>'+ach+' Agenda Achieved</span><span>'+honours+' Battle Honours this phase</span></article>'}).join("")+'</div><p class="dom-muted">Ascendancy: alianța cu cele mai multe Agenda Achieved în faza curentă. Controlul locației: alianța cu cele mai multe Battle Honours câștigate în fază; egalitățile se rezolvă după totalul campaniei, apoi de Warmaster.</p></section>';
 h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">CAMPAIGN PROGRESSION</span><h3>Campaign Deck & Rewards</h3></div></div><div id="domRewardDecks"><p class="empty">Se încarcă pachetele de cărți…</p></div>'; 
 (c.players||[]).forEach(function(p){var ups=(c.upgrades||{})[p.id]||[],earned=DOM_REWARDS.filter(function(r){return r.playerId===p.id&&r.status==='selected'}).map(function(r){return {name:r.selectedCardName||r.selectedCardId,type:r.category,unit:r.assignedUnit}});var all=ups.concat(earned);h+='<div class="dom-upgrade-player"><b>'+dEsc(p.id)+'</b><div>'+(all.map(function(u){return '<span class="dom-upgrade-chip">'+dEsc(u.name)+' <small>· '+dEsc(u.type)+(u.unit?' · '+dEsc(u.unit):'')+'</small></span>'}).join("")||'<span class="dom-muted">No upgrades recorded yet.</span>')+'</div></div>'});
 if(isAdmin)h+='<div class="dom-admin-actions"><button id="domGrantUpgrade" class="ghost">Admin override · acordă manual</button></div><div id="domUpgradeForm" hidden class="dom-battle-form"><div class="dom-form-grid"><label class="opt">Jucător<select id="domUpgradePlayer">'+(c.players||[]).map(function(p){return '<option value="'+dEsc(p.id)+'">'+dEsc(p.id)+'</option>'}).join("")+'</select></label><label class="opt">Categorie<select id="domUpgradeType"><option value="Battle Honour">Battle Honour</option><option value="Battle Skill">Battle Skill</option><option value="Relic">Relic</option><option value="Path to Conquest">Path to Conquest</option></select></label><label class="opt">Carte<select id="domUpgradeCard"></select></label></div><label class="opt">Unitate / model (opțional)<input id="domUpgradeUnit" maxlength="100" placeholder="Unitatea care primește upgrade-ul"></label><button id="domSaveUpgrade" class="primary">Acordă upgrade</button></div>';
 h+='</section>';
 if(isAdmin)h+='<section class="dom-panel"><div class="dom-section-head"><div><span class="dom-kicker">SUBMITTED BATTLE REPORTS</span><h3>Reports awaiting validation</h3></div></div><div id="domReports"><p class="empty">Se verifică rapoartele…</p></div></section>';
 el.innerHTML=h;
 el.querySelectorAll("[data-arm-location]").forEach(function(pin){pin.onclick=function(){var id=pin.getAttribute("data-arm-location"),loc=dById(DOM_DATA.locations,id),panel=document.getElementById("armMapDetail");el.querySelectorAll("[data-arm-location]").forEach(function(x){x.classList.toggle("is-selected",x===pin)});if(panel)panel.innerHTML=dMapLocationDetail(c,loc)}});
 var initialPin=c.locationId?el.querySelector('[data-arm-location="'+c.locationId+'"]'):null;if(initialPin)initialPin.classList.add("is-selected");
 dLoadRewards(c);
 if(isAdmin){var approve=document.getElementById("domApproveSetup");if(approve)approve.onclick=function(){dApproveRandomSetup(c)};var reroll=document.getElementById("domRerollSetup");if(reroll)reroll.onclick=function(){dRerollRandomSetup(c)};document.getElementById("domRollLocation").onclick=function(){dRollLocation(c)};document.getElementById("domNextPhase").onclick=function(){dAdvancePhase(c)};document.getElementById("domToggleStatus").onclick=function(){dUpdateCampaign(c,{status:c.status==="active"?"completed":"active"})};var delCampaign=document.getElementById("domDeleteCampaignDetail");if(delCampaign)delCampaign.onclick=function(){dDeleteCampaign(c.id)};var addBattle=document.getElementById("domAddBattle");if(addBattle)addBattle.onclick=function(){var f=document.getElementById("domBattleForm");f.hidden=!f.hidden;dRefreshAgendaSelects(c)};var genMatches=document.getElementById("domGeneratePhaseMatches");if(genMatches)genMatches.onclick=function(){dGeneratePhaseMatches(c,false)};document.querySelectorAll("[data-dom-delete-battle]").forEach(function(b){b.onclick=function(){dDeleteScheduledBattle(c,b.getAttribute("data-dom-delete-battle"))}});document.getElementById("domCancelBattle").onclick=function(){document.getElementById("domBattleForm").hidden=true};document.getElementById("domBattleA").onchange=function(){dRefreshAgendaSelects(c)};document.getElementById("domBattleB").onchange=function(){dRefreshAgendaSelects(c)};document.getElementById("domSaveBattle").onclick=function(){dSaveBattle(c)};document.getElementById("domGrantUpgrade").onclick=function(){var f=document.getElementById("domUpgradeForm");f.hidden=!f.hidden;dRefreshUpgradeCards(c)};document.getElementById("domUpgradeType").onchange=function(){dRefreshUpgradeCards(c)};document.getElementById("domSaveUpgrade").onclick=function(){dSaveUpgrade(c)};dLoadReports(c)}
 else {document.querySelectorAll("[data-dom-report]").forEach(function(b){b.onclick=function(){dShowReportForm(c,b.getAttribute("data-dom-report"))}})}
}
function dRefreshAgendaSelects(c){
 ["A","B"].forEach(function(side){var who=document.getElementById("domBattle"+side).value,p=dPlayer(c,who),sel=document.getElementById("domAgenda"+side),opts=dAgendaOptions(p.alliance,c.phase||1),suggested=(c.agendaSelections||{})[who];sel.innerHTML='<option value="">Chapter Approved / no Agenda</option>'+opts.map(function(a){return '<option value="'+dEsc(a.id)+'" '+(a.id===suggested?'selected':'')+'>'+dEsc(a.name)+(a.id===suggested?' · Random':'')+'</option>'}).join("")});
}
async function dSaveBattle(c){
 var a=document.getElementById("domBattleA").value,b=document.getElementById("domBattleB").value;
 if(!a||!b||a===b){alert("Alege doi jucători diferiți.");return}
 var battles=(c.battles||[]).slice(),id="battle_"+Date.now();
 battles.push({id:id,phase:Number(c.phase||1),a:a,b:b,agendaA:document.getElementById("domAgendaA").value||"",agendaB:document.getElementById("domAgendaB").value||"",locationId:c.locationId||"",battleSize:document.getElementById("domBattleSize").value||"Strike Force",status:"scheduled",createdAt:Date.now()});
 battles=await dEnsureCampaignMatchDocs(c,battles);
 await dUpdateCampaign(c,{battles:battles});
}
async function dRollLocation(c){
 var r=dRandomLocation(c.phase||1);if(!r.location){alert("Nu există locații definite pentru faza curentă.");return}
 if(!confirm("Aruncare D6: "+r.roll+"\\nLocație: "+r.location.name+"\\nConfirmi?"))return;
 await dUpdateCampaign(c,{locationId:r.location.id,locationRoll:r.roll});
}
async function dRerollRandomSetup(c){
 var phase=Number(c.phase||1),loc=dRandomLocation(phase);
 await dUpdateCampaign(c,{locationId:loc.location?loc.location.id:"",locationRoll:loc.roll,agendaSelections:dRandomAgendaAssignments(c.players,phase),forceDispositions:dRandomForceDispositions(c.players)});
}
async function dApproveRandomSetup(c){
 var locationId=(document.getElementById("domApproveLocation")||{}).value||c.locationId;
 var agendas=Object.assign({},c.agendaSelections||{}),fds=Object.assign({},c.forceDispositions||{});
 document.querySelectorAll("[data-dom-agenda-choice]").forEach(function(x){agendas[x.getAttribute("data-dom-agenda-choice")]=x.value||""});
 document.querySelectorAll("[data-dom-fd-choice]").forEach(function(x){fds[x.getAttribute("data-dom-fd-choice")]=x.value});
 var oldBattles=(c.battles||[]).filter(function(b){return Number(b.phase)!==Number(c.phase)||b.status==="completed"}),generated=dBuildPhaseMatches(Object.assign({},c,{locationId:locationId,agendaSelections:agendas}),Number(c.phase||1),oldBattles);
 var phaseBattles=await dEnsureCampaignMatchDocs(Object.assign({},c,{locationId:locationId,agendaSelections:agendas,forceDispositions:fds}),oldBattles.concat(generated));
 await dUpdateCampaign(c,{locationId:locationId,agendaSelections:agendas,forceDispositions:fds,battles:phaseBattles,status:"active",phaseStatus:"active",approvedAt:firebase.firestore.FieldValue.serverTimestamp(),approvedBy:App.me});
}
async function dAdvancePhase(c){
 if(c.phaseStatus!=="active"){alert("Aprobă mai întâi configurarea aleatorie a fazei curente.");return}
 var phase=Number(c.phase||1),control=await dResolvePhaseControl(c,phase);if(!control)return;
 if(phase>=3){
  if(!confirm("Phase 3 este finalul campaniei. Locația "+(dLocation(c)?dLocation(c).name:"curentă")+" va fi marcată ca fiind controlată de "+dAllianceName(control.controlAlliance)+". Marchezi campania ca încheiată?"))return;
  var finalHistory=(c.phaseHistory||[]).slice();
  finalHistory.push({phase:phase,locationId:c.locationId,locationRoll:c.locationRoll,controlAlliance:control.controlAlliance,controlMethod:control.controlMethod,controlBattleHonours:control.controlBattleHonours,totalBattleHonours:control.totalBattleHonours,agendaAchieved:Object.assign({},c.agendaAchieved||{}),closedAt:Date.now()});
  await dUpdateCampaign(c,{phaseHistory:finalHistory,status:"completed",phaseStatus:"completed"});
  return;
 }
 var relicSummary=(c.players||[]).map(function(p){return p.id+": "+((c.agendaAchieved||{})[p.id]||0)+" Relics de tras"}).join("\\n");
 if(!confirm("Închei Phase "+phase+" și treci la Phase "+(phase+1)+"?\\n\\nControlul locației: "+dAllianceName(control.controlAlliance)+".\\n\\nTragerile de Relics:\\n"+relicSummary+"\\n\\nAgenda Achieved din faza curentă va fi arhivată și resetată."))return;
 var next=phase+1,r=dRandomLocation(next),hist=(c.phaseHistory||[]).slice(),agendaSelections=dRandomAgendaAssignments(c.players,next),forceDispositions=dRandomForceDispositions(c.players);
 try{await dCreatePhaseRelicDraws(c)}catch(e){fail(e);return}
 hist.push({phase:phase,locationId:c.locationId,locationRoll:c.locationRoll,controlAlliance:control.controlAlliance,controlMethod:control.controlMethod,controlBattleHonours:control.controlBattleHonours,totalBattleHonours:control.totalBattleHonours,agendaAchieved:Object.assign({},c.agendaAchieved||{}),upgradesByPlayer:Object.keys(c.upgrades||{}).reduce(function(o,k){o[k]=(c.upgrades[k]||[]).filter(function(u){return Number(u.phase||1)===phase}).length;return o},{}),closedAt:Date.now()});
 await dUpdateCampaign(c,{phase:next,phaseStatus:"setup",status:"setup",locationId:r.location?r.location.id:"",locationRoll:r.roll,agendaSelections:agendaSelections,forceDispositions:forceDispositions,phaseHistory:hist,agendaAchieved:{}});
}
async function dUpdateCampaign(c,patch){
 try{await App.db.collection(DOM_COLL).doc(c.id).update(Object.assign(patch,{updatedAt:firebase.firestore.FieldValue.serverTimestamp()}))}catch(e){fail(e)}
}
function dShowReportForm(c,battleId){
 var b=(c.battles||[]).filter(function(x){return x.id===battleId})[0];if(!b)return;
 var own=App.me===b.a?"a":"b",opp=own==="a"?b.b:b.a;
 document.getElementById("domReportForm").innerHTML='<div class="dom-battle-form"><h4>Battle Report · '+dEsc(b.a)+' vs '+dEsc(b.b)+'</h4><div class="dom-form-grid"><label class="opt">Winner<select id="domReportWinner"><option value="'+dEsc(b.a)+'">'+dEsc(b.a)+'</option><option value="'+dEsc(b.b)+'">'+dEsc(b.b)+'</option><option value="draw">Draw</option></select></label><label class="opt">Your VP<input id="domReportVP" type="number" min="0" max="100" value="0"></label><label class="opt">Opponent VP<input id="domReportOppVP" type="number" min="0" max="100" value="0"></label></div><label class="dom-check"><input id="domReportAchieved" type="checkbox"> Am îndeplinit condiția Agenda Achieved pentru Agenda mea.</label><label class="opt">Note (opțional)<textarea id="domReportNotes" rows="2" maxlength="500"></textarea></label><button id="domSubmitReport" class="primary">Trimite raportul</button></div>';
 document.getElementById("domSubmitReport").onclick=async function(){
  var vp=Number(document.getElementById("domReportVP").value),ovp=Number(document.getElementById("domReportOppVP").value);
  if(vp<0||ovp<0||vp>100||ovp>100){alert("Scorul trebuie să fie între 0 și 100.");return}
  var ref=App.db.collection(DOM_COLL).doc(c.id).collection("reports").doc(battleId+"_"+App.me);
  try{await ref.set({battleId:battleId,playerId:App.me,playerA:b.a,playerB:b.b,opponent:opp,winner:document.getElementById("domReportWinner").value,score:vp,opponentScore:ovp,agendaAchieved:document.getElementById("domReportAchieved").checked,notes:document.getElementById("domReportNotes").value||"",status:"pending",submittedAt:firebase.firestore.FieldValue.serverTimestamp()});document.getElementById("domReportForm").innerHTML='<p class="dom-success">Raport trimis către Warmaster pentru validare.</p>'}catch(e){fail(e)}
 };
}
async function dLoadReports(c){
 var el=document.getElementById("domReports");if(!el)return;
 try{
  var snap=await App.db.collection(DOM_COLL).doc(c.id).collection("reports").where("status","==","pending").get();
  DOM_REPORTS=snap.docs.map(function(d){return Object.assign({id:d.id},d.data())});
  el.innerHTML=DOM_REPORTS.map(function(r){var battle=(c.battles||[]).filter(function(x){return x.id===r.battleId})[0]||{},ra=DOM_REPORTS.filter(function(x){return x.battleId===r.battleId&&x.playerId===battle.a})[0],rb=DOM_REPORTS.filter(function(x){return x.battleId===r.battleId&&x.playerId===battle.b})[0];return '<article class="dom-report-card"><b>'+dEsc(r.playerId)+'</b> vs '+dEsc(r.opponent)+'<p>'+dEsc(r.score)+' – '+dEsc(r.opponentScore)+' · Winner: '+dEsc(r.winner)+'</p><p class="dom-muted">'+dEsc(r.notes||"")+'</p><div class="dom-report-achievements"><b>Warmaster validation · Agenda Achieved</b><label class="dom-check"><input type="checkbox" id="domAchievedA_'+dEsc(r.id)+'" '+(ra&&ra.agendaAchieved?'checked':'')+'> '+dEsc(battle.a||'Player A')+'</label><label class="dom-check"><input type="checkbox" id="domAchievedB_'+dEsc(r.id)+'" '+(rb&&rb.agendaAchieved?'checked':'')+'> '+dEsc(battle.b||'Player B')+'</label></div><button class="primary sm" data-dom-approve="'+dEsc(r.id)+'">Validează raportul și recompensele</button> <button class="ghost sm" data-dom-reject="'+dEsc(r.id)+'">Respinge</button></article>'}).join("")||'<p class="empty">Nu există rapoarte în așteptare.</p>';
  el.querySelectorAll("[data-dom-approve]").forEach(function(b){b.onclick=function(){dApproveReport(c,b.getAttribute("data-dom-approve"))}});
  el.querySelectorAll("[data-dom-reject]").forEach(function(b){b.onclick=function(){dRejectReport(c,b.getAttribute("data-dom-reject"))}});
 }catch(e){el.innerHTML='<p class="err">Nu pot încărca rapoartele: '+dEsc(e.message||e)+'</p>'}
}
async function dApproveReport(c,reportId){
 var r=DOM_REPORTS.filter(function(x){return x.id===reportId})[0];if(!r)return;
 var battles=(c.battles||[]).slice(),idx=battles.findIndex(function(b){return b.id===r.battleId});if(idx<0){alert("Meciul nu mai există.");return}
 var b=Object.assign({},battles[idx]),other=(r.playerId===b.a?b.b:b.a);
 if(b.status==="completed"){alert("Meciul a fost deja validat. Respinge raportul duplicat sau corectează rezultatul ca Warmaster.");return}
 if(!confirm("Validezi raportul "+r.playerId+" vs "+r.opponent+"?"))return;
 var achievedA=!!((document.getElementById("domAchievedA_"+reportId)||{}).checked),achievedB=!!((document.getElementById("domAchievedB_"+reportId)||{}).checked);
 if(!document.getElementById("domAchievedA_"+reportId)&&r.playerId===b.a)achievedA=!!r.agendaAchieved;
 if(!document.getElementById("domAchievedB_"+reportId)&&r.playerId===b.b)achievedB=!!r.agendaAchieved;
 b.status="completed";b.winner=r.winner;b.scoreA=r.playerId===b.a?r.score:r.opponentScore;b.scoreB=r.playerId===b.b?r.score:r.opponentScore;b.reports=DOM_REPORTS.filter(function(x){return x.battleId===r.battleId}).map(function(x){return x.playerId});b.completedAt=Date.now();b.agendaAchieved={};b.agendaAchieved[b.a]=achievedA;b.agendaAchieved[b.b]=achievedB;battles[idx]=b;
 var achievements=Object.assign({},c.agendaAchieved||{}),earned={};
 [[b.a,achievedA],[b.b,achievedB]].forEach(function(pair){var pid=pair[0],achieved=pair[1];if(achieved&&(achievements[pid]||0)<3){achievements[pid]=Math.min(3,(achievements[pid]||0)+1);earned[pid]=true;}});
 var updates={battles:battles,agendaAchieved:achievements};
 try{
  await dCreateBattleRewards(c,b,r,earned);
  await App.db.collection(DOM_COLL).doc(c.id).update(Object.assign(updates,{updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
  var reportsToClose=DOM_REPORTS.filter(function(x){return x.battleId===r.battleId});
  await Promise.all(reportsToClose.map(function(x){return App.db.collection(DOM_COLL).doc(c.id).collection("reports").doc(x.id).update({status:x.id===reportId?"approved":"merged",approvedBy:App.me,approvedAt:firebase.firestore.FieldValue.serverTimestamp(),mergedInto:reportId})}));
  alert("Raport validat. Agendas Achieved au fost confirmate pentru ambii jucători, iar cărțile au fost trase automat conform regulilor Dominatus.");
 }catch(e){fail(e)}
}
async function dRejectReport(c,reportId){
 try{await App.db.collection(DOM_COLL).doc(c.id).collection("reports").doc(reportId).update({status:"rejected",reviewedBy:App.me,reviewedAt:firebase.firestore.FieldValue.serverTimestamp()});dLoadReports(c)}catch(e){fail(e)}
}
function dRefreshUpgradeCards(c){
 var type=document.getElementById("domUpgradeType").value,player=document.getElementById("domUpgradePlayer").value,p=dPlayer(c,player),cards=[];
 if(type==="Battle Honour")cards=(DOM_DATA.battleHonours||[]).filter(function(x){return Number(x.phase)===Number(c.phase)});
 else if(type==="Battle Skill")cards=DOM_DATA.battleSkills||[];
 else if(type==="Relic")cards=(DOM_DATA.relics||[]).filter(function(x){return !x.alliance||x.alliance===p.alliance});
 else cards=[{id:"path_to_conquest",name:"Path to Conquest",effect:"Recompensa finală pentru câștigătorul Phase 3."}];
 var sel=document.getElementById("domUpgradeCard");sel.innerHTML=cards.map(function(x){return '<option value="'+dEsc(x.id)+'">'+dEsc(x.name)+'</option>'}).join("");
}
async function dSaveUpgrade(c){
 var who=document.getElementById("domUpgradePlayer").value,type=document.getElementById("domUpgradeType").value,id=document.getElementById("domUpgradeCard").value,unit=document.getElementById("domUpgradeUnit").value||"";
 var source=type==="Battle Honour"?DOM_DATA.battleHonours:type==="Battle Skill"?DOM_DATA.battleSkills:type==="Relic"?DOM_DATA.relics:[{id:"path_to_conquest",name:"Path to Conquest",effect:"Recompensa finală."}],card=dById(source,id);if(!card)return;
 var ups=Object.assign({},c.upgrades||{}),arr=(ups[who]||[]).slice();
 if(arr.some(function(x){return x.id===id})||dSelectedRewardIds(who).indexOf(id)>=0){alert("Acest upgrade este deja înregistrat pentru jucător.");return}
 if(unit&&(dSelectedUnitUsed(c,who,unit,"")||arr.some(function(x){return String(x.unit||"").trim().toLowerCase()===unit.trim().toLowerCase()}))){alert("Această unitate are deja un Upgrade.");return}
 if(card.who&&card.who.indexOf("Campaign card")<0&&!unit){alert("Introdu unitatea/modelul care primește Upgrade-ul.");return}
 arr.push({id:id,name:card.name,type:type,effect:card.effectRo||card.effect||"",unit:unit,phase:Number(c.phase||1),grantedAt:Date.now(),grantedBy:App.me});ups[who]=arr;
 try{await dUpdateCampaign(c,{upgrades:ups});document.getElementById("domUpgradeUnit").value="";alert("Upgrade acordat.")}catch(e){fail(e)}
}
function dBindReports(c){
 var q=App.db.collection(DOM_COLL).doc(c.id).collection("reports");
 q.where("playerId","==",App.me).onSnapshot(function(s){},function(){});
}
async function dSyncCampaignAccess(campaignId,data){
 if(!App.isAdmin)return;
 var players=data&&Array.isArray(data.players)?data.players:[];
 for(var i=0;i<players.length;i++){
  var playerId=players[i].id;if(!playerId)continue;
  var ref=App.db.collection("dominatusUsers").doc(playerId).collection("campaigns").doc(campaignId);
  try{var old=await ref.get();if(!old.exists)await ref.set({campaignId:campaignId,playerId:playerId,campaignName:data.name||"",createdAt:firebase.firestore.FieldValue.serverTimestamp()})}catch(e){console.warn("Dominatus access index:",e)}
 }
}
function dLoadCampaigns(){
 var id=new URLSearchParams(location.search).get("id");
 function render(campaigns){
  DOM_CAMPAIGNS=campaigns;
  if(id){var c=DOM_CAMPAIGNS.filter(function(x){return x.id===id})[0];if(c){DOM_CURRENT=c;dRenderDetail(c)}else document.getElementById("domApp").innerHTML='<p class="empty">Campania nu a fost găsită sau nu ai acces. Dacă este o campanie veche, cere Warmaster-ului să deschidă o dată arhiva pentru sincronizarea accesului.</p>'}
  else dRenderHome();
 }
 if(App.isAdmin){
  App.db.collection(DOM_COLL).onSnapshot(function(s){
   var campaigns=s.docs.map(function(d){var data=Object.assign({id:d.id},d.data());dSyncCampaignAccess(d.id,data);return data});
   render(campaigns);
  },function(e){fail(e);document.getElementById("domApp").innerHTML='<p class="err">Nu pot citi campaniile: '+dEsc(e.code||e.message||e)+'</p>'});
  return;
 }
 App.db.collection("dominatusUsers").doc(App.me).collection("campaigns").onSnapshot(async function(accessSnap){
  try{
   var docs=await Promise.all(accessSnap.docs.map(function(a){return App.db.collection(DOM_COLL).doc(a.id).get().then(function(d){return d.exists?Object.assign({id:d.id},d.data()):null}).catch(function(e){console.warn("Dominatus campaign read:",e);return null})}));
   render(docs.filter(Boolean));
  }catch(e){fail(e);document.getElementById("domApp").innerHTML='<p class="err">Nu pot încărca campaniile asociate contului: '+dEsc(e.code||e.message||e)+'</p>'}
 },function(e){fail(e);document.getElementById("domApp").innerHTML='<p class="err">Nu pot citi lista de campanii a contului: '+dEsc(e.code||e.message||e)+'</p>'});
}
App.start(function(){
 fetch("data/dominatus.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("data/dominatus.json: "+r.status);return r.json()}).then(function(d){DOM_DATA=d;dLoadCampaigns()}).catch(function(e){fail(e);document.getElementById("domApp").innerHTML='<p class="err">Biblioteca Dominatus nu s-a încărcat: '+dEsc(e.message)+'</p>'});
});
