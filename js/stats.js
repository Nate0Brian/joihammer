var D=[],TS=[],flt="40k";
function isCP(m){return !!m&&(m.type==="combat-patrol"||m.type==="combat_patrol"||m.gameMode==="combat-patrol"||m.format==="combat-patrol"||m.combatPatrol===true||!!(m.sa&&m.sa.cpPatrolId)||!!(m.sb&&m.sb.cpPatrolId));}
function pass(m){if(m.wo)return false;if(flt==="cp")return isCP(m);if(flt==="40k")return !isCP(m)&&m.type!=="tournament";if(flt==="t")return m.type==="tournament";if(flt==="f")return m.type==="friendly"&&!isCP(m);return true}
function rows(){
  var R={};
  D.filter(pass).forEach(function(m){
    ["a","b"].forEach(function(s){
      var o=s==="a"?"b":"a",n=m[s],ps=Object.assign(newPS(),m["s"+s]),os=Object.assign(newPS(),m["s"+o]);
      var r=R[n]||(R[n]={n:n,g:0,w:0,d:0,l:0,vp:0,diff:0,ar:{},atk:{g:0,w:0},def:{g:0,w:0},ti:0});
      var mine=isCP(m)?(ps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(ps),theirs=isCP(m)?(os.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(os);
      r.g++;r.vp+=mine;r.diff+=mine-theirs;
      if(m.winner===s)r.w++;else if(m.winner==="draw")r.d++;else r.l++;
      var army=isCP(m)?(ps.cpPatrolId||"Combat Patrol"):(m["p"+s]&&m["p"+s].army);if(army)r.ar[army]=(r.ar[army]||0)+1;
      if(m.atk){var k=m.atk===s?r.atk:r.def;k.g++;if(m.winner===s)k.w++}
    });
  });
  if(flt!=="f")TS.forEach(function(t){if(t.status==="done"&&t.winner&&R[t.winner])R[t.winner].ti++});
  return Object.keys(R).map(function(k){return R[k]}).sort(function(x,y){return y.w-x.w||(y.w/y.g)-(x.w/x.g)||y.diff-x.diff});
}
function fav(r){var b="",c=0;Object.keys(r.ar).forEach(function(k){if(r.ar[k]>c){c=r.ar[k];b=k}});return b||"—"}
function pct(w,g){return g?Math.round(100*w/g)+"%":"—"}
function h2h(){
  var R={};
  D.filter(pass).forEach(function(m){
    var s=m.a===App.me?"a":(m.b===App.me?"b":null);if(!s)return;
    var o=s==="a"?"b":"a",n=m[o],r=R[n]||(R[n]={n:n,g:0,w:0,d:0,l:0,vf:0,va:0});
    r.g++;var myps=Object.assign(newPS(),m["s"+s]),opps=Object.assign(newPS(),m["s"+o]);r.vf+=isCP(m)?(myps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(myps);r.va+=isCP(m)?(opps.log||[]).filter(function(e){return e.k==="cpvp"}).reduce(function(a,e){return a+e.v},0):totalPS(opps);
    if(m.winner===s)r.w++;else if(m.winner==="draw")r.d++;else r.l++;
  });
  return Object.keys(R).map(function(k){return R[k]}).sort(function(x,y){return y.g-x.g});
}
function render(){
  var rs=rows();var cpMode=flt==="cp";var title=$("statsModeTitle");if(title)title.textContent=cpMode?"Clasament Combat Patrol":flt==="40k"?"Clasament Warhammer 40K":flt==="all"?"Clasament – toate formatele":flt==="t"?"Clasament turnee":"Clasament amicale";
  $("lb").innerHTML=rs.length?'<div class="tblw"><table class="tbl"><tr><th>#</th><th>Jucător</th><th>J</th><th>V</th><th>E</th><th>Î</th><th>V%</th><th>VP med.</th><th>Titluri</th></tr>'+rs.map(function(r,i){
    return '<tr><td>'+(i+1)+'</td><td>'+esc(r.n)+'<br><small class="sub">'+esc(fav(r))+'</small></td><td>'+r.g+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td>'+pct(r.w,r.g)+'</td><td>'+(r.vp/r.g).toFixed(1)+'</td><td>'+(r.ti||"")+'</td></tr>';
  }).join("")+'</table></div>':'<p class="empty">Nu există încă meciuri încheiate.</p>';
  $("roles").innerHTML=rs.length?'<div class="tblw"><table class="tbl"><tr><th></th><th>Jucător</th><th>Atacator</th><th>Defender</th></tr>'+rs.map(function(r){
    return '<tr><td></td><td>'+esc(r.n)+'</td><td>'+r.atk.w+'/'+r.atk.g+' ('+pct(r.atk.w,r.atk.g)+')</td><td>'+r.def.w+'/'+r.def.g+' ('+pct(r.def.w,r.def.g)+')</td></tr>';
  }).join("")+'</table></div><div class="legend">Victorii / meciuri pe rolul avut. Rolul se înregistrează doar la meciurile în care a fost ales.</div>':'';
  var hh=h2h();
  $("h2h").innerHTML=hh.length?'<div class="tblw"><table class="tbl"><tr><th></th><th>Adversar</th><th>J</th><th>V</th><th>E</th><th>Î</th><th>VP +/−</th></tr>'+hh.map(function(r){
    return '<tr><td></td><td>'+esc(r.n)+'</td><td>'+r.g+'</td><td>'+r.w+'</td><td>'+r.d+'</td><td>'+r.l+'</td><td>'+r.vf+'–'+r.va+'</td></tr>';
  }).join("")+'</table></div>':'<p class="empty">Nu ai încă meciuri încheiate.</p>';
  [].forEach.call(document.querySelectorAll("#flt button"),function(b){b.classList.toggle("on",b.getAttribute("data-f")===flt)});
}
App.start(function(){
  $("flt").addEventListener("click",function(e){var b=e.target.closest("button[data-f]");if(b){flt=b.getAttribute("data-f");render()}});
  App.db.collection("matches").where("status","==","done").onSnapshot(function(s){D=s.docs.map(function(d){return Object.assign({id:d.id},d.data())});render()},fail);
  App.db.collection("tournaments").onSnapshot(function(s){TS=s.docs.map(function(d){return d.data()});render()},fail);
});
