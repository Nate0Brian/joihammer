var MS=[];
function drawForm(){
  var cur=$("opp").value;
  $("opp").innerHTML=App.players.filter(function(p){return p.name!==App.me}).map(function(p){return '<option>'+esc(p.name)+'</option>'}).join("");
  if(cur)$("opp").value=cur;
}
function drawList(ms){
  MS=ms;
  var inv=ms.filter(function(m){return m.status==="invited"});
  $("list").innerHTML=inv.length?inv.map(function(m){
    return m.b===App.me
      ?'<div class="card"><b>'+esc(m.a)+'</b> te invită la un meci.<div class="vpb"><button class="sm" data-act="acc" data-id="'+m.id+'">Acceptă</button><button class="sm ghost" data-act="dec" data-id="'+m.id+'">Refuză</button></div></div>'
      :'<div class="card">Invitație trimisă lui <b>'+esc(m.b)+'</b>, în așteptare.<div class="vpb"><button class="sm ghost" data-act="dec" data-id="'+m.id+'">Anulează</button></div></div>';
  }).join(""):'<p class="empty">Nicio invitație în așteptare.</p>';
}
function send(){
  var opp=$("opp").value;if(!opp){$("st").textContent="Alege un adversar.";return}
  var m=App.newMatch({type:"friendly",a:App.me,b:opp,status:"invited",pa:App.snap(App.me),pb:App.snap(opp)});
  if($("tw").checked)m.twist=pick(Object.keys(TWISTS));
  App.db.collection("matches").add(m).then(function(){$("st").textContent="Invitație trimisă lui "+opp+"."}).catch(fail);
}
App.start(function(){
  App.onPlayers=drawForm;App.watchMatches(drawList);
  $("send").onclick=send;
  $("list").addEventListener("click",function(e){
    var el=e.target.closest("button[data-act]");if(!el)return;
    var m=MS.filter(function(x){return x.id===el.getAttribute("data-id")})[0];if(!m)return;
    var ref=App.db.collection("matches").doc(m.id);
    if(el.getAttribute("data-act")==="acc")ref.update({status:"active",pa:App.snapOr(m.a,m.pa),pb:App.snapOr(m.b,m.pb)}).then(function(){location.href="match.html?id="+m.id}).catch(fail);
    else ref.update({status:"declined"}).catch(fail);
  });
});
