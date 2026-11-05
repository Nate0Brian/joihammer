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
  Data.load().then(function(){App.auth.onAuthStateChanged(async function(u){
    if(!u){if(onOut)onOut();else location.href="index.html";return}
    App.isAdmin=u.email===ADMIN_EMAIL;
    if(App.isAdmin){App.me="admin";}
    else {
      // Username-ul canonic este ID-ul documentului logins/{username}, nu numele
      // complet din email (care poate conține sufixe precum .1).
      var email=String(u.email||"").toLowerCase();
      var candidate=email.split("@")[0].split(".")[0];
      try {
        var loginDoc=await App.db.collection("logins").doc(candidate).get();
        if(!loginDoc.exists || String((loginDoc.data()||{}).email||"").toLowerCase()!==email){
          throw new Error("Contul autentificat nu corespunde documentului logins/"+candidate+". Verifică emailul din Firebase Authentication și câmpul email din Firestore.");
        }
        App.me=loginDoc.id;
      } catch(e) { fail(e); if(onOut)onOut(); return; }
    }
    if($("nav")){App.nav();App.watchInvites()}
    App.db.collection("players").onSnapshot(function(s){
      App.players=s.docs.map(function(d){var x=d.data();return {name:d.id,army:x.army||"",det:x.det||"",dets:x.dets||[],fd:x.fd||FDS[0]}}).sort(function(a,b){return a.name<b.name?-1:1});
      App.onPlayers();
    },fail);
    cb();
  })}).catch(function(e){document.body.insertAdjacentHTML("afterbegin",'<p class="err" style="padding:16px">Nu pot citi fișierele din folderul data/ ('+esc(e.message||e)+')</p>')});
};
App.nav=function(){
  var cur=location.pathname.split("/").pop()||"index.html";
  var items=[
    ["index.html","Home","⌂","primary"],
    ["index.html#act","Matches","⚔","primary"],
    ["rules.html","Rules","▤","primary"],
    ["stratagems.html","Strats","✦","primary"],
    ["friendly.html","Friendly","⚔","more"],
    ["tournaments.html","Tournaments","♜","more"],
    ["watch.html","Live","◉","more"],
    ["missions.html","Missions","◇","more"],
    ["stats.html","Leaderboard","▥","more"],
    ["army-stats.html","Army Stats","♙","more"],
    ["profile.html","Profile","◉","more"]
  ];
  if(App.isAdmin)items.push(["admin.html","Admin","⚙","more"]);
  var primary=items.filter(function(x){return x[3]==="primary"});
  var secondary=items.filter(function(x){return x[3]==="more"});
  function isActive(x){
    if(x[0].indexOf("#")>=0)return cur===x[0].split("#")[0]&&location.hash===x[0].substring(x[0].indexOf("#"));
    return cur===x[0];
  }
  function link(x,cls){return '<a class="'+(isActive(x)?'on ':'')+(cls||'')+'" href="'+x[0]+'"><span class="nav-glyph" aria-hidden="true">'+x[2]+'</span><span class="nav-label">'+x[1]+'</span></a>'}
  var nav=$("nav");
  nav.innerHTML=
    '<div class="nav-brand"><span class="brand-seal">✠</span><span class="brand-copy"><b>JOIHAMMER</b><small>IMPERIAL COMMAND SYSTEM</small></span></div>'+
    '<div class="nav-desktop-links">'+primary.map(function(x){return link(x,'nav-primary')}).join('')+
      '<div class="nav-group-label">COMMAND ARCHIVE</div>'+secondary.map(function(x){return link(x,'nav-secondary')}).join('')+
      '<button class="nav-logout" id="out" type="button"><span class="nav-glyph">⇥</span><span>Sign out · '+esc(App.me)+'</span></button></div>'+
    '<div class="nav-mobile-links">'+primary.map(function(x){return link(x,'nav-mobile-primary')}).join('')+
      '<button type="button" id="moreNav" class="nav-more" aria-expanded="false" aria-controls="moreNavPanel"><span class="nav-glyph">☷</span><span class="nav-label">More</span></button></div>'+
    '<div class="nav-more-panel" id="moreNavPanel" hidden>'+secondary.map(function(x){return link(x,'nav-more-link')}).join('')+
      '<button class="nav-logout" id="outMobile" type="button">⇥ Sign out · '+esc(App.me)+'</button></div>';
  function signOut(e){if(e)e.preventDefault();App.auth.signOut().then(function(){location.href="index.html"})}
  $("out").onclick=signOut;
  $("outMobile").onclick=signOut;
  var more=$("moreNav"),panel=$("moreNavPanel");
  if(secondary.some(isActive))more.classList.add("on");
  function closeMore(){panel.hidden=true;more.setAttribute("aria-expanded","false");more.classList.remove("on")}
  more.onclick=function(e){e.preventDefault();e.stopPropagation();var opening=panel.hidden;panel.hidden=!opening;more.setAttribute("aria-expanded",String(opening));more.classList.toggle("on",opening)};
  panel.addEventListener("click",function(e){e.stopPropagation()});
  if(!App._navEventsBound){
    document.addEventListener("click",function(e){var p=$("moreNavPanel"),m=$("moreNav");if(p&&!p.hidden&&!p.contains(e.target)&&e.target!==m&&!m.contains(e.target)){p.hidden=true;m.setAttribute("aria-expanded","false");m.classList.remove("on")}});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"){var p=$("moreNavPanel"),m=$("moreNav");if(p&&m){p.hidden=true;m.setAttribute("aria-expanded","false");m.classList.remove("on")}}});
    App._navEventsBound=true;
  }
};
App.snap=function(n){
  var p=App.players.filter(function(x){return x.name===n})[0]||{name:n,army:"",det:"",dets:[],fd:FDS[0]};
  return {name:p.name,army:p.army,det:p.det,dets:p.dets||[],fd:p.fd};
};
App.snapOr=function(n,old){
  var p=App.players.filter(function(x){return x.name===n})[0];
  return p?Object.assign({},old||{},{name:p.name,army:p.army,det:p.det,dets:p.dets||[],fd:p.fd}):old;
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
  var st={invited:"Invitație",declined:"Refuzat",cancelled:"Anulat",active:"În desfășurare",confirm:"Așteaptă confirmarea scorului",done:"Încheiat"}[m.status]||m.status;
  var res=m.status==="done"&&m.winner?" · "+(m.winner==="draw"?"remiză":"câștigă "+esc(m.winner==="a"?m.a:m.b)+(m.wo?" (neprezentare)":"")):"";
  return '<a class="card rowlink" href="match.html?id='+m.id+'"><b>'+(m.type==="tournament"?"Turneu":"Amical")+' · '+esc(m.a)+' vs '+esc(m.b)+'</b><span>'+st+(m.status==="invited"||m.status==="declined"||m.status==="cancelled"?"":" · "+App.score(m))+res+'</span></a>';
};

/* notificare: număr de invitații pe meniu + notificare de browser (cât timp aplicația e deschisă) */
App.badge=function(n){
  var links=document.querySelectorAll('#nav a[href="friendly.html"]');
  links.forEach(function(a){
    var label=a.querySelector('.nav-label');
    if(label)label.textContent="Friendly"+(n?" ("+n+")":"");
    a.setAttribute('aria-label',"Friendly"+(n?", "+n+" invitații":""));
    a.dataset.invites=String(n||0);
  });
};
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
