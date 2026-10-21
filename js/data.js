var FDS=["Take and Hold","Purge the Foe","Disruption","Reconnaissance","Priority Assets"];
var FDM={"Take and Hold":["Battlefield Dominance","Immovable Object","Determined Acquisition","Purge and Secure","Inescapable Dominion"],
"Purge the Foe":["Unstoppable Force","Meatgrinder","Punishment","Consecrate","Destroyer’s Wrath"],
"Disruption":["Death Trap","Delaying Action","Outmanoeuvre","Smoke and Mirrors","Locate and Deny"],
"Reconnaissance":["Reconnaissance Sweep","Triangulation","Surveil the Foe","Gather Intel","Search and Scour"],
"Priority Assets":["Secure Asset","Vital Link","Extract Relic","Vanguard Operation","Sabotage"]};
var PRI={
"Battlefield Dominance":{r:["T R1–2 · 2VP: controlezi mai multe objectives decât adversarul","C · 3VP / objective controlat","C · +2VP / objective (fără home) dacă controlezi și home-ul tău"]},
"Immovable Object":{r:["T · 3VP: controlezi un central objective","C R2–4 · 5VP / objective (fără home)","T R5 · 5VP / objective (fără home)"]},
"Determined Acquisition":{r:["T · 2VP / objective nou controlat (fără home)","C · 3VP / objective controlat","C · +3VP / objective din teritoriul adversarului"]},
"Purge and Secure":{r:["T · 3VP: inamic distrus de o unitate a ta aflată lângă un objective, SAU inamic care a început tura lângă un objective distrus","C · 4VP / objective (fără home)","T · 3VP: controlezi un objective nou (fără home)"]},
"Inescapable Dominion":{r:["T · 4VP: controlezi 3+ objectives","C R2+ · 5VP: 2+ objectives","C R2+ · 4VP: mai multe objectives decât adversarul","F · 5VP: controlezi home-ul adversarului"]},
"Unstoppable Force":{r:["T · 3VP: o unitate inamică distrusă","C · 4VP / objective (fără home)","T · 3VP: controlezi un objective nou (fără home)","F · 5VP: controlezi un central objective"]},
"Meatgrinder":{r:["T · 3VP: o unitate inamică distrusă","C · 4VP: 1+ objective (fără home)","T R2+ · 5VP: ai distrus mai multe unități decât ți-au distrus ei în tura lor","T R2+ · 5VP: controlezi home-ul adversarului"]},
"Punishment":{a:"Start tură: alegi 1–3 unități inamice (lângă objectives și/sau care ți-au distrus unități) = condemned, până la următoarea ta tură.",r:["T (orice tură) · 5VP: o unitate condemned a părăsit câmpul","C · 4VP: 1+ objective (fără home)","C · 5VP: mai multe objectives decât adversarul","F · 8VP: controlezi home-ul adversarului"]},
"Consecrate":{a:"Unitatea care distruge o unitate devine consecration unit; la final de tură marchezi un objective din raza ei (fără home) cu un operation marker = consecrated.",r:["T · 3VP: 1–2 objectives consecrated; 6VP: 3+","C · 4VP: 1+ objective (fără home)","C · 4VP: mai multe objectives decât adversarul","F · 5VP: home-ul adversarului e consecrated"]},
"Destroyer’s Wrath":{r:["T · 3VP: o unitate inamică distrusă","C · 4VP: 1+ objective (fără home)","C · 6VP: mai multe objectives decât adversarul","T · 4VP: ai distrus mai multe unități decât ți-au distrus ei în tura anterioară"]},
"Death Trap":{a:"Acțiune Booby Trap (Shooting, nelimitat): unitate lângă un objective (fără home) sau într-un terrain area din afara deployment zone-ului tău → terrain area trapped (marker).",r:["T · 2VP / terrain area trapped în tură; +3VP dacă e și objective","T · 3VP: inamic distrus care a început tura într-un terrain area trapped","C · 4VP: 1+ objective (fără home)"]},
"Delaying Action":{r:["T · 2VP / unitate inamică distrusă","C · 4VP: 1+ objective (fără home-uri)","T · 3VP: controlezi un central ȘI un expansion objective"]},
"Outmanoeuvre":{r:["T · 10VP: controlezi home-ul adversarului","T R1 · 4VP / objective (fără home)","C R2–3 · 5VP / objective (fără home)","T R4+ · 6VP / objective (fără home)"]},
"Smoke and Mirrors":{a:"Acțiune Decoy (Shooting, nelimitat): unitate lângă un objective (fără home), se termină dacă o controlează → objective decoyed (marker).",r:["T · 2VP / objective decoyed; +2VP dacă e în teritoriul adversarului","C · 4VP: 1+ objective (fără home)","F · 10VP: 4+ objectives decoyed"]},
"Locate and Deny":{a:"Start: 5 terrain areas din afara deployment zone-ului tău → câte un marker. Sensor Sweep (Shooting, o dată/tură, lângă central objective): scoți un marker (nu dacă a rămas unul).",r:["T · 4VP: inamic distrus care a început tura lângă un objective","T · 4VP: a rămas un singur marker al tău, cu unitate a ta în acel terrain area și fără inamici","C · 4VP: 1+ objective (fără home)","F · 5VP: la fel ca al doilea punct"]},
"Reconnaissance Sweep":{r:["T · 3VP: 3+ unități în 3 sferturi diferite (nu la 6\" de centru); 6VP: 4 sferturi","T · 1VP / unitate inamică distrusă","C · 3VP: 1+ objective (fără home)"]},
"Triangulation":{a:"Acțiune Triangulate (Shooting, R2+, o dată/tură): unitate lângă un objective (fără home), se termină dacă o controlează → triangulated (marker).",r:["C R2+ · 4VP: 1+ objective (fără home)","T R2+ · 3VP: 1 objective triangulated; 6VP: 2; 10VP: 3+","F · 10VP: controlezi 4+ objectives"]},
"Surveil the Foe":{a:"Acțiune Surveil (Shooting, nelimitat, orice unitate): inamic la 18\" și vizibil → surveilled. Mutarea unei unități lângă un objective cu markere ale adversarului le elimină.",r:["T · 4VP: unități inamice surveilled (în afară de cele lângă objectives cu markerele lor)","C · 4VP: 1+ objective (fără home)","C · 4VP: mai multe objectives decât adversarul","T · 5VP: niciun marker al adversarului pe câmp"]},
"Gather Intel":{a:"Acțiune Extract Intelligence (Shooting, R2+, nelimitat): unitate lângă un objective (fără home) fără marker al tău, se termină dacă îl controlează → marker.",r:["T R1 · 6VP: controlezi un central objective","C R2+ · 4VP: 1+ objective (fără home)","T R2+ · 7VP / unitate care a terminat Extract Intelligence","F · 5VP: 3+ markere ale tale pe câmp","F · 5VP: un marker al tău lângă home-ul adversarului"]},
"Search and Scour":{r:["T · 3VP: controlezi un central objective","T · 2VP: inamic care a început tura într-un terrain area distrus","C · 4VP / objective (fără home)","F · 5VP: niciun inamic complet în teritoriul tău"]},
"Secure Asset":{a:"Acțiune Secure Asset (Shooting, o dată/tură): unitate lângă un objective (fără home), se termină dacă îl controlează.",r:["T · 4VP: o unitate a securizat asset-ul","T · 2VP: inamic care a început tura lângă un central objective distrus","C · 4VP: 1+ objective (fără home)","C · 4VP: 3+ objectives"]},
"Vital Link":{a:"Acțiune Maintain Control (Shooting, o dată/tură, lângă central objective): se termină dacă îl controlează → marker lângă el.",r:["T · 2VP: controlezi un central objective; +1VP / marker al tău lângă el","C · 4VP: 1+ objective (fără home); +4VP dacă unul e central","F · 10VP: controlezi home-ul adversarului"]},
"Extract Relic":{a:"Sensor Sweep (Shooting, o dată/tură, lângă central objective): scoți un marker (nu dacă a rămas unul).",r:["T · 4VP: o unitate a făcut sensor sweep","T · 3VP: inamic care a început tura lângă un objective distrus","T · 4VP: a rămas un singur marker al adversarului, cu unitate a ta în acel terrain area și fără inamici","C · 4VP: 1+ objective (fără home)","F · 5VP: ca al treilea punct"]},
"Vanguard Operation":{a:"Acțiune Vanguard Operation (Shooting, o dată/tură): unitate într-un terrain area din teritoriul adversarului, se termină dacă nu sunt inamici acolo.",r:["T · 4VP: o unitate a făcut vanguard operation","T · 2VP: o unitate inamică distrusă","C · 4VP: 1+ objective (fără home)","F · 10VP: controlezi home-ul adversarului"]},
"Sabotage":{a:"Acțiune Sabotage (Shooting, nelimitat): unitate lângă un objective (fără home), se termină dacă îl controlează → committed sabotage.",r:["T · 3VP / unitate care a sabotat; +2VP dacă e lângă un objective din teritoriul adversarului","C · 4VP: 1+ objective (fără home)"]}};
var SEC=[
{n:"No Prisoners",r:["2VP / unitate inamică distrusă (max 5VP)"]},
{n:"Overwhelming Force",r:["3VP / inamic distrus care a început tura lângă un objective (max 5VP)"]},
{n:"Plunder",r:["Acțiune (Shooting, o dată/tură): unitate într-un terrain area din afara teritoriului tău → plundered","5VP: un terrain area plundered în tură"]},
{n:"Display of Might",r:["2VP la finalul turei tale / 5VP la finalul turei adversarului: mai multe unități ale tale decât ale lui în No Man’s Land (fără Aircraft și battle-shocked)"]},
{n:"Outflank",r:["3VP: unitate la 6\" de o margine, în afara teritoriului tău","5VP: 2 unități la margini opuse, una în afara teritoriului tău"]},
{n:"Beacon",r:["La tragere alegi o unitate beacon","3VP: beacon pe câmp, în afara deployment zone-ului; 5VP: în afara teritoriului tău (final tura adversarului sau R5)"]},
{n:"Cleanse",r:["Acțiune (Shooting): unitate lângă un objective (fără home), se termină dacă îl controlează → cleansed","2VP: un objective cleansed în tură; 5VP: două sau mai multe"]},
{n:"A Grievous Blow",fx:1,r:["Fixed 4VP / Tactical 5VP: unitate inamică cu 13+ modele la start distrusă (max 5VP)"]},
{n:"Defend Stronghold",r:["R2+, final tura adversarului sau R5: 3VP controlezi home-ul; +2VP niciun inamic în deployment zone-ul tău"]},
{n:"Engage on All Fronts",fx:1,r:["Prezență în 3 sferturi: Fixed 2VP / Tactical 3VP","Prezență în 4 sferturi: Fixed 4VP / Tactical 5VP (unități întregi într-un sfert, nu la 6\" de centru)"]},
{n:"Secure No Man’s Land",r:["5VP: controlezi 2+ objectives în No Man’s Land (fără home)"]},
{n:"Forward Position",r:["5VP: controlezi home-ul adversarului și/sau fiecare expansion objective"]},
{n:"Centre Ground",r:["3VP: unitate la 3\" de centru și niciun inamic la 3\"","5VP: unitate la 3\" de centru și niciun inamic la 6\""]},
{n:"Assassination",fx:1,r:["Fixed: 3VP / CHARACTER inamic distrus, +1VP dacă are W 4+","Tactical: 5VP dacă un CHARACTER inamic a fost distrus în tură (sau toți au fost distruși)"]},
{n:"A Tempting Target",r:["Adversarul alege un objective din No Man’s Land = tempting target","5VP: îl controlezi"]},
{n:"Behind Enemy Lines",r:["3VP / unitate complet în deployment zone-ul adversarului (max 5VP)"]},
{n:"Bring It Down",fx:1,r:["Fixed 4VP / Tactical 5VP: model inamic cu W 10+ distrus (max 5VP)"]},
{n:"Burden of Trust",r:["La tragere/start tură alegi o unitate per objective ca să-l păzească","2VP / objective guarded, final tura adversarului sau R5 (max 5VP)"]}];
var DEPLOYS=["Tipping Point","Sweeping Engagement","Search and Destroy","Hammer and Anvil","Dawn of War","Crucible of Battle"];
var TWISTS={"Nowhere to Hide":"Terrain features nu mai au regula Solid (mai multă linie de vedere).","Mirrored World":"Ambii folosesc aceeași primară: Battlefield Dominance, Meatgrinder, Outmanoeuvre, Gather Intel sau Sabotage (de comun acord, altfel D6).","Scrambled Communications":"Jucătorii își schimbă între ei misiunile primare (aplicat automat mai jos).","Martial Pride":"Unitățile BATTLELINE pot începe o acțiune după advance și pot trage după ce au început o acțiune.","Ruinscape":"La normal sau advance move, modelele au MOBILE până la finalul mutării.","Night Fighting":"Unitățile sunt vizibile doar la 18\"; fără INDIRECT FIRE dincolo de 18\"."};

