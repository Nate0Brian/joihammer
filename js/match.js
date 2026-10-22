var mid=new URLSearchParams(location.search).get("id"),M=null,openS={};

function rd(){return M.turn>=10?5:Math.floor(M.turn/2)+1}
function actS(){if(M.first==null||M.turn>=10)return null;return M.turn%2===0?M.first:(M.first==="a"?"b":"a")}
function own(s){return App.isAdmin||App.me===M[s]}
function P(s){return M[s==="a"?"pa":"pb"]}
function PS(s){return M[s==="a"?"sa":"sb"]}
function upd(o){return App.db.collection("matches").doc(mid).update(o).catch(fail)}
function saveS(s){var o={};o[s==="a"?"sa":"sb"]=PS(s);upd(o)}
function logAdd(ps,k,v,l,f){ps.log.push({k:k,v:v,l:String(l).slice(0,60),r:rd(),f:!!f,t:M.turn})}
function mut(s,fn){var ps=PS(s);fn(ps);saveS(s);render()}
function deckOf(ps){return SEC.map(function(c){return c.n}).filter(function(n){return ps.hand.indexOf(n)<0&&ps.used.indexOf(n)<0})}
function cardOf(n){return SEC.filter(function(c){return c.n===n})[0]}
function rm(a,n){var i=a.indexOf(n);if(i>=0)a.splice(i,1)}
function baseOf(s){
  var me=P(s),op=P(s==="a"?"b":"a");
  if(me.prim&&PRI[me.prim])return me.prim;
  return FDM[me.fd][FDS.indexOf(op.fd)];
}
function primOf(s){return M.twist==="Scrambled Communications"?baseOf(s==="a"?"b":"a"):baseOf(s)}
function fdOpts(pl){var o=Data.fdsFor(pl.army,pl.dets);if(o.indexOf(pl.fd)<0)o.unshift(pl.fd);return o}
function B(act,s,label,extra,dis,cls){
  return '<button class="sm'+(cls?' '+cls:'')+'" data-act="'+act+'"'+(s?' data-s="'+s+'"':'')+(extra||'')+(dis?' disabled':'')+'>'+label+'</button>';
}
function tag(L){
  var r=L.min===L.max?"R"+L.min:(L.max===5?"R"+L.min+"+":"R"+L.min+"–"+L.max);
  return (L.w==="F"?"Final bătălie":L.w==="C"?"Command":"Final tură")+(L.w==="F"?"":" · "+r);
}
function fixedSum(ps,n){return ps.log.reduce(function(a,e){return a+(e.k==="sec"&&e.l===n?e.v:0)},0)}
function cardHtml(c){return '<b class="t">'+esc(c.n)+'</b><ul>'+c.r.map(function(x){return '<li>'+esc(x)+'</li>'}).join("")+'</ul>'}

