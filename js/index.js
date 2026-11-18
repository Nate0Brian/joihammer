function showLogin(){$("login").classList.remove("hidden");$("dash").classList.add("hidden")}
var MS=[];
function draw(ms){
  MS=ms;
  var inv=ms.filter(function(m){return m.status==="invited"});
  var campaignMatches=ms.filter(function(m){
    return (m.type==="campaign"||!!m.campaignId)&&
      !(m.status==="done"&&m.campaignRewardsDone&&m.campaignRewardsDone[m.a]&&m.campaignRewardsDone[m.b]&&m.campaignWarmasterConfirmed);
  });
  function campaignRoundComplete(roundMatches){
    return roundMatches.length>0&&roundMatches.every(function(x){
      return x.status==="done"&&x.campaignRewardsDone&&
        x.campaignRewardsDone[x.a]&&x.campaignRewardsDone[x.b]&&
        x.campaignWarmasterConfirmed;
    });
  }
  function currentRoundForPlayer(campaignId,phase,player){
    var mine=campaignMatches.filter(function(x){
      return (x.campaignId||"")===campaignId&&
        Number(x.campaignPhase||1)===phase&&(x.a===player||x.b===player);
    });
    if(!mine.length)return 1;
    var rounds=mine.map(function(x){return Number(x.campaignRound||1)});
    var unique=rounds.filter(function(r,i,a){return a.indexOf(r)===i}).sort(function(a,b){return a-b});
    for(var i=0;i<unique.length;i++){
      var r=unique[i],items=mine.filter(function(x){return Number(x.campaignRound||1)===r});
      if(!campaignRoundComplete(items))return r;
    }
    return unique.length?unique[unique.length-1]+1:1;
  }
  var campaigns=campaignMatches.filter(function(m){
    if(App.isAdmin)return m.status!=="campaign_locked";
    if(m.a!==App.me&&m.b!==App.me)return false;
    if(m.status==="campaign_locked")return false;
    var phase=Number(m.campaignPhase||1),round=Number(m.campaignRound||1),cid=m.campaignId||"";
    var aRound=currentRoundForPlayer(cid,phase,m.a);
    var bRound=currentRoundForPlayer(cid,phase,m.b);
    return round===Math.min(aRound,bRound)&&
      !(m.status==="done"&&m.campaignRewardsDone&&m.campaignRewardsDone[m.a]&&
        m.campaignRewardsDone[m.b]&&m.campaignWarmasterConfirmed);
  });
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
