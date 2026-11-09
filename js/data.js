/* Datele (misiuni, detașamente, Force Disposition) se citesc din folderul data/ la deschiderea aplicației. */
var FDS=[],FDM={},PRI={},SEC=[],SECV={},WD={},DEPLOYS=[],TWISTS={},DET={},DEPIMG={},DEPNOTE={};
var Data={
  ready:null,
  load:function(){
    if(!Data.ready)Data.ready=Promise.all([
      fetch("data/missions.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("data/missions.json: "+r.status);return r.json()}),
      fetch("data/detachments.json",{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error("data/detachments.json: "+r.status);return r.json()})
    ]).then(function(x){
      var m=x[0];
      FDS=m.fds;FDM=m.fdm;PRI=m.primaries;DEPLOYS=m.deployments;TWISTS=m.twists;DEPIMG=m.deployment_images||{};DEPNOTE=m.deployment_notes||{};
      SEC=[];SECV={};WD={};
      m.secondaries.forEach(function(c){
        SEC.push({n:c.n,fx:c.fx,r:c.r});SECV[c.n]={t:c.t||[],f:c.f||[]};if(c.wd)WD[c.n]=c.wd;
      });
      DET=x[1].armies;
    });
    return Data.ready;
  },
  depImg:function(name,cls){
    var p=DEPIMG[name];
    return p?'<button class="depa dep-preview-trigger" type="button" data-dep-preview="'+esc(p)+'" data-dep-title="'+esc(name)+'" aria-label="Mărește harta '+esc(name)+'"><img class="'+(cls||"dep")+'" src="'+esc(p)+'" alt="Harta '+esc(name)+'" loading="lazy"></button>':'';
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
    return any?FDS.slice():out;
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
function cpOf(ps,side,events){var n=(ps.log||[]).reduce(function(a,e){return a+(e.k==="cp"?e.v:0)},0),list=events||(side&&typeof M!=="undefined"&&M&&Array.isArray(M.cpAuto)?M.cpAuto:[]);if(side)n+=list.reduce(function(a,e){return a+(e.s===side?e.v:0)},0);return n}
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


/* Preview pentru hărțile deployment: modal în aplicație, fără tab/pagină nouă. */
(function(){
  if(window.__jhDeploymentPreviewBound)return;window.__jhDeploymentPreviewBound=true;
  var modal=null;
  function close(){if(!modal)return;modal.hidden=true;document.body.classList.remove("modal-open");var img=modal.querySelector("img");if(img)img.removeAttribute("src");}
  function open(src,title){
    if(!modal){
      modal=document.createElement("div");modal.className="dep-preview-modal";modal.hidden=true;modal.innerHTML='<div class="dep-preview-panel" role="dialog" aria-modal="true" aria-labelledby="depPreviewTitle"><div class="dep-preview-head"><strong id="depPreviewTitle"></strong><button type="button" class="ghost dep-preview-close" aria-label="Închide harta">✕</button></div><img alt="Hartă deployment"></div>';
      document.body.appendChild(modal);
      modal.addEventListener("click",function(e){if(e.target===modal||e.target.closest(".dep-preview-close"))close()});
    }
    modal.querySelector("#depPreviewTitle").textContent=title||"Deployment";
    modal.querySelector("img").src=src;modal.hidden=false;document.body.classList.add("modal-open");
    modal.querySelector(".dep-preview-close").focus();
  }
  document.addEventListener("click",function(e){var b=e.target.closest("[data-dep-preview]");if(b){e.preventDefault();open(b.getAttribute("data-dep-preview"),b.getAttribute("data-dep-title"));}});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal&&!modal.hidden)close()});
})();
