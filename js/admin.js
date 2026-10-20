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
function draw(){
  $("plist").innerHTML=App.players.map(function(p){
    return '<div class="pl"><div style="flex:1"><b>'+esc(p.name)+'</b><small>'+esc([p.army,p.det,p.fd].filter(Boolean).join(" · "))+'</small></div><div class="row">'+(p.name!=="admin"?'<button class="ghost sm" data-act="rpw" data-p="'+esc(p.name)+'">Resetează parola</button>':'')+'<button class="ghost sm" data-act="rmp" data-p="'+esc(p.name)+'">Șterge</button></div></div>';
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
    if(a==="rmp"){if(!confirm("Ștergi jucătorul "+p+"? Nu se va mai putea loga."))return;var b=App.db.batch();b.delete(App.db.collection("logins").doc(p));b.delete(App.db.collection("players").doc(p));try{await b.commit()}catch(x){alert(nice(x))}}
  });
});
