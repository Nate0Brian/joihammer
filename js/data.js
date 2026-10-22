/* Datele (misiuni, detașamente, Force Disposition) se citesc din folderul data/ la deschiderea aplicației. */
var FDS=[],FDM={},PRI={},SEC=[],SECV={},WD={},DEPLOYS=[],TWISTS={},DET={};
var Data={
  ready:null,
  load:function(){
    if(!Data.ready)Data.ready=Promise.all([
      fetch("data/missions.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("data/missions.json: "+r.status);return r.json()}),
      fetch("data/detachments.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("data/detachments.json: "+r.status);return r.json()})
    ]).then(function(x){
      var m=x[0];
      FDS=m.fds;FDM=m.fdm;PRI=m.primaries;DEPLOYS=m.deployments;TWISTS=m.twists;
      SEC=[];SECV={};WD={};
      m.secondaries.forEach(function(c){
        SEC.push({n:c.n,fx:c.fx,r:c.r});SECV[c.n]={t:c.t||[],f:c.f||[]};if(c.wd)WD[c.n]=c.wd;
      });
      DET=x[1].armies;
    });
    return Data.ready;
  },
  armies:function(){return Object.keys(DET).sort()},
  /* detașamentele unei armate (inclusiv cele moștenite, ex. Space Marines pentru capitole) */
  detsOf:function(army){
    var e=DET[army];if(!e)return [];
    var out=e.detachments.map(function(d){return {n:d.n,fd:d.fd,dp:d.dp,src:army}});
    if(e.inherits&&DET[e.inherits])out=out.concat(DET[e.inherits].detachments.map(function(d){return {n:d.n,fd:d.fd,dp:d.dp,src:e.inherits}}));
    return out;
  },
  /* Force Disposition-urile posibile pentru detașamentele alese */
  fdsFor:function(army,dets){
    var all=Data.detsOf(army),seen={},out=[],any=false;
    (dets||[]).forEach(function(n){
      var d=all.filter(function(x){return x.n===n})[0];
      if(!d)return;
      if(!d.fd){any=true;return}
      if(!seen[d.fd]){seen[d.fd]=1;out.push(d.fd)}
    });
    return (any||!out.length)?FDS.slice():out;
  }
};

function newPS(){return {mode:"",ready:false,fixed:[],hand:[],used:[],fresh:[],drawT:-1,rd:false,br:false,log:[]}}
function sums(ps,k){
  var by={},fin=0;
  (ps.log||[]).forEach(function(e){if(e.k!==k)return;if(e.f)fin+=e.v;else by[e.r]=(by[e.r]||0)+e.v});
  var t=fin;Object.keys(by).forEach(function(r){t+=Math.min(15,Math.max(0,by[r]))});
  return Math.min(45,Math.max(0,t));
}
function roundVP(ps,k,r){var t=0;(ps.log||[]).forEach(function(e){if(e.k===k&&!e.f&&e.r===r)t+=e.v});return t}
function cpOf(ps){return (ps.log||[]).reduce(function(a,e){return a+(e.k==="cp"?e.v:0)},0)}
function totalPS(ps){return sums(ps,"pri")+sums(ps,"sec")+(ps.br?10:0)}

/* „T R1–2 · 2VP: text” -> {w, min, max, text, v[]} */
function parseLine(s){
  var m=s.match(/^([TCF])(?: (\(orice tură\)|R(\d)(?:–(\d))?(\+)?))? · (.*)$/);
  if(!m)return {w:"T",min:1,max:5,text:s,v:[]};
  var w=m[1],min=w==="C"?2:1,max=5;
  if(m[3]){min=+m[3];max=m[4]?+m[4]:(m[5]?5:min)}
  var vs=[],seen={};
  (m[6].match(/\d+(?=VP)/g)||[]).forEach(function(x){if(!seen[x]){seen[x]=1;vs.push(+x)}});
  return {w:w,min:min,max:max,text:m[6],v:vs};
}
