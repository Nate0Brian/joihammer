var MS=[],flt="all";

function norm(m){m.sa=Object.assign(newPS(),m.sa);m.sb=Object.assign(newPS(),m.sb);return m}
function actSide(m){if(m.first==null||m.turn>=10)return null;return m.turn%2===0?m.first:(m.first==="a"?"b":"a")}
function curRound(m){return m.turn>=10?5:Math.floor(m.turn/2)+1}
function status(m){
  if(m.status==="confirm")return "Se confirmă scorul final";
  if(m.first==null)return "Pregătire";
  if(m.turn>=10)return "Bătălie încheiată · punctele finale";
  var a=actSide(m);return "Runda "+curRound(m)+"/5 · tura lui "+esc(m["p"+a].name);
}
function baseP(m,s){
  var me=m["p"+s],op=m["p"+(s==="a"?"b":"a")];
  if(!me||!op||!FDM[me.fd]||!FDM[op.fd])return "";
  return FDM[me.fd][FDS.indexOf(op.fd)];
}
function primName(m,s){return m.twist==="Scrambled Communications"?baseP(m,s==="a"?"b":"a"):baseP(m,s)}
function cell(ps,r){
  var v=Math.min(15,Math.max(0,roundVP(ps,"pri",r)))+Math.min(15,Math.max(0,roundVP(ps,"sec",r)));
  return v;
}
function finVP(ps){return (ps.log||[]).reduce(function(a,e){return a+(e.f?e.v:0)},0)}
function secInfo(ps,started){
  if(!ps.mode)return "încă nu a ales";
  if(!started)return ps.ready?(ps.mode==="T"?"Tactical (confirmat)":"Fixed (confirmat)"):"se pregătește";
  return ps.mode==="T"?"Tactical · "+ps.hand.length+" cărți active":"Fixed: "+esc(ps.fixed.join(", "));
}
function events(m){
  var out=[];
  ["a","b"].forEach(function(s){m["s"+s].log.forEach(function(e,i){out.push({s:s,e:e,i:i})})});
  out.sort(function(x,y){return x.e.t-y.e.t||x.i-y.i});
  return out.slice(-4).reverse();
}
function side(m,s,lead){
  var ps=m["s"+s],pl=m["p"+s],started=m.first!=null,a=actSide(m);
  return '<div class="ws'+(lead?' lead':'')+'"><div class="pn">'+(a===s?'▶ ':'')+esc(pl.name)+'</div><small>'+esc([m.atk?(m.atk===s?"Atacator":"Defender"):"",pl.army,pl.fd].filter(Boolean).join(" · "))+'</small>'
    +'<div class="num">'+totalPS(ps)+'</div>'
    +'<div class="st">CP <b>'+cpOf(ps)+'</b> · Primar <b>'+sums(ps,"pri")+'</b> · Secundar <b>'+sums(ps,"sec")+'</b>'+(ps.br?' · Pictată +10':'')+'</div>'
    +(started?'<div class="st">'+esc(primName(m,s))+'</div>':'')
    +'<div class="st">'+secInfo(ps,started)+'</div></div>';
}
function card(m){
  norm(m);
  var ta=totalPS(m.sa),tb=totalPS(m.sb),started=m.first!=null,r=curRound(m);
  var h='<article class="wm"><div class="wmh"><span><span class="live"></span><span class="chip">'+(m.type==="tournament"?"Turneu":"Amical")+'</span></span><span>'+status(m)+'</span></div>';
  h+='<div class="wsides">'+side(m,"a",ta>tb)+side(m,"b",tb>ta)+'</div>';
  if(started){
    h+='<table class="wt"><tr><th></th>'+[1,2,3,4,5].map(function(i){return '<th'+(i===r&&m.turn<10?' class="cur"':'')+'>R'+i+'</th>'}).join("")+'<th>F</th></tr>';
    [["a",m.sa],["b",m.sb]].forEach(function(x){
      h+='<tr><th>'+esc(m["p"+x[0]].name.slice(0,8))+'</th>'+[1,2,3,4,5].map(function(i){return '<td'+(i===r&&m.turn<10?' class="cur"':'')+'>'+cell(x[1],i)+'</td>'}).join("")+'<td>'+finVP(x[1])+'</td></tr>';
    });
    h+='</table>';
    var ev=events(m);
    if(ev.length)h+='<div class="wev">'+ev.map(function(x){
      var e=x.e,nm=esc(m["p"+x.s].name),kind=e.k==="cp"?"CP":e.k==="pri"?"Primar":"Secundar";
      return '<div>R'+e.r+' · <b>'+nm+'</b> '+(e.v>0?"+":"")+e.v+' '+kind+(e.k==="cp"?"":" · "+esc(e.l.slice(0,38)))+(e.k==="cp"&&e.l?" · "+esc(e.l.slice(0,30)):"")+'</div>';
    }).join("")+'</div>';
  }
  h+='<div class="wmh"><span>'+(m.deploy?'Deployment: '+esc(m.deploy):'')+(m.twist?' · Twist: '+esc(m.twist):'')+'</span><a href="match.html?id='+m.id+'">Deschide</a></div></article>';
  return h;
}
function render(){
  var list=MS.filter(function(m){
    if(flt==="t")return m.type==="tournament";
    if(flt==="f")return m.type==="friendly";
    if(flt==="m")return m.a===App.me||m.b===App.me;
    return true;
  });
  $("cnt").textContent=MS.length?MS.length+(MS.length===1?" meci în desfășurare":" meciuri în desfășurare"):"";
  $("wgrid").innerHTML=list.length?list.map(card).join(""):'<p class="empty">Niciun meci în desfășurare'+(flt==="all"?"":" pentru filtrul ales")+'.</p>';
  [].forEach.call(document.querySelectorAll("#flt button"),function(b){b.classList.toggle("on",b.getAttribute("data-f")===flt)});
}
App.start(function(){
  $("flt").addEventListener("click",function(e){var b=e.target.closest("button[data-f]");if(b){flt=b.getAttribute("data-f");render()}});
  App.db.collection("matches").where("status","in",["active","confirm"]).onSnapshot(function(s){
    MS=s.docs.map(function(d){return Object.assign({id:d.id},d.data())}).sort(function(x,y){return y.n-x.n});
    render();
  },fail);
});