/* ---- Opțiuni VP pe cărți secundare: t = Tactical, f = Fixed ---- */
var SECV={
"No Prisoners":{t:[2,4,5],f:[]},
"Overwhelming Force":{t:[3,5],f:[]},
"Plunder":{t:[5],f:[]},
"Display of Might":{t:[2,5],f:[]},
"Outflank":{t:[3,5],f:[]},
"Beacon":{t:[3,5],f:[]},
"Cleanse":{t:[2,5],f:[]},
"A Grievous Blow":{t:[5],f:[4]},
"Defend Stronghold":{t:[3,5],f:[]},
"Engage on All Fronts":{t:[3,5],f:[2,4]},
"Secure No Man’s Land":{t:[5],f:[]},
"Forward Position":{t:[5],f:[]},
"Centre Ground":{t:[3,5],f:[]},
"Assassination":{t:[5],f:[3,4,6,8]},
"A Tempting Target":{t:[5],f:[]},
"Behind Enemy Lines":{t:[3,5],f:[]},
"Bring It Down":{t:[5],f:[4]},
"Burden of Trust":{t:[2,4,5],f:[]}
};
/* Regula „când e trasă” care permite tragerea unei cărți noi.
   o = cartea care trebuie să fie activă; r1 = doar în runda 1; ask = confirmare manuală;
   b = cartea se întoarce în pachet (altfel se aruncă) */
var WD={
"Plunder":{o:"Cleanse",b:1},
"Cleanse":{o:"Plunder",b:1},
"A Grievous Blow":{ask:"Nu există unități inamice cu starting strength 13+ pe câmp?"},
"Bring It Down":{ask:"Nu există modele inamice cu W 10+ pe câmp?"},
"Defend Stronghold":{r1:1,b:1},
"Forward Position":{r1:1,b:1},
"Behind Enemy Lines":{r1:1,b:1}
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
