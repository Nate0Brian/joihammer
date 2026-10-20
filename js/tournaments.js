var T=[],MS={},adv={};

function tier(n){return n===2?"Finala":n===4?"Semifinale":n===8?"Sferturi":n===16?"Optimi de finală":"Runda de "+n}
function mkMatch(tid,ri,a,b,batch){
  var ref=App.db.collection("matches").doc();
  batch.set(ref,App.newMatch({type:"tournament",tid:tid,ri:ri,a:a,b:b,status:"active",pa:App.snap(a),pb:App.snap(b)}));
  return ref.id;
}
async function create(){
  var name=$("tn").value.trim(),sel=[].map.call(document.querySelectorAll("#tp input:checked"),function(x){return x.value});
  if(!name){alert("Dă un nume turneului.");return}
  if(sel.length<2){alert("Alege cel puțin 2 jucători.");return}
  var L=shuffle(sel),size=1;while(size<L.length)size*=2;
  var byes=size-L.length,rest=L.slice(byes),b=App.db.batch(),tref=App.db.collection("tournaments").doc(),ents=[];
  L.slice(0,byes).forEach(function(n){ents.push({bye:n})});
  for(var i=0;i<rest.length;i+=2)ents.push({m:mkMatch(tref.id,0,rest[i],rest[i+1],b)});
  b.set(tref,{name:name,n:Date.now(),status:"active",players:sel,winner:null,rounds:[{name:tier(size),ents:ents}]});
  try{await b.commit();$("tn").value=""}catch(e){alert(nice(e))}
}
function winnersOf(t,ri){
  var out=[];
  for(var k=0;k<t.rounds[ri].ents.length;k++){
    var e=t.rounds[ri].ents[k];
    if(e.bye){out.push(e.bye);continue}
    var m=MS[e.m];
    if(!m||m.status!=="done"||(m.winner!=="a"&&m.winner!=="b"))return null;
    out.push(m.winner==="a"?m.a:m.b);
  }
  return out;
}
async function advance(t){
  var ri=t.rounds.length-1,w=winnersOf(t,ri);
  if(!w||t.status==="done")return;
  var tref=App.db.collection("tournaments").doc(t.id);
  if(w.length===1){await tref.update({status:"done",winner:w[0]});return}
  var b=App.db.batch(),ents=[];
  for(var i=0;i<w.length;i+=2)ents.push({m:mkMatch(t.id,ri+1,w[i],w[i+1],b)});
  b.update(tref,{rounds:t.rounds.concat([{name:tier(w.length),ents:ents}])});
  await b.commit();
}
function card(t){
  var h='<div class="card"><h2 style="margin-top:0">'+esc(t.name)+'</h2>';
  if(t.status==="done")h+='<div class="banner">Câștigător: <b>'+esc(t.winner)+'</b></div>';
  t.rounds.forEach(function(r,ri){
    h+='<h3>'+esc(r.name)+'</h3>';
    r.ents.forEach(function(e){
      if(e.bye){h+='<div class="ln">'+esc(e.bye)+' — liber, trece mai departe</div>';return}
      var m=MS[e.m];if(!m){h+='<div class="ln">…</div>';return}
      var mine=m.a===App.me||m.b===App.me;
      h+='<div class="ln'+(mine?' mine':'')+'"><b>'+esc(m.a)+' vs '+esc(m.b)+'</b> · '+(m.status==="done"?(m.winner==="a"?esc(m.a):esc(m.b))+' a câștigat ('+App.score(m)+')':'în desfășurare ('+App.score(m)+')')+' · <a href="match.html?id='+m.id+'">'+(mine&&m.status!=="done"?"Joacă":"Vezi")+'</a></div>';
    });
  });
  if(t.status!=="done")h+='<div class="legend">Runda următoare apare automat după ce se încheie toate meciurile rundei curente'+(App.isAdmin?' (cât timp ai pagina asta deschisă)':'')+'.</div>';
  if(App.isAdmin)h+='<div class="vpb"><button class="sm ghost" data-act="deltour" data-id="'+t.id+'">Șterge turneul</button></div>';
  return h+'</div>';
}
function drawForm(){
  if(!App.isAdmin)return;
  var checked={};[].forEach.call(document.querySelectorAll("#tp input"),function(x){checked[x.value]=x.checked});
  $("tp").innerHTML=App.players.map(function(p){return '<label class="opt"><input type="checkbox" value="'+esc(p.name)+'"'+(checked[p.name]===false?'':' checked')+'> '+esc(p.name)+'</label>'}).join("");
}
function render(){
  var mine=Object.keys(MS).map(function(k){return MS[k]}).filter(function(m){return (m.a===App.me||m.b===App.me)&&m.status==="active"});
  $("mine").innerHTML=mine.length?mine.map(App.matchRow).join(""):'<p class="empty">Nu ai meciuri de turneu în desfășurare.</p>';
  $("tlist").innerHTML=T.length?T.map(card).join(""):'<p class="empty">Niciun turneu încă.</p>';
  if(App.isAdmin)T.forEach(function(t){
    if(t.status==="done")return;
    var k=t.id+":"+t.rounds.length;
    if(!adv[k]&&winnersOf(t,t.rounds.length-1)){adv[k]=1;advance(t).catch(fail)}
  });
}
App.start(function(){
  show();
  App.onPlayers=drawForm;
  App.db.collection("tournaments").orderBy("n","desc").onSnapshot(function(s){T=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},fail);
  App.db.collection("matches").where("type","==","tournament").onSnapshot(function(s){MS={};s.docs.forEach(function(d){MS[d.id]=Object.assign({id:d.id},d.data())});render()},fail);
  $("tb").onclick=create;
  $("tlist").addEventListener("click",async function(e){
    var el=e.target.closest("button[data-act='deltour']");if(!el||!confirm("Ștergi turneul și toate meciurile lui?"))return;
    var id=el.getAttribute("data-id"),b=App.db.batch();
    Object.keys(MS).forEach(function(k){if(MS[k].tid===id)b.delete(App.db.collection("matches").doc(k))});
    b.delete(App.db.collection("tournaments").doc(id));
    try{await b.commit()}catch(x){alert(nice(x))}
  });
});
function show(){if(App.isAdmin)$("adm").classList.remove("hidden")}
