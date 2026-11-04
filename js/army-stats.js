var MATCHES=[],filterType="all";
function blankStat(n){return {name:n,g:0,w:0,d:0,l:0,vf:0,va:0,players:{}}}
function pct(w,g){return g?Math.round(100*w/g)+"%":"—"}
function collectStats(){
 var A={},D={},used=0;
 MATCHES.filter(function(m){return m.status==="done"&&!m.wo&&(filterType==="all"||m.type===filterType)}).forEach(function(m){
  used++;
  ["a","b"].forEach(function(side){
   var other=side==="a"?"b":"a",snap=m["p"+side]||{},opp=m["p"+other]||{},army=(snap.army||"").trim(),det=(snap.det||"").trim();
   if(!army)return;
   var my=totalPS(Object.assign(newPS(),m["s"+side]||{})),their=totalPS(Object.assign(newPS(),m["s"+other]||{}));
   var outcome=m.winner===side?"w":m.winner==="draw"?"d":"l";
   function add(map,key){
    var r=map[key]||(map[key]=blankStat(key));r.g++;r[outcome]++;r.vf+=my;r.va+=their;
    var pn=m[side]||"Necunoscut";r.players[pn]=(r.players[pn]||0)+1;
   }
   add(A,army);if(det)add(D,army+"|||"+det);
  });
 });
 function rows(map){return Object.keys(map).map(function(k){var r=map[k];r.rate=r.g?r.w/r.g:0;r.avg=(r.vf/r.g);r.against=r.va/r.g;r.diff=(r.vf-r.va)/r.g;return r}).sort(function(a,b){return b.rate-a.rate||b.diff-a.diff||b.g-a.g})}
 return {armies:rows(A),dets:rows(D),used:used};
}
function statTable(rows,kind){
 if(!rows.length)return '<p class="empty">Nu există suficiente date pentru filtrul selectat.</p>';
 return '<div class="tblw"><table class="tbl"><thead><tr><th>#</th><th>'+(kind==="army"?"Facțiune":"Facțiune / Detachment")+'</th><th>Meciuri</th><th>V-E-Î</th><th>Win %</th><th>VP med. date</th><th>VP med. primite</th><th>Dif. medie</th></tr></thead><tbody>'+rows.map(function(r,i){
  var name=kind==="army"?r.name:r.name.replace("|||"," · ");
  return '<tr><td>'+(i+1)+'</td><td>'+esc(name)+'</td><td>'+r.g+'</td><td>'+r.w+'-'+r.d+'-'+r.l+'</td><td><b>'+pct(r.w,r.g)+'</b></td><td>'+r.avg.toFixed(1)+'</td><td>'+r.against.toFixed(1)+'</td><td>'+(r.diff>0?"+":"")+r.diff.toFixed(1)+'</td></tr>';
 }).join("")+'</tbody></table></div>';
}
function render(){
 var x=collectStats();
 $("summary").textContent=x.used+" meciuri eligibile în filtru · "+x.armies.length+" facțiuni · "+x.dets.length+" combinații facțiune/detachment.";
 $("armies").innerHTML=statTable(x.armies,"army");
 $("dets").innerHTML=statTable(x.dets,"det");
 document.querySelectorAll("#flt button").forEach(function(b){b.classList.toggle("on",b.dataset.f===filterType)});
}
App.start(function(){
 $("flt").addEventListener("click",function(e){var b=e.target.closest("button[data-f]");if(b){filterType=b.dataset.f;render()}});
 App.db.collection("matches").where("status","==","done").onSnapshot(function(s){MATCHES=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},fail);
});
