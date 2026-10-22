var tab="det",sel={army:"",det:""};
var TABS=[["det","Pe detașament"],["prim","Primare"],["sec","Secundare"],["tw","Twist"],["dep","Deployment"]];

function ltag(L){
  var r=L.min===L.max?"R"+L.min:(L.max===5?"R"+L.min+"+":"R"+L.min+"–"+L.max);
  return (L.w==="F"?"Final bătălie":L.w==="C"?"Command":"Final tură")+(L.w==="F"?"":" · "+r);
}
function priCard(name){
  var p=PRI[name];if(!p)return '';
  return '<details class="mis"><summary><b class="t">'+esc(name)+'</b></summary>'+(p.a?'<div class="act">'+esc(p.a)+'</div>':'')+'<ul>'+p.r.map(function(l){var L=parseLine(l);return '<li><span class="tag">'+ltag(L)+'</span> '+esc(L.text)+'</li>'}).join("")+'</ul></details>';
}
function wdText(w){
  if(w.o)return 'Când e trasă: dacă «'+w.o+'» e activă, poți trage o carte nouă și amesteca aceasta înapoi în pachet.';
  if(w.r1)return 'Când e trasă: în runda 1 poți trage o carte nouă și amesteca aceasta înapoi în pachet.';
  return 'Când e trasă: o poți arunca și trage alta dacă – '+w.ask;
}
function fdTable(fd){
  return '<div class="tblw"><table class="tbl"><tr><th>Dacă adversarul are</th><th>Misiunea ta primară</th></tr></table></div>'
    +FDS.map(function(opp,i){return '<div class="legend" style="margin-top:10px">Adversar: <b>'+esc(opp)+'</b></div>'+priCard(FDM[fd][i])}).join("");
}
function viewDet(){
  var h='<div class="grid"><select id="ma" class="full"><option value="">— alege armata —</option>'+Data.armies().map(function(a){return '<option'+(a===sel.army?' selected':'')+'>'+esc(a)+'</option>'}).join("")+'</select>';
  var ds=Data.detsOf(sel.army);
  if(sel.army)h+='<select id="md" class="full"><option value="">— alege detașamentul —</option>'+ds.map(function(d){return '<option value="'+esc(d.n)+'"'+(d.n===sel.det?' selected':'')+'>'+esc(d.n)+' ('+d.dp+' DP'+(d.src!==sel.army?', '+esc(d.src):'')+')</option>'}).join("")+'</select>';
  h+='</div>';
  var d=ds.filter(function(x){return x.n===sel.det})[0];
  if(d){
    if(d.fd)h+='<div class="banner" style="margin-top:14px"><b>'+esc(d.n)+'</b><br>Force Disposition: <b>'+esc(d.fd)+'</b> · '+d.dp+' DP</div>'+fdTable(d.fd);
    else h+='<div class="banner" style="margin-top:14px"><b>'+esc(d.n)+'</b><br>Force Disposition neconfirmat în date. Alege unul:</div><div class="chips">'+FDS.map(function(f){return '<button data-fd="'+esc(f)+'">'+esc(f)+'</button>'}).join("")+'</div><div id="fdx"></div>';
  }else h+='<p class="empty">Alege o armată și un detașament ca să vezi Force Disposition-ul și misiunile lui.</p>';
  return h;
}
function viewPrim(){
  return FDS.map(function(fd){return '<h2>'+esc(fd)+'</h2>'+fdTable(fd)}).join("");
}
function viewSec(){
  return '<div class="legend">Tactical: tragi 2 cărți la începutul fazei Command. Fixed: alegi 2 cărți care nu se aruncă. Marcajul „Fixed” arată cărțile permise ca Fixed.</div>'+SEC.map(function(c){
    var v=SECV[c.n];
    return '<div class="mis"><b class="t">'+esc(c.n)+'</b>'+(c.fx?' <span class="role">Fixed</span>':'')+'<ul>'+c.r.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>'
      +'<div class="legend">Tactical: '+v.t.join(" / ")+' VP'+(v.f.length?' · Fixed: '+v.f.join(" / ")+' VP':'')+'</div>'+(WD[c.n]?'<div class="legend">'+esc(wdText(WD[c.n]))+'</div>':'')+'</div>';
  }).join("");
}
function viewTw(){return Object.keys(TWISTS).map(function(n){return '<div class="mis"><b class="t">'+esc(n)+'</b><div>'+esc(TWISTS[n])+'</div></div>'}).join("")}
function viewDep(){return '<div class="legend">Câmpul de luptă are 44" × 60". Hărțile fiecărei desfășurări sunt în aplicația oficială Warhammer 40,000 sau în Mission Deck.</div>'+DEPLOYS.map(function(n){return '<div class="mis"><b class="t">'+esc(n)+'</b></div>'}).join("")}
function render(){
  $("tabs").innerHTML=TABS.map(function(t){return '<button data-t="'+t[0]+'"'+(t[0]===tab?' class="on"':'')+'>'+t[1]+'</button>'}).join("");
  $("mv").innerHTML={det:viewDet,prim:viewPrim,sec:viewSec,tw:viewTw,dep:viewDep}[tab]();
}
App.start(function(){
  $("tabs").addEventListener("click",function(e){var b=e.target.closest("button[data-t]");if(b){tab=b.getAttribute("data-t");render()}});
  $("mv").addEventListener("change",function(e){
    if(e.target.id==="ma"){sel.army=e.target.value;sel.det="";render()}
    if(e.target.id==="md"){sel.det=e.target.value;render()}
  });
  $("mv").addEventListener("click",function(e){
    var b=e.target.closest("button[data-fd]");if(b)$("fdx").innerHTML=fdTable(b.getAttribute("data-fd"));
  });
  render();
});
