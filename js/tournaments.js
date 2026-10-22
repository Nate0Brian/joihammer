var T=[],MS={},adv={};
var FMT={elim:"Eliminare directă",rr:"Fiecare cu fiecare",swiss:"Sistem elvețian"};

async function create(){
  var name=$("tn").value.trim(),fmt=$("tf").value,sel=[].map.call(document.querySelectorAll("#tp input:checked"),function(x){return x.value});
  if(!name){alert("Dă un nume turneului.");return}
  if(sel.length<2){alert("Alege cel puțin 2 jucători.");return}
  var L=shuffle(sel),b=App.db.batch(),tref=App.db.collection("tournaments").doc(),doc={name:name,n:Date.now(),status:"active",players:L,winner:null,fmt:fmt},ents;
  if(fmt==="elim"){
    var size=1;while(size<L.length)size*=2;
    var byes=size-L.length,rest=L.slice(byes),pairs=[];
    for(var i=0;i<rest.length;i+=2)pairs.push([rest[i],rest[i+1]]);
    ents=Tourney.ents(tref.id,0,pairs,L.slice(0,byes),fmt,b);
    doc.totalRounds=Math.round(Math.log2(size));doc.rounds=[{name:tier(size),ents:ents}];
  }else if(fmt==="rr"){
    var r0=Tourney.rr(L,0);
    ents=Tourney.ents(tref.id,0,r0.pairs,r0.byes,fmt,b);
    doc.totalRounds=L.length+(L.length%2)-1;doc.rounds=[{name:"Runda 1",ents:ents}];
  }else{
    var bye=L.length%2?[L[L.length-1]]:[],rest2=L.slice(0,L.length-bye.length),p2=[];
    for(var j=0;j<rest2.length;j+=2)p2.push([rest2[j],rest2[j+1]]);
    ents=Tourney.ents(tref.id,0,p2,bye,fmt,b);
    doc.totalRounds=Math.max(2,Math.ceil(Math.log2(L.length)));doc.rounds=[{name:"Runda 1",ents:ents}];
  }
  b.set(tref,doc);
  try{await b.commit();$("tn").value=""}catch(e){alert(nice(e))}
}
function standTable(t){
  var st=Tourney.standings(t,MS);
  return '<div class="tblw"><table class="tbl"><tr><th>#</th><th>Jucător</th><th>Pct</th><th>V</th><th>E</th><th>Î</th><th>VP +/−</th></tr>'+st.map(function(x,i){
    return '<tr><td>'+(i+1)+'</td><td>'+esc(x.n)+(t.out&&t.out.indexOf(x.n)>=0?' <small class="sub">(retras)</small>':'')+'</td><td><b>'+x.pts+'</b></td><td>'+x.w+'</td><td>'+x.d+'</td><td>'+x.l+'</td><td>'+(x.vf-x.va>0?"+":"")+(x.vf-x.va)+'</td></tr>';
  }).join("")+'</table></div><div class="legend">Victorie 3 puncte, remiză 1, liber 3. La egalitate contează diferența de VP.</div>';
}
function card(t){
  var fmt=t.fmt||"elim";
  var h='<div class="card"><h2 style="margin-top:0">'+esc(t.name)+' <span class="role">'+FMT[fmt]+'</span></h2>';
  if(t.status==="done")h+='<div class="banner">Câștigător: <b>'+esc(t.winner)+'</b></div>';
  else if(t.totalRounds)h+='<div class="legend">Runda '+t.rounds.length+' din '+t.totalRounds+'</div>';
  if(fmt!=="elim")h+=standTable(t);
  t.rounds.forEach(function(r){
    h+='<h3>'+esc(r.name)+'</h3>';
    r.ents.forEach(function(e){
      if(e.bye){h+='<div class="ln">'+esc(e.bye)+' — liber</div>';return}
      var m=MS[e.m];if(!m){h+='<div class="ln">…</div>';return}
      var mine=m.a===App.me||m.b===App.me,res=m.status==="done"?(m.winner==="draw"?"remiză":(m.winner==="a"?esc(m.a):esc(m.b))+" a câștigat"+(m.wo?" (neprezentare)":""))+' ('+App.score(m)+')':(m.status==="confirm"?'se confirmă scorul':'în desfășurare')+' ('+App.score(m)+')';
      h+='<div class="ln'+(mine?' mine':'')+'"><b>'+esc(m.a)+' vs '+esc(m.b)+'</b> · '+res+' · <a href="match.html?id='+m.id+'">'+(mine&&m.status!=="done"?"Joacă":"Vezi")+'</a></div>';
    });
  });
  if(t.status!=="done")h+='<div class="legend">Runda următoare apare automat când se încheie toate meciurile rundei curente.</div>';
  if(App.isAdmin)h+='<div class="vpb"><button class="sm ghost" data-act="deltour" data-id="'+t.id+'">Șterge turneul</button></div>';
  return h+'</div>';
}
function drawForm(){
  if(!App.isAdmin)return;
  var checked={};[].forEach.call(document.querySelectorAll("#tp input"),function(x){checked[x.value]=x.checked});
  $("tp").innerHTML=App.players.map(function(p){return '<label class="opt"><input type="checkbox" value="'+esc(p.name)+'"'+(checked[p.name]===false?'':' checked')+'> '+esc(p.name)+'</label>'}).join("");
}
function render(){
  var mine=Object.keys(MS).map(function(k){return MS[k]}).filter(function(m){return (m.a===App.me||m.b===App.me)&&m.status!=="done"});
  $("mine").innerHTML=mine.length?mine.map(App.matchRow).join(""):'<p class="empty">Nu ai meciuri de turneu în desfășurare.</p>';
  $("tlist").innerHTML=T.length?T.map(card).join(""):'<p class="empty">Niciun turneu încă.</p>';
  T.forEach(function(t){
    if(t.status==="done"||!(App.isAdmin||t.players.indexOf(App.me)>=0))return;
    var ri=t.rounds.length-1,k=t.id+":"+t.rounds.length;
    if(!adv[k]&&Tourney.roundDone(t,ri,MS)){adv[k]=1;Tourney.advance(t,MS).catch(fail)}
  });
}
App.start(function(){
  if(App.isAdmin)$("adm").classList.remove("hidden");
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
