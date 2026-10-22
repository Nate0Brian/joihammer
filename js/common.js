var ADMIN_EMAIL="admin@warhammer.example",DOM="@warhammer.example";
function $(i){return document.getElementById(i)}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function fail(e){var s=$("st");if(s)s.textContent="Eroare: "+((e&&(e.code||e.message))||e)}
function nice(e){var c=(e&&e.code)||"";if(c==="auth/weak-password")return "Parola trebuie să aibă minim 6 caractere.";if(c==="auth/email-already-in-use")return "Contul există deja în Firebase. Alege alt username.";if(c.indexOf("auth/")===0)return "Username sau parolă greșită. ("+c+")";if(c==="permission-denied")return "Nu ai voie să faci asta.";return (e&&e.message)||String(e)}

var App={me:"",isAdmin:false,players:[],auth:null,db:null,onPlayers:function(){}};

App.start=function(cb,onOut){
  if(CFG.apiKey==="PUNE_AICI"){document.body.insertAdjacentHTML("afterbegin",'<p class="err" style="padding:16px">Completează datele Firebase în js/config.js</p>');return}
  firebase.initializeApp(CFG);App.auth=firebase.auth();App.db=firebase.firestore();
  App.auth.onAuthStateChanged(function(u){
    if(!u){if(onOut)onOut();else location.href="index.html";return}
    App.me=u.email.split(".")[0];App.isAdmin=u.email===ADMIN_EMAIL;
    if($("nav")){App.nav();App.watchInvites()}
    App.db.collection("players").onSnapshot(function(s){
      App.players=s.docs.map(function(d){var x=d.data();return {name:d.id,army:x.army||"",det:x.det||"",fd:x.fd||FDS[0]}}).sort(function(a,b){return a.name<b.name?-1:1});
      App.onPlayers();
    },fail);
    cb();
  });
};
App.nav=function(){
  var cur=location.pathname.split("/").pop()||"index.html";
  var L=[["index.html","Acasă"],["friendly.html","Meci amical"],["tournaments.html","Turnee"],["watch.html","Live"],["stats.html","Clasament"],["profile.html","Profil"]];
  if(App.isAdmin)L.push(["admin.html","Admin"]);
  $("nav").innerHTML=L.map(function(l){return '<a href="'+l[0]+'"'+(cur===l[0]?' class="on"':'')+'>'+l[1]+'</a>'}).join("")+'<a href="#" id="out">Ieși ('+esc(App.me)+')</a>';
  $("out").onclick=function(e){e.preventDefault();App.auth.signOut()};
};
App.snap=function(n){
  var p=App.players.filter(function(x){return x.name===n})[0]||{name:n,army:"",det:"",fd:FDS[0]};
  return {name:p.name,army:p.army,det:p.det,fd:p.fd};
};
App.newMatch=function(o){
  return Object.assign({n:Date.now(),atk:null,first:null,turn:0,sa:newPS(),sb:newPS(),deploy:pick(DEPLOYS)},o);
};
App.watchMatches=function(cb){
  var A=[],B=[],q=App.db.collection("matches");
  function out(){var m={};A.concat(B).forEach(function(x){m[x.id]=x});cb(Object.keys(m).map(function(k){return m[k]}).sort(function(x,y){return y.n-x.n}))}
  function map(s){return s.docs.map(function(d){return Object.assign({id:d.id},d.data())})}
  q.where("a","==",App.me).onSnapshot(function(s){A=map(s);out()},fail);
  q.where("b","==",App.me).onSnapshot(function(s){B=map(s);out()},fail);
};
App.score=function(m){return totalPS(Object.assign(newPS(),m.sa))+" – "+totalPS(Object.assign(newPS(),m.sb))};
App.matchRow=function(m){
  var st={invited:"Invitație",declined:"Refuzat",active:"În desfășurare",confirm:"Așteaptă confirmarea scorului",done:"Încheiat"}[m.status]||m.status;
  var res=m.status==="done"&&m.winner?" · "+(m.winner==="draw"?"remiză":"câștigă "+esc(m.winner==="a"?m.a:m.b)):"";
  return '<a class="card rowlink" href="match.html?id='+m.id+'"><b>'+(m.type==="tournament"?"Turneu":"Amical")+' · '+esc(m.a)+' vs '+esc(m.b)+'</b><span>'+st+(m.status==="invited"||m.status==="declined"?"":" · "+App.score(m))+res+'</span></a>';
};

/* notificare: număr de invitații pe meniu + notificare de browser (cât timp aplicația e deschisă) */
App.badge=function(n){var a=document.querySelector('#nav a[href="friendly.html"]');if(a)a.textContent="Meci amical"+(n?" ("+n+")":"")};
App.notify=function(t,b){
  try{new Notification(t,{body:b})}catch(e){
    if(navigator.serviceWorker)navigator.serviceWorker.ready.then(function(r){r.showNotification(t,{body:b})}).catch(function(){});
  }
};
App.watchInvites=function(){
  var first=true;
  App.db.collection("matches").where("b","==",App.me).where("status","==","invited").onSnapshot(function(s){
    App.badge(s.size);
    if(!first&&"Notification" in window&&Notification.permission==="granted")s.docChanges().forEach(function(c){if(c.type==="added")App.notify("Invitație la meci",c.doc.data().a+" te invită la un meci amical.")});
    first=false;
  },function(){});
};
if("serviceWorker" in navigator)window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