function sideHtml(s){
  var ps=PS(s),pl=P(s),started=M.first!=null,ended=M.turn>=10,a=actS(),mine=own(s),live=M.status==="active",r=rd(),cp=cpOf(ps);
  var h='<section class="side"><h2>'+esc(pl.name)+(App.me===M[s]?' <small>(tu)</small>':'')+(M.atk?' <span class="role">'+(M.atk===s?'Atacator':'Defender')+'</span>':'')+'</h2><div class="info">'+esc([pl.army,pl.det].filter(Boolean).join(" · "))+'</div>';
  if(!started&&mine&&live)h+='<label class="opt">Force Disposition <select data-act="fd" data-s="'+s+'"'+(ps.ready?' disabled':'')+'>'+fdOpts(pl).map(function(f){return '<option'+(f===pl.fd?' selected':'')+'>'+f+'</option>'}).join("")+'</select></label>';
  else h+='<div class="info">Force Disposition: <b>'+esc(pl.fd)+'</b></div>';

  if(!started&&mine&&live&&!ps.ready)h+='<label class="opt">Misiune primară <select data-act="pmis" data-s="'+s+'"><option value="">Din Force Disposition</option>'+Object.keys(PRI).map(function(n){return '<option'+(n===pl.prim?' selected':'')+'>'+esc(n)+'</option>'}).join("")+'</select></label>';
  if(started)h+='<div class="info">Timp jucat: <b>'+fmtT((M.tt&&M.tt[s])||0)+'</b></div>';
  h+='<div class="board"><div><span>Primar</span><b>'+sums(ps,"pri")+'</b></div><div><span>Secundar</span><b>'+sums(ps,"sec")+'</b></div><div><span>Pictată</span><b>'+(ps.br?10:0)+'</b></div><div class="bt"><span>Total VP</span><b>'+totalPS(ps)+'</b></div><div><span>CP</span><b>'+cp+'</b></div></div>';
  h+='<div class="legend">Pe runde (max 15): primar '+[1,2,3,4,5].map(function(i){return roundVP(ps,"pri",i)}).join(" / ")+' · secundar '+[1,2,3,4,5].map(function(i){return roundVP(ps,"sec",i)}).join(" / ")+'</div>';
  h+='<div class="vpb">'+B("cp",s,"−1 CP",' data-v="-1"',!(mine&&live),"ghost")+B("cp",s,"+1 CP",' data-v="1"',!(mine&&live),"ghost")+B("man",s,"−1 VP primar",' data-k="pri" data-v="-1"',!(mine&&live&&started),"ghost")+B("man",s,"+1 VP primar",' data-k="pri" data-v="1"',!(mine&&live&&started),"ghost")+B("man",s,"−1 VP secundar",' data-k="sec" data-v="-1"',!(mine&&live&&started),"ghost")+B("man",s,"+1 VP secundar",' data-k="sec" data-v="1"',!(mine&&live&&started),"ghost")+'</div>';
  h+='<label class="opt" style="margin-top:8px"><input type="checkbox" data-act="br" data-s="'+s+'"'+(ps.br?' checked':'')+(mine&&live?'':' disabled')+'> Armată pictată (+10 VP)</label>';

  /* primară */
  var pn=primOf(s),pr=PRI[pn];
  h+='<h3>Misiune primară: '+esc(pn)+'</h3><div class="mis">'+(pr.a?'<div class="act">'+esc(pr.a)+'</div>':'')+pr.r.map(function(line,i){
    var L=parseLine(line),ok=mine&&live&&started&&((L.w==="F"&&ended)||(L.w!=="F"&&!ended&&a===s&&r>=L.min&&r<=L.max));
    return '<div class="ln"><span class="tag">'+tag(L)+'</span> '+esc(L.text)+'<div class="vpb">'+L.v.map(function(v){return B("pv",s,'+'+v+' VP',' data-i="'+i+'" data-v="'+v+'"',!ok)}).join("")+'</div></div>';
  }).join("")+'</div>';

  /* secundare */
  h+='<h3>Misiuni secundare'+(ps.mode&&started?' ('+(ps.mode==="T"?"Tactical":"Fixed")+')':'')+'</h3>'+(M.atk&&started?'<div class="legend">Pachetul de secundare al '+(M.atk===s?'Atacatorului':'Defender-ului')+' (cărțile sunt identice în ambele pachete).</div>':'');
  if(!started){
    var okFix=ps.mode==="T"||(ps.mode==="F"&&ps.fixed.length===2);
    if(mine&&live&&!ps.ready){
      h+='<div class="legend">Alege tipul de secundare înainte de start.</div><select data-act="mode" data-s="'+s+'"><option value=""'+(ps.mode?'':' selected')+'>Alege…</option><option value="T"'+(ps.mode==="T"?" selected":"")+'>Tactical (tragi cărți)</option><option value="F"'+(ps.mode==="F"?" selected":"")+'>Fixed (2 cărți fixe)</option></select>';
      if(ps.mode==="F")h+='<div class="vpb">'+SEC.filter(function(c){return c.fx}).map(function(c){return '<label class="opt"><input type="checkbox" data-act="fix" data-s="'+s+'" data-n="'+esc(c.n)+'"'+(ps.fixed.indexOf(c.n)>=0?' checked':'')+'> '+esc(c.n)+'</label>'}).join("")+'</div><div class="legend">Alege exact 2 cărți Fixed.</div>';
      h+='<div class="vpb">'+B("ready",s,"Confirmă alegerea",'',!okFix)+'</div>';
    }else{
      h+=ps.ready?'<div class="info">Alegere confirmată: <b>'+(ps.mode==="T"?"Tactical":"Fixed – "+esc(ps.fixed.join(", ")))+'</b></div>':'<div class="info">Încă nu a ales.</div>';
      if(ps.ready&&mine&&live)h+='<div class="vpb">'+B("unready",s,"Schimbă alegerea","",false,"ghost")+'</div>';
    }
  }else if(ps.mode==="F"){
    h+=ps.fixed.map(function(n){
      var c=cardOf(n),used=fixedSum(ps,n);
      return '<div class="mis">'+cardHtml(c)+'<div class="legend">Acumulat: '+used+' / 20 VP (Fixed nu se aruncă)</div><div class="vpb">'+SECV[n].f.map(function(v){return B("sv",s,'+'+v+' VP',' data-n="'+esc(n)+'" data-v="'+v+'"',!(mine&&live&&started&&!ended&&used+v<=20))}).join("")+'</div></div>';
    }).join("")||'<div class="legend">Nicio carte Fixed aleasă.</div>';
  }else{
    var deck=deckOf(ps),canDraw=mine&&live&&started&&!ended&&a===s&&ps.drawT!==M.turn&&deck.length>0;
    var why=!started?"Alege mai întâi cine începe.":ended?"Bătălia s-a încheiat.":a!==s?"Tragi doar la începutul propriei ture.":ps.drawT===M.turn?"Ai tras deja în tura aceasta.":deck.length?"":"Pachetul e gol.";
    h+='<div class="vpb">'+B("draw",s,"Trage 2 cărți (faza Command)","",!canDraw)+'</div><div class="legend">'+why+' Pachet: '+deck.length+' cărți.</div>';
    h+=ps.hand.map(function(n){
      var c=cardOf(n),w=WD[n],myT=mine&&live&&started&&!ended&&a===s;
      var canW=w&&myT&&ps.fresh.indexOf(n)>=0&&(!w.o||ps.hand.indexOf(w.o)>=0)&&(!w.r1||r===1);
      return '<div class="mis">'+cardHtml(c)+'<div class="vpb">'+SECV[n].t.map(function(v){return B("sv",s,'+'+v+' VP îndeplinită',' data-n="'+esc(n)+'" data-v="'+v+'"',!(mine&&live&&started))}).join("")
        +B("toss",s,"Aruncă (+1 CP)",' data-n="'+esc(n)+'"',!myT,"ghost")
        +B("mull",s,"Re-trage (1 CP, o dată)",' data-n="'+esc(n)+'"',!(myT&&ps.drawT===M.turn&&!ps.rd&&cp>=1),"ghost")
        +(w?B("wd",s,"Re-trage („când e trasă”)",' data-n="'+esc(n)+'"',!canW,"ghost"):'')+'</div></div>';
    }).join("")||'<div class="legend">Nicio carte activă.</div>';
  }

  h+='<details data-k="log'+s+'"'+(openS["log"+s]?' open':'')+'><summary>Istoric ('+ps.log.length+')</summary>'+ps.log.map(function(e,i){
    return '<div class="lg">R'+e.r+' · '+(e.k==="cp"?"CP":e.k==="pri"?"Primar":"Secundar")+' '+(e.v>0?"+":"")+e.v+' · '+esc(e.l)+(mine&&live?' '+B("rm",s,"×",' data-i="'+i+'"',false,"ghost"):'')+'</div>';
  }).reverse().join("")+'</details></section>';
  return h;
}

