function draw(){
  var p=App.players.filter(function(x){return x.name===App.me})[0];
  if(!p){$("pf").innerHTML='<p class="empty">Nu ești în lista de jucători.</p>'+(App.isAdmin?'<button id="addme" class="sm">Adaugă-mă ca jucător</button>':'');
    if($("addme"))$("addme").onclick=function(){App.db.collection("players").doc("admin").set({army:"",det:"",fd:FDS[0]}).catch(fail)};return}
  if(document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#pf"))return;
  $("pf").innerHTML='<div class="grid"><input id="army" type="text" list="armies" placeholder="Armată" value="'+esc(p.army)+'"><input id="det" type="text" placeholder="Detașament" value="'+esc(p.det)+'"><select id="fd" class="full">'+FDS.map(function(f){return '<option'+(f===p.fd?' selected':'')+'>'+f+'</option>'}).join("")+'</select><button id="save" class="full">Salvează</button></div>';
  $("save").onclick=function(){App.db.collection("players").doc(App.me).update({army:$("army").value.trim(),det:$("det").value.trim(),fd:$("fd").value}).then(function(){$("st").textContent="Salvat."}).catch(fail)};
}
App.start(function(){
  App.onPlayers=draw;
  var nb=$("nt");if(nb){if(!("Notification" in window))nb.classList.add("hidden");else nb.onclick=function(){Notification.requestPermission().then(function(r){$("st").textContent=r==="granted"?"Notificările sunt active (merg cât timp aplicația e deschisă).":"Notificările nu au fost permise."})}}
  $("chp").onclick=async function(){
    var cur=prompt("Parola actuală:");if(!cur)return;
    var nw=prompt("Parola nouă (minim 6 caractere):");if(!nw)return;
    try{var u=App.auth.currentUser;await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email,cur));await u.updatePassword(nw);alert("Parola a fost schimbată.")}catch(e){alert(nice(e))}
  };
});
