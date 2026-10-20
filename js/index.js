function showLogin(){$("login").classList.remove("hidden");$("dash").classList.add("hidden")}
var MS=[];
function draw(ms){
  MS=ms;
  var inv=ms.filter(function(m){return m.status==="invited"&&m.b===App.me});
  var act=ms.filter(function(m){return m.status==="active"});
  var done=ms.filter(function(m){return m.status==="done"}).slice(0,8);
  $("inv").innerHTML=inv.length?inv.map(function(m){return '<div class="card"><b>'+esc(m.a)+'</b> te invită la un meci amical.<div class="vpb"><button class="sm" data-act="acc" data-id="'+m.id+'">Acceptă</button><button class="sm ghost" data-act="dec" data-id="'+m.id+'">Refuză</button></div></div>'}).join(""):'<p class="empty">Nicio invitație.</p>';
  $("act").innerHTML=act.length?act.map(App.matchRow).join(""):'<p class="empty">Niciun meci în desfășurare.</p>';
  $("done").innerHTML=done.length?done.map(App.matchRow).join(""):'<p class="empty">Încă niciun meci încheiat.</p>';
}
async function login(){
  var u=$("lu").value.trim().toLowerCase(),p=$("lp").value;$("lerr").textContent="";
  try{
    var email;
    if(u==="admin")email=ADMIN_EMAIL;
    else{var d=await App.db.collection("logins").doc(u).get();if(!d.exists)throw {code:"auth/user-not-found"};email=d.data().email}
    await App.auth.signInWithEmailAndPassword(email,p);
  }catch(e){$("lerr").textContent=nice(e)}
}
App.start(function(){
  $("login").classList.add("hidden");$("dash").classList.remove("hidden");
  App.watchMatches(draw);
  document.addEventListener("click",function(e){
    var el=e.target.closest("button[data-act]");if(!el)return;
    var m=MS.filter(function(x){return x.id===el.getAttribute("data-id")})[0];if(!m)return;
    var ref=App.db.collection("matches").doc(m.id);
    if(el.getAttribute("data-act")==="acc")ref.update({status:"active",pa:App.snap(m.a),pb:App.snap(m.b)}).then(function(){location.href="match.html?id="+m.id}).catch(fail);
    else ref.update({status:"declined"}).catch(fail);
  });
},showLogin);
if(App.auth){$("lb").onclick=login;$("lp").onkeydown=function(e){if(e.key==="Enter")login()}}
