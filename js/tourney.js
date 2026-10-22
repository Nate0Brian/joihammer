var Tourney={};
function pkey(a,b){return [a,b].sort().join("||")}
function tier(n){return n===2?"Finala":n===4?"Semifinale":n===8?"Sferturi":n===16?"Optimi de finală":"Runda de "+n}

/* ID determinist: dacă doi clienți încearcă să creeze aceeași rundă, nu apar dubluri */
Tourney.mk=function(tid,ri,i,a,b,fmt,w){
  var ref=App.db.collection("matches").doc(tid+"_"+ri+"_"+i);
  w.set(ref,App.newMatch({type:"tournament",tid:tid,fmt:fmt,ri:ri,a:a,b:b,status:"active",pa:App.snap(a),pb:App.snap(b)}));
  return ref.id;
};
Tourney.ents=function(tid,ri,pairs,byes,fmt,w){
  var ents=[];
  byes.forEach(function(n){ents.push({bye:n})});
  pairs.forEach(function(p,i){ents.push({m:Tourney.mk(tid,ri,i,p[0],p[1],fmt,w)})});
  return ents;
};
Tourney.roundDone=function(t,ri,MS){
  return t.rounds[ri].ents.every(function(e){return e.bye||(MS[e.m]&&MS[e.m].status==="done")});
};
Tourney.winners=function(t,ri,MS){
  return t.rounds[ri].ents.map(function(e){
    if(e.bye)return e.bye;
    var m=MS[e.m];return m.winner==="b"?m.b:m.a;
  });
};
Tourney.standings=function(t,MS){
  var S={};
  t.players.forEach(function(p){S[p]={n:p,pts:0,w:0,d:0,l:0,vf:0,va:0}});
  t.rounds.forEach(function(r){r.ents.forEach(function(e){
    if(e.bye){if(S[e.bye]){S[e.bye].pts+=3;S[e.bye].w++}return}
    var m=MS[e.m];if(!m||m.status!=="done"||!S[m.a]||!S[m.b])return;
    var ta=totalPS(Object.assign(newPS(),m.sa)),tb=totalPS(Object.assign(newPS(),m.sb)),A=S[m.a],B=S[m.b];
    A.vf+=ta;A.va+=tb;B.vf+=tb;B.va+=ta;
    if(m.winner==="a"){A.pts+=3;A.w++;B.l++}
    else if(m.winner==="b"){B.pts+=3;B.w++;A.l++}
    else{A.pts++;B.pts++;A.d++;B.d++}
  })});
  return Object.keys(S).map(function(k){return S[k]}).sort(function(x,y){
    return y.pts-x.pts||(y.vf-y.va)-(x.vf-x.va)||y.vf-x.vf||(x.n<y.n?-1:1);
  });
};
/* tabelă (fiecare cu fiecare), metoda cercului */
Tourney.rr=function(pl,r){
  var L=pl.slice();if(L.length%2)L.push(null);
  var n=L.length,rot=L.slice(1),pairs=[],byes=[];
  for(var i=0;i<r;i++)rot.unshift(rot.pop());
  var arr=[L[0]].concat(rot);
  for(var j=0;j<n/2;j++){
    var x=arr[j],y=arr[n-1-j];
    if(x===null)byes.push(y);else if(y===null)byes.push(x);else pairs.push([x,y]);
  }
  return {pairs:pairs,byes:byes};
};
Tourney.pairNames=function(list,played,strict){
  if(!list.length)return [];
  var f=list[0];
  for(var i=1;i<list.length;i++){
    var b=list[i];if(strict&&played[pkey(f,b)])continue;
    var sub=Tourney.pairNames(list.filter(function(x,j){return j!==0&&j!==i}),played,strict);
    if(sub)return [[f,b]].concat(sub);
  }
  return null;
};
/* sistem elvețian: după clasament, fără reveniri dacă se poate */
Tourney.swiss=function(t,MS){
  var st=Tourney.standings(t,MS).map(function(x){return x.n}),played={},had={},byes=[];
  t.rounds.forEach(function(r){r.ents.forEach(function(e){
    if(e.bye)had[e.bye]=1;else if(MS[e.m])played[pkey(MS[e.m].a,MS[e.m].b)]=1;
  })});
  if(st.length%2){
    for(var i=st.length-1;i>=0;i--)if(!had[st[i]]){byes=[st[i]];st.splice(i,1);break}
    if(!byes.length)byes=[st.pop()];
  }
  return {pairs:Tourney.pairNames(st,played,true)||Tourney.pairNames(st,played,false),byes:byes};
};
Tourney.advance=async function(t,MS){
  var fmt=t.fmt||"elim",ri=t.rounds.length-1;
  if(t.status==="done"||!Tourney.roundDone(t,ri,MS))return;
  var tref=App.db.collection("tournaments").doc(t.id);
  await App.db.runTransaction(async function(tx){
    var cur=(await tx.get(tref)).data();
    if(cur.status==="done"||cur.rounds.length!==t.rounds.length)return;
    if(fmt==="elim"){
      var w=Tourney.winners(t,ri,MS);
      if(w.length===1){tx.update(tref,{status:"done",winner:w[0]});return}
      var pairs=[];for(var i=0;i<w.length;i+=2)pairs.push([w[i],w[i+1]]);
      tx.update(tref,{rounds:cur.rounds.concat([{name:tier(w.length),ents:Tourney.ents(t.id,ri+1,pairs,[],fmt,tx)}])});
      return;
    }
    if(t.rounds.length>=t.totalRounds){tx.update(tref,{status:"done",winner:Tourney.standings(t,MS)[0].n});return}
    var pb=fmt==="rr"?Tourney.rr(t.players,ri+1):Tourney.swiss(t,MS);
    tx.update(tref,{rounds:cur.rounds.concat([{name:"Runda "+(ri+2),ents:Tourney.ents(t.id,ri+1,pb.pairs,pb.byes,fmt,tx)}])});
  });
};
/* apelat și din pagina de meci, imediat ce un meci de turneu se încheie */
Tourney.tryAdvance=async function(tid){
  var d=await App.db.collection("tournaments").doc(tid).get();if(!d.exists)return;
  var t=Object.assign({id:d.id},d.data()),s=await App.db.collection("matches").where("tid","==",tid).get(),MS={};
  s.docs.forEach(function(x){MS[x.id]=Object.assign({id:x.id},x.data())});
  await Tourney.advance(t,MS);
};
