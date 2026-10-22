var cur=null;

function dpOf(army,dets){
  var all=Data.detsOf(army);
  return dets.reduce(function(a,n){var d=all.filter(function(x){return x.n===n})[0];return a+(d?d.dp:0)},0);
}
function paint(){
  var dets=Data.detsOf(cur.army),fdo=Data.fdsFor(cur.army,cur.dets);
  if(fdo.indexOf(cur.fd)<0)cur.fd=fdo[0];
  var h='<div class="grid"><select id="army" class="full" aria-label="Armata"><option value="">— alege armata —</option>'+Data.armies().map(function(a){return '<option'+(a===cur.army?' selected':'')+'>'+esc(a)+'</option>'}).join("")+'</select></div>';
  if(cur.army){
    h+='<h3>Detașamente</h3><div class="dets">'+dets.map(function(d){
      return '<label class="opt dl"><input type="checkbox" data-d="'+esc(d.n)+'"'+(cur.dets.indexOf(d.n)>=0?' checked':'')+'> <span>'+esc(d.n)+'<small>'+(d.fd?esc(d.fd):'Force Disposition neconfirmat')+' · '+d.dp+' DP'+(d.src!==cur.army?' · '+esc(d.src):'')+'</small></span></label>';
    }).join("")+'</div>';
    var dp=dpOf(cur.army,cur.dets);
    h+='<div class="legend">Total detașamente: <b>'+dp+' DP</b> (2 DP la 1000 puncte, 3 DP la 2000 puncte).</div>';
    h+='<label class="opt">Force Disposition al armatei <select id="fd">'+fdo.map(function(f){return '<option'+(f===cur.fd?' selected':'')+'>'+esc(f)+'</option>'}).join("")+'</select></label>';
    h+='<div class="legend">'+(fdo.length===1?'Din detașamentele alese.':'Alege unul dintre Force Disposition-urile detașamentelor tale.')+'</div>';
  }
  h+='<p><button id="save">Salvează</button></p>';
  $("pf").innerHTML=h;
  var rows=FDS.map(function(opp,i){return '<tr><td>'+esc(opp)+'</td><td><b>'+esc(FDM[cur.fd][i])+'</b></td></tr>'}).join("");
  $("pm").innerHTML='<div class="tblw"><table class="tbl"><tr><th>Dacă adversarul are</th><th>Misiunea ta primară</th></tr>'+rows+'</table></div><div class="legend">Regulile fiecărei misiuni sunt în pagina <a href="missions.html">Misiuni</a>.</div>';
}
function draw(){
  var p=App.players.filter(function(x){return x.name===App.me})[0];
  if(!p){
    $("pf").innerHTML='<p class="empty">Nu ești în lista de jucători.</p>'+(App.isAdmin?'<button id="addme" class="sm">Adaugă-mă ca jucător</button>':'');
    if($("addme"))$("addme").onclick=function(){App.db.collection("players").doc("admin").set({army:"",det:"",dets:[],fd:FDS[0]}).catch(fail)};
    return;
  }
  if(!cur)cur={army:DET[p.army]?p.army:"",dets:(p.dets||[]).slice(),fd:p.fd};
  if(!FDM[cur.fd])cur.fd=FDS[0];
  paint();
}
App.start(function(){
  App.onPlayers=draw;
  $("pf").addEventListener("change",function(e){
    var t=e.target;
    if(t.id==="army"){cur.army=t.value;cur.dets=[];paint();return}
    if(t.id==="fd"){cur.fd=t.value;paint();return}
    var d=t.getAttribute&&t.getAttribute("data-d");
    if(d){var i=cur.dets.indexOf(d);if(t.checked&&i<0)cur.dets.push(d);else if(!t.checked&&i>=0)cur.dets.splice(i,1);paint()}
  });
  $("pf").addEventListener("click",function(e){
    if(e.target.id!=="save")return;
    App.db.collection("players").doc(App.me).update({army:cur.army,dets:cur.dets,det:cur.dets.join(", "),fd:cur.fd})
      .then(function(){$("st").textContent="Salvat.";cur=null}).catch(fail);
  });
  $("chp").onclick=async function(){
    var c=prompt("Parola actuală:");if(!c)return;
    var nw=prompt("Parola nouă (minim 6 caractere):");if(!nw)return;
    try{var u=App.auth.currentUser;await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,c));await u.updatePassword(nw);alert("Parola a fost schimbată.")}catch(e){alert(nice(e))}
  };
  var nb=$("nt");
  if(nb){
    if(!("Notification" in window))nb.classList.add("hidden");
    else nb.onclick=function(){Notification.requestPermission().then(function(r){$("st").textContent=r==="granted"?"Notificările sunt active (merg cât timp aplicația e deschisă).":"Notificările nu au fost permise."})};
  }
});