function fmtT(ms){
  var s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  return (h?h+":"+(m<10?"0":""):"")+m+":"+(x<10?"0":"")+x;
}
function cumul(ps){
  var out=[],t=0;
  for(var r=1;r<=5;r++){t+=Math.min(15,Math.max(0,roundVP(ps,"pri",r)))+Math.min(15,Math.max(0,roundVP(ps,"sec",r)));out.push(t)}
  out.push(totalPS(ps));
  return out;
}
function chart(ca,cb){
  var W=320,H=150,px=30,py=14,mx=Math.max(10,Math.max.apply(null,ca.concat(cb))),L=["R1","R2","R3","R4","R5","Final"];
  function X(i){return px+i*(W-px-12)/5}
  function Y(v){return H-22-(v/mx)*(H-22-py)}
  function line(c,col){return '<polyline fill="none" stroke-width="3" style="stroke:'+col+'" points="'+c.map(function(v,i){return X(i)+","+Y(v)}).join(" ")+'"/>'+c.map(function(v,i){return '<circle cx="'+X(i)+'" cy="'+Y(v)+'" r="3.5" style="fill:'+col+'"/>'}).join("")}
  return '<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="VP cumulat pe runde"><line x1="'+px+'" y1="'+Y(0)+'" x2="'+(W-12)+'" y2="'+Y(0)+'" style="stroke:var(--line)"/>'
    +L.map(function(l,i){return '<text x="'+X(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" style="fill:var(--muted)">'+l+'</text>'}).join("")
    +'<text x="2" y="'+(py+4)+'" font-size="11" style="fill:var(--muted)">'+mx+'</text>'+line(ca,"var(--brass)")+line(cb,"var(--blood)")+'</svg>';
}
function summaryHtml(){
  var m=M,na=esc(m.pa.name),nb=esc(m.pb.name);
  var h='<section class="summ"><h2>Rezumat</h2>'+chart(cumul(m.sa),cumul(m.sb))+'<div class="legend"><span style="color:var(--brass)">■</span> '+na+' · <span style="color:var(--blood)">■</span> '+nb+' · VP cumulat pe runde</div>';
  h+='<div class="tblw"><table class="tbl"><tr><th></th><th>Jucător</th>'+[1,2,3,4,5].map(function(i){return '<th>R'+i+'</th>'}).join("")+'<th>F</th><th>+10</th><th>Total</th></tr>';
  ["a","b"].forEach(function(s){
    var ps=m["s"+s],fin=ps.log.reduce(function(a,e){return a+(e.f?e.v:0)},0);
    h+='<tr><td>'+(m.atk?(m.atk===s?"A":"D"):"")+'</td><td>'+esc(m["p"+s].name)+'</td>'+[1,2,3,4,5].map(function(i){return '<td>'+(Math.min(15,Math.max(0,roundVP(ps,"pri",i)))+Math.min(15,Math.max(0,roundVP(ps,"sec",i))))+'</td>'}).join("")+'<td>'+fin+'</td><td>'+(ps.br?10:0)+'</td><td><b>'+totalPS(ps)+'</b></td></tr>';
  });
  h+='</table></div>';
  ["a","b"].forEach(function(s){
    var ps=m["s"+s],gain=0,spent=0;
    ps.log.forEach(function(e){if(e.k==="cp"){if(e.v>0)gain+=e.v;else spent-=e.v}});
    var top=ps.log.filter(function(e){return e.k!=="cp"&&e.v>0}).sort(function(x,y){return y.v-x.v}).slice(0,3);
    h+='<div class="info"><b>'+esc(m["p"+s].name)+'</b> · Primar '+sums(ps,"pri")+' · Secundar '+sums(ps,"sec")+' · CP câștigat '+gain+', folosit '+spent+(m.tt&&m.tt[s]?' · timp jucat '+fmtT(m.tt[s]):'')
      +(top.length?'<div class="wev">Cele mai mari punctaje: '+top.map(function(e){return '+'+e.v+' '+(e.k==="pri"?"Primar":"Secundar")+' (R'+e.r+')'}).join(", ")+'</div>':'')+'</div>';
  });
  if(m.atk)h+='<div class="info">Atacator: <b>'+esc(m["p"+m.atk].name)+'</b> · Defender: <b>'+esc(m["p"+(m.atk==="a"?"b":"a")].name)+'</b></div>';
  return h+'</section>';
}

function render(){
  var m=M,started=m.first!=null,ended=m.turn>=10,a=actS(),live=m.status==="active";
  ["sa","sb"].forEach(function(k){m[k]=Object.assign(newPS(),m[k])});
  var rdy=!!(m.sa.ready&&m.sb.ready),roleOk=!!m.atk,na=esc(m.pa.name),nb=esc(m.pb.name);
  var h='<h1>'+na+' <span class="vs">vs</span> '+nb+'</h1>';
  h+='<div class="info">'+(m.type==="tournament"?"Meci de turneu":"Meci amical")+(m.deploy?' · Deployment: <b>'+esc(m.deploy)+'</b>':'')+(m.twist?' · Twist: <b>'+esc(m.twist)+'</b> – '+esc(TWISTS[m.twist]):'')+'</div>';
  if(m.status==="invited"){
    h+='<div class="banner">Invitație în așteptare.'+(App.me===m.b?'<div class="vpb" style="justify-content:center">'+B("acc","","Acceptă","")+B("dec","","Refuză","",false,"ghost")+'</div>':' Așteaptă răspunsul lui '+esc(m.b)+'.')+'</div>';
    $("box").innerHTML=h;return;
  }
  if(m.status==="declined"||m.status==="cancelled"){$("box").innerHTML=h+'<div class="banner">'+(m.status==="cancelled"?"Meciul a fost anulat (un jucător a fost șters).":"Invitația a fost refuzată sau anulată.")+'</div>';return}

  h+='<div class="banner"><div class="bigsc">'+totalPS(m.sa)+' – '+totalPS(m.sb)+'</div>';
  if(m.status==="done"){
    h+=(m.winner==="draw"?'Remiză':'Câștigător: <b>'+esc(m.winner==="a"?m.pa.name:m.pb.name)+'</b>'+(m.wo?' (neprezentare)':''))+(App.isAdmin?'<div class="vpb" style="justify-content:center">'+B("reopen","","Redeschide meciul","",false,"ghost")+'</div>':'');
  }else if(m.status==="confirm"){
    var pn=esc(m["p"+m.pBy].name),res=m.pw==="draw"?'remiză':'câștigă <b>'+esc(m["p"+m.pw].name)+'</b>',other=m.pBy==="a"?"b":"a";
    h+='<div>'+pn+' propune scorul final <b>'+m.pta+' – '+m.ptb+'</b>, '+res+'.</div>';
    if(App.isAdmin||App.me===m[other])h+='<div class="vpb" style="justify-content:center">'+B("confirm","","Confirmă scorul")+B("contest","","Contestă","",false,"ghost")+'</div>';
    else h+='<div class="legend">Se așteaptă confirmarea adversarului.</div><div class="vpb" style="justify-content:center">'+B("withdraw","","Retrage propunerea","",false,"ghost")+'</div>';
  }else if(!started){
    var oth=m.atk==="a"?"b":"a";
    h+='<div class="steps"><div><b>1. Rolul</b> (câștigătorul zarului alege)<div class="vpb">'
      +(m.atk?'Atacator: <b>'+esc(m["p"+m.atk].name)+'</b> · Defender: <b>'+esc(m["p"+oth].name)+'</b> '+B("atk","","Inversează",' data-v="'+oth+'"',false,"ghost"):B("atk","",na+" atacator",' data-v="a"')+B("atk","",nb+" atacator",' data-v="b"'))
      +'</div>'+(m.atk?'<div class="legend">Defender-ul își așază primul unitățile, iar Atacatorul începe redeployment-ul.</div>':'')+'</div>'
      +'<div><b>2. Alegerile</b> (Force Disposition și secundare): '+na+(m.sa.ready?' ✓':' …')+' · '+nb+(m.sb.ready?' ✓':' …')+'</div>'
      +'<div><b>3. Cine joacă prima tură</b> (zar, câștigătorul decide)<div class="vpb">'+B("first","",na,' data-v="a"',!(rdy&&roleOk))+B("first","",nb,' data-v="b"',!(rdy&&roleOk))+B("first","","Zar random",' data-v="rand"',!(rdy&&roleOk),"ghost")+'</div></div></div>';
  }else if(!ended){
    var an=m[a];
    h+='Runda <b>'+rd()+'</b> din 5 · Tura lui <b>'+esc(P(a).name)+'</b> · <span class="timer" id="tmr" data-ts="'+(m.ts||0)+'"></span><div class="vpb" style="justify-content:center">'+B("end","","Termină tura",'',!(App.isAdmin||App.me===an))+B("back","","Tura anterioară","",false,"ghost")+'</div>';
  }else{
    h+='Bătălia s-a încheiat. Adaugă punctele „Final bătălie” (F), apoi propune scorul final.<div class="vpb" style="justify-content:center">'+((App.me===m.a||App.me===m.b)?B("propose","","Propune scorul final",""):'')+(App.isAdmin?B("finish","","Încheie direct (admin)","",false,"ghost"):'')+B("back","","Tura anterioară","",false,"ghost")+'</div>';
  }
  h+='</div>';
  if(m.status==="done")h+=summaryHtml();
  var first=App.me===m.b?"b":"a";
  h+='<div class="sides">'+sideHtml(first)+sideHtml(first==="a"?"b":"a")+'</div>';
  if(App.isAdmin)h+='<p style="margin-top:24px">'+B("del","","Șterge meciul","",false,"ghost")+'</p>';
  $("box").innerHTML=h;
  [].forEach.call(document.querySelectorAll("details[data-k]"),function(d){d.addEventListener("toggle",function(){openS[d.getAttribute("data-k")]=d.open})});
}

function afterDone(){if(M.type==="tournament"&&M.tid)Tourney.tryAdvance(M.tid).catch(fail)}
function verdict(){
  var ta=totalPS(M.sa),tb=totalPS(M.sb),w=ta>tb?"a":(tb>ta?"b":"draw");
  if(w==="draw"&&M.type==="tournament"&&(M.fmt||"elim")==="elim")w=confirm("Egalitate "+ta+"–"+tb+". "+M.pa.name+" trece mai departe? OK = "+M.pa.name+", Anulează = "+M.pb.name)?"a":"b";
  return {ta:ta,tb:tb,w:w};
}

function go(a,el){
  var s=el.getAttribute("data-s"),n=el.getAttribute("data-n"),v=+el.getAttribute("data-v"),i=+el.getAttribute("data-i");
  if(a==="acc"){upd({status:"active",pa:App.snap(M.a),pb:App.snap(M.b)});return}
  if(a==="dec"){upd({status:"declined"});return}
  if(a==="atk"){upd({atk:el.getAttribute("data-v")});return}
  if(a==="first"){if(!(M.sa.ready&&M.sb.ready&&M.atk))return;upd({first:el.getAttribute("data-v")==="rand"?pick(["a","b"]):el.getAttribute("data-v"),ts:Date.now()});return}
  if(a==="end"){var cur=actS(),o={turn:M.turn+1,ts:Date.now()};if(cur&&M.ts)o["tt."+cur]=firebase.firestore.FieldValue.increment(Date.now()-M.ts);upd(o);return}
  if(a==="back"){upd({turn:Math.max(0,M.turn-1),ts:Date.now()});return}
  if(a==="reopen"){upd({status:"active",winner:null,pw:null,pBy:null});return}
  if(a==="del"){if(confirm("Ștergi meciul definitiv?"))App.db.collection("matches").doc(mid).delete().then(function(){location.href="index.html"}).catch(fail);return}
  if(a==="finish"){var f=verdict();upd({status:"done",winner:f.w,fta:f.ta,ftb:f.tb}).then(afterDone);return}
  if(a==="propose"){var q=verdict();upd({status:"confirm",pw:q.w,pBy:App.me===M.b?"b":"a",pta:q.ta,ptb:q.tb});return}
  if(a==="confirm"){upd({status:"done",winner:M.pw,fta:M.pta,ftb:M.ptb}).then(afterDone);return}
  if(a==="contest"||a==="withdraw"){upd({status:"active",pw:null,pBy:null});return}
  if(a==="pv"){var pn=primOf(s),L=parseLine(PRI[pn].r[i]);mut(s,function(ps){logAdd(ps,"pri",v,pn+" – "+L.text.slice(0,45),L.w==="F")});return}
  if(a==="sv"){mut(s,function(ps){logAdd(ps,"sec",v,n);if(ps.mode==="T"){rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n)}});return}
  if(a==="toss"){mut(s,function(ps){logAdd(ps,"cp",1,"Aruncat: "+n);rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n)});return}
  if(a==="mull"){mut(s,function(ps){
    logAdd(ps,"cp",-1,"Re-trage: "+n);rm(ps.hand,n);rm(ps.fresh,n);ps.used.push(n);ps.rd=true;
    var d=shuffle(deckOf(ps));if(d.length){ps.hand.push(d[0]);ps.fresh.push(d[0])}
  });return}
  if(a==="wd"){
    var w=WD[n];if(w.ask&&!confirm(w.ask))return;
    mut(s,function(ps){
      rm(ps.hand,n);rm(ps.fresh,n);if(!w.b)ps.used.push(n);
      var d=shuffle(deckOf(ps).filter(function(x){return x!==n}));
      if(d.length){ps.hand.push(d[0]);ps.fresh.push(d[0])}
    });return;
  }
  if(a==="draw"){mut(s,function(ps){var d=shuffle(deckOf(ps));ps.fresh=[];for(var k=0;k<2&&k<d.length;k++){ps.hand.push(d[k]);ps.fresh.push(d[k])}ps.drawT=M.turn});return}
  if(a==="rm"){mut(s,function(ps){ps.log.splice(i,1)});return}
  if(a==="cp"){mut(s,function(ps){logAdd(ps,"cp",v,"manual")});return}
  if(a==="man"){var k=el.getAttribute("data-k");mut(s,function(ps){logAdd(ps,k,v,"manual")});return}
}

function onChange(el){
  var a=el.getAttribute("data-act"),s=el.getAttribute("data-s");
  if(a==="br")mut(s,function(ps){ps.br=el.checked});
  if(a==="mode")mut(s,function(ps){ps.mode=el.value;if(el.value!=="F")ps.fixed=[]});
  if(a==="pmis"){var o2={};o2[s==="a"?"pa":"pb"]=Object.assign({},P(s),{prim:el.value});upd(o2)}
  if(a==="fd"){var o={};o[s==="a"?"pa":"pb"]=Object.assign({},P(s),{fd:el.value});upd(o)}
  if(a==="fix"){
    var n=el.getAttribute("data-n"),ps=PS(s);
    if(el.checked&&ps.fixed.length>=2){el.checked=false;return}
    mut(s,function(ps){if(el.checked)ps.fixed.push(n);else rm(ps.fixed,n)});
  }
}

App.start(function(){
  setInterval(function(){var e=$("tmr");if(e){var ts=+e.getAttribute("data-ts");e.textContent=ts?fmtT(Date.now()-ts):""}},1000);
  App.db.collection("matches").doc(mid).onSnapshot(function(d){
    if(!d.exists){$("box").innerHTML='<p class="err">Meciul nu există.</p>';return}
    M=Object.assign({id:d.id},d.data());render();
  },fail);
  $("box").addEventListener("click",function(e){var el=e.target.closest("button[data-act]");if(el&&!el.disabled&&M)go(el.getAttribute("data-act"),el)});
  $("box").addEventListener("change",function(e){if(M&&e.target.getAttribute("data-act"))onChange(e.target)});
});
