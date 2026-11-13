function showLogin(){$("login").classList.remove("hidden");$("dash").classList.add("hidden")}
var MS=[],CAMPAIGN_MATCHES={},CAMPAIGN_WATCHERS={};
function watchCampaignRounds(ms){
  var ids={};ms.forEach(function(m){if(m.campaignId)ids[m.campaignId]=true});
  Object.keys(ids).forEach(function(id){if(CAMPAIGN_WATCHERS[id])return;CAMPAIGN_WATCHERS[id]=App.db.collection("matches").where("campaignId","==",id).onSnapshot(function(s){CAMPAIGN_MATCHES[id]=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});draw(MS)},function(e){console.warn("Campaign round watcher",e)})});
}
function campaignRoundUnlocked(m){
  var all=CAMPAIGN_MATCHES[m.campaignId]||[],round=Number(m.campaignRound||1),phase=Number(m.campaignPhase||1);
  if(round<=1)return m.status!=="campaign_locked";
  var previous=all.filter(function(x){return Number(x.campaignPhase||1)===phase&&Number(x.campaignRound||1)===round-1});
  return [m.a,m.b].every(function(player){return previous.filter(function(x){return x.a===player||x.b===player}).every(function(x){return x.status==="done"})});
}
function draw(ms){
  MS=ms;
  var inv=ms.filter(function(m){return m.status==="invited"});
  watchCampaignRounds(ms);
  var campaigns=ms.filter(function(m){return (m.type==="campaign"||!!m.campaignId)&&m.status!=="campaign_locked"&&campaignRoundUnlocked(m)});
  var regular=ms.filter(function(m){return m.type!=="campaign"&&!m.campaignId});
  var act=regular.filter(function(m){return m.status==="active"||m.status==="confirm"});
  var done=regular.filter(function(m){return m.status==="done"}).slice(0,8);
  $("inv").innerHTML=inv.length?inv.map(function(m){
    if(m.b===App.me)return '<div class="card"><b>'+esc(m.a)+'</b> te invită la un meci '+(m.type==='combat-patrol'?'Combat Patrol':'amical')+'.<div class="vpb"><button class="sm" data-act="acc" data-id="'+m.id+'">Acceptă</button><button class="sm ghost" data-act="dec" data-id="'+m.id+'">Refuză</button></div></div>';
    if(m.a===App.me)return '<div class="card">Invitație trimisă lui <b>'+esc(m.b)+'</b> · în așteptare.<div class="vpb"><button class="sm ghost" data-act="cancel" data-id="'+m.id+'">Anulează invitația</button></div></div>';
    return '';
  }).join(""):'<p class="empty">Nicio invitație în așteptare.</p>';
  $("camp").innerHTML=campaigns.length?campaigns.map(App.matchRow).join(""):'<p class="empty">Niciun meci de campanie programat sau în desfășurare.</p>';
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
    var action=el.getAttribute("data-act");
    if(action==="acc")ref.update({status:"active",pa:App.snapOr(m.a,m.pa),pb:App.snapOr(m.b,m.pb)}).then(function(){location.href="match.html?id="+m.id}).catch(fail);
    else if(action==="cancel"&&m.a===App.me)ref.update({status:"cancelled"}).catch(fail);
    else if(action==="dec"&&m.b===App.me)ref.update({status:"declined"}).catch(fail);
  });
},showLogin);
if(App.auth){$("lb").onclick=login;$("lp").onkeydown=function(e){if(e.key==="Enter")login()}}
