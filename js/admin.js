var sec;
async function makeAccount(u,p,reset){
  var d=await App.db.collection("logins").doc(u).get(),v=d.exists?(d.data().v||1)+1:1;
  if(d.exists&&!reset)throw {message:"Userul există deja. Folosește „Resetează parola”."};
  if(!sec)sec=firebase.initializeApp(CFG,"sec");
  var email=u+"."+v+DOM,sa=sec.auth();
  await sa.createUserWithEmailAndPassword(email,p);await sa.signOut();
  await App.db.collection("logins").doc(u).set({email:email,v:v});
  if(!d.exists)await App.db.collection("players").doc(u).set({army:"",det:"",fd:FDS[0]});
}
async function removeUser(p){
  var db=App.db,mq=db.collection("matches"),docs={};
  try{
    var s1=await mq.where("a","==",p).get(),s2=await mq.where("b","==",p).get();
    [s1,s2].forEach(function(s){s.docs.forEach(function(d){docs[d.id]=d})});
    var open=Object.keys(docs).filter(function(id){return ["invited","active","confirm"].indexOf(docs[id].data().status)>=0});
    var tw=open.filter(function(id){return docs[id].data().type==="tournament"&&docs[id].data().status!=="invited"}).length;
    if(!confirm("Ștergi jucătorul "+p+"? Nu se va mai putea loga.\n\nSe închid automat "+open.length+" meciuri deschise: meciurile de turneu ("+tw+") se dau câștigate adversarului (neprezentare), restul se anulează. Scorurile deja încheiate rămân."))return;
    var b=db.batch(),tids={};
    open.forEach(function(id){
      var m=docs[id].data(),ref=mq.doc(id);
      if(m.status!=="invited"&&m.type==="tournament"){b.update(ref,{status:"done",winner:m.a===p?"b":"a",wo:true,pw:null,pBy:null});if(m.tid)tids[m.tid]=1}
      else b.update(ref,{status:"cancelled"});
    });
    var ts=await db.collection("tournaments").get();
    ts.docs.forEach(function(d){var t=d.data();if(t.status!=="done"&&t.players.indexOf(p)>=0){b.update(d.ref,{out:firebase.firestore.FieldValue.arrayUnion(p)});tids[d.id]=1}});
    b.delete(db.collection("logins").doc(p));b.delete(db.collection("players").doc(p));
    await b.commit();
    for(var tid in tids){try{await Tourney.tryAdvance(tid)}catch(e){fail(e)}}
    $("amsg").textContent="Jucătorul "+p+" a fost șters; "+open.length+" meciuri închise.";
  }catch(e){alert(nice(e))}
}
function draw(){
  $("plist").innerHTML=App.players.map(function(p){
    return '<div class="pl"><div style="flex:1"><b>'+esc(p.name)+'</b><small>'+esc([p.army,p.det,p.fd].filter(Boolean).join(" · "))+'</small></div><div class="row">'+(p.name!=="admin"?'<button class="ghost sm" data-act="rpw" data-p="'+esc(p.name)+'">Resetează parola</button><button class="ghost sm" data-act="rmp" data-p="'+esc(p.name)+'">Șterge</button>':'')+'</div></div>';
  }).join("")||'<p class="empty">Niciun jucător.</p>';
}
App.start(function(){
  if(!App.isAdmin){location.href="index.html";return}
  App.onPlayers=draw;
  $("nb").onclick=async function(){
    var u=$("nu").value.trim().toLowerCase().replace(/[^a-z0-9_]/g,""),p=$("np").value;$("amsg").textContent="";
    if(!u||u==="admin"){$("amsg").textContent="Username: litere mici, cifre sau _, diferit de „admin”.";return}
    try{await makeAccount(u,p,false);$("nu").value="";$("np").value="";$("amsg").textContent="Utilizator creat: "+u}catch(e){$("amsg").textContent=nice(e)}
  };
  $("plist").addEventListener("click",async function(e){
    var el=e.target.closest("button[data-act]");if(!el)return;
    var a=el.getAttribute("data-act"),p=el.getAttribute("data-p");
    if(a==="rpw"){var np=prompt("Parola nouă pentru "+p+" (minim 6 caractere):");if(!np)return;try{await makeAccount(p,np,true);alert("Parola lui "+p+" a fost schimbată.")}catch(x){alert(nice(x))}}
    if(a==="rmp")removeUser(p);
  });
});
