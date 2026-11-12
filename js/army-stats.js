var MATCHES=[],filterType="all",gameMode="40k",CP_NAMES={};
function setArmyStatsMode(mode){
 if(mode!=="40k"&&mode!=="cp")return;
 gameMode=mode;
 if(typeof render==="function")render();
}

function blankStat(n){return {name:n,g:0,w:0,d:0,l:0,vf:0,va:0,players:{}}}
function pct(w,g){return g?Math.round(100*w/g)+"%":"—"}
function isCP(m){return m.type==="combat-patrol"||m.type==="combat_patrol"||m.gameMode==="combat-patrol"||m.format==="combat-patrol"||m.combatPatrol===true}
function scoreFor(m,side){
 var ps=m["s"+side]||{};
 if(isCP(m))return (ps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+(Number(e.v)||0)},0);
 return totalPS(Object.assign(newPS(),ps));
}
function patrolName(m,side){
 var ps=m["s"+side]||{},id=ps.cpPatrolId||"";
 return CP_NAMES[id]||id||((m["p"+side]||{}).army)||"Patrolă necunoscută";
}
function collectStats(){
 var A={},D={},used=0;
 MATCHES.filter(function(m){
  return m.status==="done"&&!m.wo&&isCP(m)===(gameMode==="cp")&&(filterType==="all"||m.type===filterType);
 }).forEach(function(m){
  used++;
  ["a","b"].forEach(function(side){
   var other=side==="a"?"b":"a",snap=m["p"+side]||{},my=scoreFor(m,side),their=scoreFor(m,other);
   var outcome=m.winner===side?"w":m.winner==="draw"?"d":"l";
   var armyName=gameMode==="cp"?patrolName(m,side):(snap.army||"").trim();
   if(!armyName)return;
   function add(map,key){
    var r=map[key]||(map[key]=blankStat(key));r.g++;r[outcome]++;r.vf+=my;r.va+=their;
    var pn=m[side]||"Necunoscut";r.players[pn]=(r.players[pn]||0)+1;
   }
   add(A,armyName);
   var det=(snap.det||"").trim();
   if(gameMode==="40k"&&det)add(D,armyName+"|||"+det);
  });
 });
 function rows(map){return Object.keys(map).map(function(k){var r=map[k];r.rate=r.g?r.w/r.g:0;r.avg=r.vf/r.g;r.against=r.va/r.g;r.diff=(r.vf-r.va)/r.g;return r}).sort(function(a,b){return b.rate-a.rate||b.diff-a.diff||b.g-a.g})}
 return {armies:rows(A),dets:rows(D),used:used};
}
function statTable(rows,kind){
 if(!rows.length)return '<p class="empty">Nu există suficiente date pentru filtrul selectat.</p>';
 var cp=gameMode==="cp";
 return '<div class="tblw"><table class="tbl"><thead><tr><th>#</th><th>'+(kind==="army"?(cp?"Combat Patrol":"Facțiune"):"Facțiune / Detachment")+'</th><th>Meciuri</th><th>V-E-Î</th><th>Win %</th><th>VP med. date</th><th>VP med. primite</th><th>Dif. medie</th></tr></thead><tbody>'+rows.map(function(r,i){
  var name=kind==="army"?r.name:r.name.replace("|||"," · ");
  return '<tr><td>'+(i+1)+'</td><td>'+esc(name)+'</td><td>'+r.g+'</td><td>'+r.w+'-'+r.d+'-'+r.l+'</td><td><b>'+pct(r.w,r.g)+'</b></td><td>'+r.avg.toFixed(1)+'</td><td>'+r.against.toFixed(1)+'</td><td>'+(r.diff>0?"+":"")+r.diff.toFixed(1)+'</td></tr>';
 }).join("")+'</tbody></table></div>';
}
function render(){
 var x=collectStats(),cp=gameMode==="cp";
 $("summary").textContent=x.used+" meciuri eligibile în filtru · "+x.armies.length+(cp?" patrule":" facțiuni")+(cp?".":" · "+x.dets.length+" combinații facțiune/detachment.");
 $("armies").innerHTML=statTable(x.armies,"army");
 $("dets").innerHTML=cp?"":statTable(x.dets,"det");
 document.querySelector("main h2").textContent=cp?"Performanță pe Combat Patrol":"Performanță pe facțiune";
 var detHeading=document.querySelectorAll("main h2")[1];if(detHeading)detHeading.hidden=cp;
 document.querySelectorAll("#modeSwitch button").forEach(function(b){b.classList.toggle("on",b.dataset.mode===gameMode)});
 document.querySelectorAll("#flt button").forEach(function(b){b.classList.toggle("on",b.dataset.f===filterType)});
}
App.start(function(){
 document.querySelectorAll("#modeSwitch button[data-mode]").forEach(function(b){b.addEventListener("click",function(){setArmyStatsMode(b.getAttribute("data-mode"))})});
 $("flt").addEventListener("click",function(e){var b=e.target.closest("button[data-f]");if(b){filterType=b.dataset.f;render()}});
 fetch("data/combat-patrol-armamentarium.json",{cache:"no-cache"}).then(function(r){return r.ok?r.json():null}).then(function(data){
  if(data&&data.patrols)Object.keys(data.patrols).forEach(function(k){var p=data.patrols[k];CP_NAMES[k]=p.displayName||p.name;CP_NAMES[p.category+":"+p.id]=p.displayName||p.name;CP_NAMES[p.id]=p.displayName||p.name});
  App.db.collection("matches").where("status","==","done").onSnapshot(function(s){MATCHES=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},fail);
 }).catch(function(e){console.warn("Nu s-a putut încărca biblioteca Combat Patrol pentru statistici",e);App.db.collection("matches").where("status","==","done").onSnapshot(function(s){MATCHES=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},fail)});
});
