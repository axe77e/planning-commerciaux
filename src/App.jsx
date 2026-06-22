import { useState, useMemo, useEffect, useRef } from "react";
import { saveData, loadData } from "./supabaseClient";

const CRENEAUX = ["9h00", "11h00", "14h00", "17h00", "19h30"];
const JOURS_DEFAULT = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const VUES = ["Jour", "Calendrier"];

const DEPARTEMENTS = {
  "87":{label:"87 – Haute-Vienne",color:"#3B82F6",light:"#DBEAFE"},
  "19":{label:"19 – Corrèze",     color:"#8B5CF6",light:"#EDE9FE"},
  "24":{label:"24 – Dordogne",    color:"#EA580C",light:"#FFEDD5"},
  "86":{label:"86 – Vienne",      color:"#059669",light:"#D1FAE5"},
  "79":{label:"79 – Deux-Sèvres", color:"#0891B2",light:"#CFFAFE"},
  "23":{label:"23 – Creuse",      color:"#DC2626",light:"#FEE2E2"},
};

const COMMUNES_GPS = {
  "limoges":[45.8336,1.2611],"saint-junien":[45.8878,0.8994],"bellac":[46.1208,1.0444],
  "rochechouart":[45.8219,0.8247],"ambazac":[45.9578,1.4008],"aixe-sur-vienne":[45.7967,1.1369],
  "isle":[45.8522,1.2128],"panazol":[45.8378,1.3019],"couzeix":[45.8817,1.2556],
  "saint-yrieix-la-perche":[45.5114,1.2078],"nexon":[45.6778,1.1858],"nantiat":[46.0094,1.1675],
  "eymoutiers":[45.7358,1.7392],"pierre-buffiere":[45.6878,1.3642],"chateauneuf-la-foret":[45.6942,1.5992],
  "tulle":[45.2664,1.7717],"brive-la-gaillarde":[45.1583,1.5325],"ussel":[45.5478,2.3097],
  "uzerche":[45.4222,1.5631],"objat":[45.2644,1.4058],"malemort-sur-correze":[45.1708,1.5539],
  "donzenac":[45.2228,1.5228],"beynat":[45.1294,1.7644],"meyssac":[45.0544,1.6744],
  "argentat":[45.0944,1.9378],"egletons":[45.4028,2.0478],"neuvic":[45.3894,2.2711],
  "bort-les-orgues":[45.3978,2.4944],"saint-privat":[45.3644,2.1094],
  "perigueux":[45.1828,0.7269],"bergerac":[44.8519,0.4806],"sarlat-la-caneda":[44.8894,1.2172],
  "saint-astier":[45.1428,0.5244],"nontron":[45.5278,0.6644],"riberac":[45.2494,0.3369],
  "thiviers":[45.4144,0.9144],"excideuil":[45.3394,1.0503],"hautefort":[45.2594,1.1503],
  "mussidan":[45.0378,0.3678],"vergt":[45.0228,0.7203],"le bugue":[44.9228,0.9278],
  "terrasson-lavilledieu":[45.1228,1.3028],"brantome":[45.3644,0.6494],
  "poitiers":[46.5798,0.3417],"chatellerault":[46.8178,0.5428],"loudun":[47.0028,0.0778],
  "montmorillon":[46.4278,0.8678],"lusignan":[46.4328,0.1228],"vivonne":[46.4228,0.2628],
  "neuville-de-poitou":[46.6878,0.2578],"buxerolles":[46.6078,0.3428],
  "saint-benoit":[46.5478,0.3678],"jaunay-marigny":[46.6678,0.3778],"chauvigny":[46.5678,0.6478],
  "civray":[46.1478,0.2978],
  "niort":[46.3231,-0.4674],"bressuire":[46.8378,-0.4872],"parthenay":[46.6478,-0.2572],
  "thouars":[46.9778,-0.2172],"melle":[46.2228,-0.1472],"la creche":[46.3578,-0.2972],
  "celles-sur-belle":[46.2628,-0.2072],"chef-boutonne":[46.1128,-0.0772],
  "gueret":[46.1697,1.8714],"aubusson":[45.9578,2.1714],"la souterraine":[46.2378,1.4894],
  "bourganeuf":[45.9528,1.7564],"saint-vaury":[46.1478,1.7564],"evaux-les-bains":[46.1728,2.4814],
  "auzances":[45.9978,2.4814],"pontarion":[45.9028,1.7064],
};
const CENTRES_DEPT={
  "87":[45.8336,1.2611],"19":[45.2664,1.7717],"24":[45.1828,0.7269],
  "86":[46.5798,0.3417],"79":[46.3231,-0.4674],"23":[46.1697,1.8714],
};
const MARGES={"9h00-11h00":0,"11h00-14h00":60,"14h00-17h00":60,"17h00-19h30":30};

function normalizeName(s){return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[-']/g," ").trim();}

// Base de codes postaux complets (5 chiffres) -> coordonnées GPS précises
// Couvre les principales communes de chaque code postal des 6 départements
const CODES_POSTAUX_GPS = {
  // 87 - Haute-Vienne
  "87000":[45.8336,1.2611],"87100":[45.8878,0.8994],"87110":[45.8378,1.3019],"87120":[45.7358,1.7392],
  "87130":[45.6878,1.3642],"87140":[45.9578,1.4008],"87150":[45.9817,1.4356],"87160":[46.0094,1.1675],
  "87170":[46.1208,1.0444],"87180":[45.8817,1.2556],"87190":[45.7967,1.1369],"87200":[45.8219,0.8247],
  "87210":[45.9094,1.2522],"87220":[45.5114,1.2078],"87230":[45.6778,1.1858],"87240":[45.7894,1.4467],
  "87250":[45.9264,1.0653],"87260":[46.0397,0.9694],"87270":[45.8522,1.2128],"87280":[45.9711,1.5217],
  "87290":[46.0744,1.2872],"87300":[45.8131,1.4564],"87310":[45.6517,1.3081],"87320":[45.6178,1.6219],
  "87330":[46.0428,0.9494],"87340":[46.0322,1.0394],"87350":[45.9244,1.6328],"87360":[45.6942,1.5992],
  "87370":[45.7561,1.2406],"87380":[45.5544,1.6817],"87400":[45.7572,1.4836],"87420":[45.6878,1.2236],
  "87430":[45.9417,1.1842],"87440":[45.6028,1.4711],"87450":[45.8939,1.4789],"87460":[45.6378,1.1936],
  "87470":[45.9928,1.4097],"87480":[45.9622,1.3367],"87500":[45.7822,1.0742],"87510":[45.9544,1.3242],
  "87520":[45.7144,1.0628],"87560":[45.7611,1.5444],"87570":[45.5894,1.2589],"87600":[45.6422,1.6611],
  "87700":[46.0817,1.3289],"87800":[45.7544,1.1136],
  // 19 - Corrèze
  "19000":[45.2664,1.7717],"19100":[45.1583,1.5325],"19120":[45.0944,1.9378],"19130":[45.1294,1.7644],
  "19140":[45.5894,1.6539],"19150":[45.3211,1.4422],"19160":[45.3722,1.3417],"19170":[45.3756,1.4914],
  "19190":[45.4028,2.0478],"19200":[45.5478,2.3097],"19210":[45.3644,2.1094],"19220":[45.2644,1.4058],
  "19230":[45.2228,1.5228],"19240":[45.2128,1.7128],"19250":[45.0044,1.5358],"19260":[45.1944,1.9078],
  "19270":[45.2089,1.8014],"19290":[45.3389,1.6014],"19300":[45.4222,1.5631],"19310":[45.1294,1.5928],
  "19320":[45.0544,1.6744],"19330":[45.4994,1.6328],"19340":[45.4894,1.9389],"19350":[45.0628,1.6878],
  "19360":[45.0828,1.4458],"19370":[45.1722,1.4258],"19380":[45.2128,2.1428],"19400":[45.1583,1.6228],
  "19410":[45.4544,1.7444],"19460":[45.1844,1.7378],"19470":[45.6028,1.5589],"19500":[45.0894,1.8328],
  "19510":[45.1378,1.9528],"19520":[45.0394,2.0028],"19550":[45.0044,1.8628],"19560":[45.0394,1.9978],
  "19600":[45.1308,1.5189],"19700":[45.4628,1.5728],"19800":[45.3144,1.6228],
  // 24 - Dordogne
  "24000":[45.1828,0.7269],"24100":[44.8519,0.4806],"24110":[45.1428,0.5244],"24120":[45.2594,1.1503],
  "24130":[44.8267,0.3744],"24140":[45.0703,0.6394],"24150":[44.8978,0.7714],"24160":[45.2911,0.9628],
  "24170":[44.7456,0.9603],"24190":[45.2228,1.0314],"24200":[44.8894,1.2172],"24210":[45.0394,1.0978],
  "24220":[44.8328,1.0894],"24230":[44.8728,0.4744],"24240":[44.8939,0.6964],"24250":[44.8044,1.1444],
  "24260":[45.0228,0.7203],"24270":[45.3394,1.0503],"24280":[45.1311,0.9264],"24290":[45.2289,1.1689],
  "24300":[45.5278,0.6644],"24310":[45.4244,0.4794],"24320":[45.3911,0.5294],"24330":[44.9978,0.8444],
  "24340":[45.4644,0.7944],"24350":[45.3239,0.9006],"24360":[45.3644,0.6494],"24380":[45.1394,0.6256],
  "24390":[45.1944,1.3528],"24400":[45.2494,0.3369],"24420":[45.2628,0.6072],"24430":[45.1539,0.8264],
  "24440":[44.9228,0.9278],"24450":[45.4244,0.9744],"24460":[45.0789,0.9072],"24470":[45.4528,0.8744],
  "24480":[44.9603,0.5933],"24500":[44.8267,0.5644],"24510":[44.7544,0.5928],"24520":[44.8189,1.0228],
  "24530":[45.0228,0.5028],"24550":[44.7878,1.0494],"24560":[44.7544,0.8728],"24570":[45.3194,1.4256],
  "24580":[45.0044,0.9264],"24590":[44.9928,1.1644],"24600":[45.3644,0.4644],"24610":[44.9711,0.2853],
  "24620":[45.0903,1.1944],"24630":[45.0589,0.4328],"24640":[45.1428,0.9028],"24650":[45.0094,0.9594],
  "24660":[45.1828,0.8978],"24680":[44.9544,0.6878],"24700":[44.9711,0.1603],"24750":[45.1428,0.6444],
  "24800":[45.4144,0.9144],"24850":[44.9089,1.2228],"24880":[45.1228,1.3028],"24900":[45.1828,0.7269],
  // 86 - Vienne
  "86000":[46.5798,0.3417],"86010":[46.5798,0.3417],"86100":[46.8178,0.5428],"86110":[46.6878,0.2578],
  "86120":[47.0028,0.0778],"86130":[46.6817,0.6722],"86140":[46.7989,0.3528],"86150":[46.1478,0.2978],
  "86160":[46.4828,0.3956],"86170":[46.6278,0.5878],"86180":[46.5378,0.3978],"86190":[46.3294,0.3756],
  "86200":[46.9389,0.1494],"86210":[46.9778,0.4444],"86220":[46.7656,0.2228],"86230":[46.5183,0.1106],
  "86240":[46.5728,0.5128],"86250":[46.8989,0.0928],"86260":[46.7494,0.7728],"86270":[46.6878,0.2578],
  "86280":[46.5328,0.4128],"86290":[46.4244,0.5878],"86300":[46.4278,0.8678],"86310":[46.3289,0.6928],
  "86320":[46.5728,0.9628],"86330":[46.3394,0.5856],"86340":[46.6594,0.8264],"86350":[46.5478,1.0228],
  "86360":[46.7244,0.8178],"86370":[46.7128,0.4444],"86380":[46.4544,0.4244],"86400":[46.7894,0.7544],
  "86410":[46.6028,0.7144],"86420":[46.9711,-0.1264],"86430":[46.8689,0.6478],"86440":[46.3994,0.6978],
  "86450":[46.7944,0.1644],"86460":[46.6128,0.0728],"86470":[46.3778,0.1378],"86480":[46.7211,0.5444],
  "86490":[46.6628,0.7128],"86500":[46.4328,0.1228],"86510":[46.5511,1.0228],"86530":[46.7444,0.1144],
  "86540":[46.2628,0.2978],"86550":[46.7878,0.3444],"86560":[46.3478,-0.0072],"86570":[46.4789,0.0294],
  "86580":[46.8794,0.4628],"86590":[46.6394,1.0428],"86600":[46.6678,0.3778],"86700":[46.8378,0.1928],
  "86800":[46.6078,0.3428],
  // 79 - Deux-Sèvres
  "79000":[46.3231,-0.4674],"79100":[46.8378,-0.4872],"79110":[46.7228,-0.4172],"79120":[46.1128,-0.0772],
  "79130":[46.5544,-0.6128],"79140":[46.8978,-0.6928],"79150":[46.9778,-0.2172],"79160":[46.3878,0.0228],
  "79170":[46.2628,-0.2072],"79180":[46.5244,-0.2772],"79190":[46.1128,0.0028],"79200":[46.4628,-0.6628],
  "79210":[46.4628,-0.4128],"79220":[46.5778,-0.1772],"79230":[46.4894,-0.5256],"79240":[46.6178,-0.5872],
  "79250":[46.2378,-0.5172],"79260":[46.6228,-0.3372],"79270":[46.7128,-0.1972],"79280":[46.7544,-0.6328],
  "79290":[46.1928,0.0428],"79300":[46.6478,-0.2572],"79310":[46.6128,-0.0372],"79320":[46.6894,-0.0828],
  "79330":[46.7394,-0.2972],"79340":[46.5728,0.0928],"79350":[46.4828,-0.7444],"79360":[46.4344,-0.7128],
  "79370":[46.2728,-0.0628],"79380":[46.7228,-0.3672],"79390":[46.4178,-0.2128],"79400":[46.6478,-0.2572],
  "79410":[46.6628,-0.7772],"79420":[46.1894,-0.4128],"79430":[46.5944,-0.8094],"79440":[46.7128,-0.5128],
  "79450":[46.3389,0.1144],"79460":[46.0928,-0.6444],"79470":[46.1389,-0.4972],"79480":[46.5678,-0.4944],
  "79500":[46.2228,-0.1472],"79510":[46.5728,0.1228],"79600":[46.8378,-0.4872],"79700":[46.7444,-0.5444],
  "79800":[46.4128,-0.2072],"79900":[46.3231,-0.4674],
  // 23 - Creuse
  "23000":[46.1697,1.8714],"23100":[45.9578,2.1714],"23110":[46.0344,1.7589],"23120":[46.2728,2.2128],
  "23130":[46.2178,1.6828],"23140":[46.0489,2.3856],"23150":[46.0589,2.0428],"23160":[46.1394,1.6228],
  "23170":[45.9028,2.0214],"23190":[46.0817,1.9978],"23200":[45.9528,1.7564],"23210":[46.1394,1.3528],
  "23220":[46.3128,1.6828],"23230":[46.0211,2.4017],"23240":[46.1944,2.4828],"23250":[46.0628,1.4356],
  "23260":[46.0094,1.9789],"23270":[46.2128,2.0228],"23300":[46.2378,1.4894],"23320":[46.1478,1.7564],
  "23330":[46.1628,2.0728],"23340":[46.2789,1.5589],"23350":[46.2917,2.0428],"23360":[46.0728,1.6428],
  "23370":[46.1097,1.4894],"23380":[46.1494,2.3328],"23400":[45.9978,2.4814],"23430":[46.1728,2.4814],
  "23460":[46.0228,1.6028],"23480":[45.8328,2.0928],"23500":[46.1311,2.1228],"23600":[46.2128,1.9028],
  "23700":[46.0728,1.5444],"23800":[46.2728,1.9528],
};

function findCoordsByPostal(cp){
  if(!cp||cp.length<5)return null;
  return CODES_POSTAUX_GPS[cp]||null;
}

function findCoords(ville){
  const n=normalizeName(ville);
  for(const[k,v]of Object.entries(COMMUNES_GPS)){if(normalizeName(k)===n)return v;}
  for(const[k,v]of Object.entries(COMMUNES_GPS)){if(normalizeName(k).includes(n)||n.includes(normalizeName(k)))return v;}
  return null;
}
function haversine(a,b){
  const R=6371,dLat=(b[0]-a[0])*Math.PI/180,dLng=(b[1]-a[1])*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function estimerMin(a,b){return Math.round((haversine(a,b)*1.35/70)*60);}
function getCoords(rdv){return rdv.coords||CENTRES_DEPT[rdv.dept]||null;}
function getMarge(cr1,cr2,marges){return (marges||MARGES)[`${cr1}-${cr2}`]??null;}
function formatTemps(min){if(min<60)return`${min}mn`;const h=Math.floor(min/60),m=min%60;return m>0?`${h}h${String(m).padStart(2,"0")}`:`${h}h`;}
function trajetStyle(min,seuils){
  const s=seuils||{proche:50,moyen:90};
  if(min<=s.proche)return{label:formatTemps(min),color:"#10B981",bg:"#D1FAE5",icon:"✓"};
  if(min<=s.moyen)return{label:formatTemps(min),color:"#D97706",bg:"#FEF3C7",icon:"~"};
  return{label:formatTemps(min),color:"#EF4444",bg:"#FEE2E2",icon:"✗"};
}
function newId(){return Math.random().toString(36).slice(2,9);}

const emptyPlanning=(jours)=>{
  const p={};
  jours.forEach(j=>{p[j]={};CRENEAUX.forEach(cr=>{p[j][cr]=[];});});
  return p;
};

function calculerTrajets(rdvsParCreneau){
  const result=[];
  CRENEAUX.forEach((cr1,ci)=>{
    const rdvs1=rdvsParCreneau[cr1]||[];
    CRENEAUX.slice(ci+1).forEach(cr2=>{
      const rdvs2=rdvsParCreneau[cr2]||[];
      rdvs1.forEach((r1,i1)=>rdvs2.forEach((r2,i2)=>{
        const c1=getCoords(r1),c2=getCoords(r2);
        if(!c1||!c2)return;
        result.push({fromCr:cr1,fromIdx:i1,toCr:cr2,toIdx:i2,min:estimerMin(c1,c2)});
      }));
    });
  });
  return result;
}

const inputStyle={width:"100%",padding:"8px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#1e293b",background:"#f8fafc",boxSizing:"border-box",outline:"none"};
const labelStyle={display:"block",fontSize:12,fontWeight:600,color:"#64748b",marginBottom:4,marginTop:12};

function deptFromCodePostal(cp){
  if(!cp||cp.length<2)return null;
  const prefix=cp.slice(0,2);
  return DEPARTEMENTS[prefix]?prefix:null;
}

function ModalRdv({onClose,onSave,onDelete,commerciaux,defaultComm,defaultCreneau,rdvEdit}){
  const isEdit=!!rdvEdit;
  const[commercial,setCommercial]=useState(rdvEdit?.commercial||defaultComm||commerciaux[0]||"");
  const[creneau,setCreneau]=useState(rdvEdit?.creneau||defaultCreneau||CRENEAUX[0]);
  const[client,setClient]=useState(rdvEdit?.client||"");
  const[codePostal,setCodePostal]=useState(rdvEdit?.codePostal||"");
  const[ville,setVille]=useState(rdvEdit?.ville||"");
  const[showSuggestionsVille,setShowSuggestionsVille]=useState(false);
  const suggestionsVille=useMemo(()=>{
    if(ville.length<2)return[];
    const n=normalizeName(ville);
    return Object.keys(COMMUNES_GPS)
      .filter(k=>normalizeName(k).includes(n))
      .slice(0,6)
      .map(k=>k.split(" ").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" "));
  },[ville]);
  const dept=deptFromCodePostal(codePostal);
  const codePostalComplet=codePostal.length===5;
  const coordsParCP=codePostalComplet?findCoordsByPostal(codePostal):null;
  const coordsParVille=ville.length>2?findCoords(ville):null;
  // Priorité : code postal complet (précis) > ville reconnue > centre département (fallback)
  const coords=coordsParCP||coordsParVille||null;
  const valide=!!dept;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:340,boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:700,color:"#1e293b"}}>{isEdit?"Modifier le rendez-vous":"Nouveau rendez-vous"}</h3>
        <label style={labelStyle}>Commercial</label>
        <select value={commercial} onChange={e=>setCommercial(e.target.value)} style={inputStyle}>
          {commerciaux.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <label style={labelStyle}>Créneau</label>
        <select value={creneau} onChange={e=>setCreneau(e.target.value)} style={inputStyle}>
          {CRENEAUX.map(cr=><option key={cr} value={cr}>{cr}</option>)}
        </select>
        <label style={labelStyle}>Code postal</label>
        <input value={codePostal} onChange={e=>setCodePostal(e.target.value)} placeholder="19100" className="cp-input" style={{...inputStyle,fontSize:20,fontWeight:800,textAlign:"center",padding:"12px 10px",letterSpacing:1}} maxLength={5} inputMode="numeric"/>
        {codePostal.length>=2&&<div style={{fontSize:11,marginTop:3,textAlign:"center",color:dept?"#10B981":"#EF4444"}}>{dept?`✓ ${DEPARTEMENTS[dept].label}`:"⚠️ Département non reconnu"}</div>}
        <label style={labelStyle}>Ville</label>
        <div style={{position:"relative"}}>
          <input
            value={ville}
            onChange={e=>{setVille(e.target.value);setShowSuggestionsVille(true);}}
            onFocus={()=>setShowSuggestionsVille(true)}
            onBlur={()=>setTimeout(()=>setShowSuggestionsVille(false),150)}
            placeholder="ex : Brive-la-Gaillarde"
            style={inputStyle}
            autoComplete="off"
          />
          {showSuggestionsVille&&suggestionsVille.length>0&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,marginTop:3,boxShadow:"0 4px 12px rgba(0,0,0,0.1)",zIndex:10,maxHeight:160,overflowY:"auto"}}>
              {suggestionsVille.map(s=>(
                <div key={s} onMouseDown={()=>{setVille(s);setShowSuggestionsVille(false);}} style={{padding:"8px 12px",fontSize:13,color:"#1e293b",cursor:"pointer",borderBottom:"1px solid #f1f5f9"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        <label style={labelStyle}>Nom du client</label>
        <input value={client} onChange={e=>setClient(e.target.value)} placeholder="ex : M. Dupont" style={{...inputStyle,fontSize:12,padding:"6px 9px"}}/>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          {isEdit?(
            <button onClick={onDelete} style={{padding:"10px 14px",borderRadius:8,border:"1.5px solid #FEE2E2",background:"#FEF2F2",color:"#EF4444",fontWeight:600,fontSize:13,cursor:"pointer"}}>Supprimer</button>
          ):(
            <button onClick={onClose} style={{flex:1,padding:"10px 0",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:14,cursor:"pointer"}}>Annuler</button>
          )}
          <button onClick={()=>valide&&onSave({id:rdvEdit?.id||newId(),commercial,creneau,dept,ville,client,codePostal,coords,confirme:rdvEdit?.confirme||false})} style={{flex:1,padding:"10px 0",borderRadius:8,border:"none",background:"#3B82F6",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",opacity:valide?1:0.4}} disabled={!valide}>{isEdit?"Enregistrer":"Placer"}</button>
        </div>
        {isEdit&&<button onClick={onClose} style={{width:"100%",marginTop:8,padding:"6px 0",background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer"}}>Annuler</button>}
      </div>
    </div>
  );
}

// ─── MODAL SUGGESTION DE CRÉNEAU ─────────────────────────────────────────────
function ModalSuggestion({onClose,onPick,commerciaux,jours,planning,estBloque,seuils}){
  const[codePostal,setCodePostal]=useState("");
  const[ville,setVille]=useState("");
  const dept=deptFromCodePostal(codePostal);
  const coordsParCP=codePostal.length===5?findCoordsByPostal(codePostal):null;
  const coordsParVille=ville.length>2?findCoords(ville):null;
  const coordsCible=coordsParCP||coordsParVille||(dept?CENTRES_DEPT[dept]:null);

  // Calcule pour chaque créneau libre (jour+créneau+commercial) le trajet le plus contraignant
  // avec les RDV déjà présents ce jour-là pour ce commercial (avant et après)
  const suggestions=useMemo(()=>{
    if(!coordsCible)return[];
    const result=[];
    jours.forEach(j=>{
      commerciaux.forEach(c=>{
        CRENEAUX.forEach((cr,ci)=>{
          if(estBloque(j,cr,c))return;
          const rdvsCreneau=(planning[j]?.[cr]||[]).filter(r=>r.commercial===c);
          if(rdvsCreneau.length>0)return; // créneau déjà occupé, on ne le propose pas (sauf si tu veux doublons, on peut enlever ce filtre)

          // Cherche le RDV le plus proche dans le temps (avant et après) pour ce commercial ce jour
          let pireTrajet=null; // le trajet le plus long parmi les voisins directs
          const prevCr=CRENEAUX[ci-1];
          const nextCr=CRENEAUX[ci+1];
          [prevCr,nextCr].forEach(crVoisin=>{
            if(!crVoisin)return;
            const rdvsVoisin=(planning[j]?.[crVoisin]||[]).filter(r=>r.commercial===c);
            rdvsVoisin.forEach(rv=>{
              const cv=getCoords(rv);
              if(!cv)return;
              const min=estimerMin(coordsCible,cv);
              if(pireTrajet===null||min>pireTrajet)pireTrajet=min;
            });
          });
          result.push({jour:j,creneau:cr,commercial:c,trajetVoisin:pireTrajet});
        });
      });
    });
    // Tri : d'abord ceux qui ont un trajet voisin connu (les plus courts en premier), puis ceux sans contrainte (case isolée)
    result.sort((a,b)=>{
      if(a.trajetVoisin===null&&b.trajetVoisin===null)return 0;
      if(a.trajetVoisin===null)return 1;
      if(b.trajetVoisin===null)return -1;
      return a.trajetVoisin-b.trajetVoisin;
    });
    return result.slice(0,8);
  },[coordsCible,jours,commerciaux,planning,estBloque]);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:380,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:700,color:"#1e293b"}}>🎯 Trouver le meilleur créneau</h3>
        <label style={labelStyle}>Code postal</label>
        <input value={codePostal} onChange={e=>setCodePostal(e.target.value)} placeholder="19100" className="cp-input" style={{...inputStyle,fontSize:20,fontWeight:800,textAlign:"center",padding:"12px 10px",letterSpacing:1}} maxLength={5} inputMode="numeric" autoFocus/>
        {codePostal.length>=2&&<div style={{fontSize:11,marginTop:3,textAlign:"center",color:dept?"#10B981":"#EF4444"}}>{dept?`✓ ${DEPARTEMENTS[dept].label}`:"⚠️ Département non reconnu"}</div>}
        <label style={labelStyle}>Ville (optionnel, plus précis)</label>
        <input value={ville} onChange={e=>setVille(e.target.value)} placeholder="ex : Brive-la-Gaillarde" style={inputStyle}/>

        {dept&&(
          <div style={{marginTop:16}}>
            <div style={{fontSize:12,fontWeight:700,color:"#0f172a",marginBottom:8}}>Créneaux suggérés (du plus proche au plus loin) :</div>
            {suggestions.length===0&&<div style={{fontSize:12,color:"#94a3b8",textAlign:"center",padding:"10px 0"}}>Aucun créneau libre trouvé</div>}
            {suggestions.map((s,i)=>{
              const style=s.trajetVoisin!==null?trajetStyle(s.trajetVoisin,seuils):{label:"libre",color:"#64748b",bg:"#f1f5f9",icon:"○"};
              return(
                <button key={i} onClick={()=>onPick(s.jour,s.creneau,s.commercial,{dept,ville,codePostal,coords:coordsParCP||coordsParVille||null})}
                  style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",marginBottom:5,borderRadius:8,border:`1.5px solid ${style.color}`,background:style.bg,cursor:"pointer",textAlign:"left"}}>
                  <span style={{fontSize:12,fontWeight:700,color:"#1e293b"}}>{s.jour} · {s.creneau} · {s.commercial}</span>
                  <span style={{fontSize:11,fontWeight:800,color:style.color}}>{style.icon} {s.trajetVoisin!==null?formatTemps(s.trajetVoisin):"libre"}</span>
                </button>
              );
            })}
          </div>
        )}

        <button onClick={onClose} style={{width:"100%",marginTop:16,padding:"10px 0",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:14,cursor:"pointer"}}>Fermer</button>
      </div>
    </div>
  );
}

function RdvCard({rdv,onRemove,onToggleConfirm,onEdit}){
  const dep=DEPARTEMENTS[rdv.dept];
  return(
    <div onClick={onEdit} style={{background:rdv.confirme?"#FDE68A":dep.light,border:`1.5px solid ${rdv.confirme?"#D97706":dep.color}`,borderRadius:8,padding:"5px 8px",marginBottom:3,position:"relative",cursor:"pointer"}} title="Cliquer pour modifier">
      <div style={{display:"flex",alignItems:"center",gap:4,paddingRight:36}}>
        <span style={{fontSize:11,fontWeight:800,color:rdv.confirme?"#92400E":dep.color}}>{dep.label.split("–")[0].trim()}</span>
        <span style={{fontSize:10,color:"#64748b"}}>·</span>
        <span style={{fontSize:11,color:"#374151",fontWeight:600}}>{rdv.ville}</span>
      </div>
      {rdv.client&&<div style={{fontSize:10,color:"#64748b",marginTop:1}}>{rdv.client}</div>}
      {rdv.codePostal&&<div style={{fontSize:9,color:"#94a3b8"}}>{rdv.codePostal}</div>}
      {!rdv.coords&&<div style={{fontSize:9,color:"#F59E0B"}}>📍 centre dept.</div>}
      <div style={{position:"absolute",top:3,right:3,display:"flex",gap:1}}>
        <button onClick={e=>{e.stopPropagation();onToggleConfirm();}} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,padding:"1px 2px",opacity:rdv.confirme?1:0.35,lineHeight:1}}>⭐</button>
        <button onClick={e=>{e.stopPropagation();onRemove();}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:13,padding:"1px 2px",lineHeight:1}}>✕</button>
      </div>
    </div>
  );
}

function BadgeTrajet({min,cr2,seuils}){
  const{label,color,bg,icon}=trajetStyle(min,seuils);
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3,background:bg,color,border:`1.5px solid ${color}`,borderRadius:6,padding:"3px 7px",fontSize:11,fontWeight:800,margin:"2px 3px 2px 0",whiteSpace:"nowrap"}}>
      🚗 {icon} {label} → {cr2}
    </span>
  );
}

// Label de jour éditable (double-clic)
function JourLabel({label,onRename}){
  const[editing,setEditing]=useState(false);
  const[tmp,setTmp]=useState(label);
  if(editing) return(
    <div style={{display:"flex",gap:3,alignItems:"center",justifyContent:"center"}}>
      <input autoFocus value={tmp} onChange={e=>setTmp(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"){onRename(tmp);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
        style={{width:80,padding:"2px 5px",borderRadius:5,border:"none",fontSize:11,outline:"none",color:"#0f172a",textAlign:"center"}}/>
      <button onClick={()=>{onRename(tmp);setEditing(false);}} style={{background:"#3B82F6",color:"#fff",border:"none",borderRadius:4,padding:"2px 6px",fontSize:10,cursor:"pointer"}}>✓</button>
    </div>
  );
  return(
    <span onDoubleClick={()=>{setTmp(label);setEditing(true);}} title="Double-clic pour modifier" style={{cursor:"pointer",borderBottom:"1px dashed #475569",paddingBottom:1}}>{label}</span>
  );
}

// Label de secteur éditable pour le mini-tableau du calendrier
function SecteurLabel({label,onRename}){
  const[editing,setEditing]=useState(false);
  const[tmp,setTmp]=useState(label);
  if(editing) return(
    <div style={{display:"flex",gap:2,alignItems:"center",justifyContent:"center"}}>
      <input autoFocus value={tmp} onChange={e=>setTmp(e.target.value)}
        onKeyDown={e=>{if(e.key==="Enter"){onRename(tmp);setEditing(false);}if(e.key==="Escape")setEditing(false);}}
        style={{width:50,padding:"1px 3px",borderRadius:4,border:"1px solid #3B82F6",fontSize:9,outline:"none",color:"#0f172a",textAlign:"center"}}/>
    </div>
  );
  return(
    <span onDoubleClick={()=>{setTmp(label);setEditing(true);}} title="Double-clic pour modifier le secteur" style={{cursor:"pointer"}}>{label}</span>
  );
}

// ─── VUE SEMAINE ──────────────────────────────────────────────────────────────
function VueSemaine({planning,commerciaux,jours,onRenameJour,onAdd,onRemove,onToggleConfirm,onEdit,estBloque,toggleBlocage}){
  const thS={padding:"7px 5px",background:"#0f172a",color:"#fff",fontSize:11,fontWeight:700,textAlign:"center",border:"1px solid #1e293b",whiteSpace:"nowrap"};
  const tdS={border:"1px solid #e2e8f0",padding:4,verticalAlign:"top",minWidth:120};
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{borderCollapse:"collapse",width:"100%"}}>
        <colgroup><col style={{width:68}}/>{commerciaux.map((_,i)=><col key={i}/>)}</colgroup>
        <thead>
          <tr>
            <th style={thS}>Créneau</th>
            {jours.map((j,ji)=>(
              <th key={j} colSpan={commerciaux.length} style={{...thS,borderBottom:"2px solid #3B82F6"}}>
                <JourLabel label={j} onRename={v=>onRenameJour(ji,v)}/>
              </th>
            ))}
          </tr>
          <tr>
            <th style={{...thS,fontSize:9,color:"#64748b",background:"#1e293b"}}></th>
            {jours.map(j=>commerciaux.map(c=>(
              <th key={`${j}-${c}`} style={{...thS,fontSize:10,fontWeight:600,color:"#94a3b8",background:"#1e293b"}}>{c}</th>
            )))}
          </tr>
        </thead>
        <tbody>
          {CRENEAUX.map(cr=>(
            <tr key={cr}>
              <td style={{...tdS,background:"#1e293b",color:"#fff",fontWeight:700,fontSize:11,textAlign:"center",position:"relative",whiteSpace:"nowrap"}}>{cr}</td>
              {jours.map(j=>commerciaux.map(c=>{
                const rdvs=(planning[j]?.[cr]||[]).filter(r=>r.commercial===c);
                return(
                  <td key={`${j}-${c}`} style={tdS}>
                    {estBloque(j,cr,c)?(
                      <div style={{background:"#1e293b",borderRadius:8,minHeight:36,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 8px",cursor:"pointer"}} onClick={()=>toggleBlocage(j,cr,c)} title="Cliquer pour débloquer">
                        <span style={{fontSize:10,color:"#475569",fontWeight:600}}>🔒 Bloqué</span>
                        <span style={{fontSize:9,color:"#64748b"}}>débloquer</span>
                      </div>
                    ):(
                      <>
                        {rdvs.map(rdv=>(
                          <RdvCard key={rdv.id} rdv={rdv} onRemove={()=>onRemove(j,cr,rdv.id)} onToggleConfirm={()=>onToggleConfirm(j,cr,rdv.id)} onEdit={()=>onEdit&&onEdit(j,cr,rdv)}/>
                        ))}
                        <div style={{display:"flex",gap:3}}>
                          <button onClick={()=>onAdd(j,cr,c)}
                            style={{flex:1,padding:"2px 0",background:"none",border:"1.5px dashed #e2e8f0",borderRadius:6,color:"#cbd5e1",fontSize:14,cursor:"pointer"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="#3B82F6";e.currentTarget.style.color="#3B82F6";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#cbd5e1";}}>+</button>

                        </div>
                      </>
                    )}
                  </td>
                );
              }))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── VUE JOUR ─────────────────────────────────────────────────────────────────
function VueJour({planning,commerciaux,jours,onRenameJour,jourActif,setJourActif,onAdd,onRemove,onToggleConfirm,onEdit,estBloque,toggleBlocage,seuils,marges,departements}){
  const jourPlanning=planning[jourActif]||{};
  const trajetsByComm={};
  commerciaux.forEach(c=>{
    const rdvsParCr={};
    CRENEAUX.forEach(cr=>{rdvsParCr[cr]=(jourPlanning[cr]||[]).filter(r=>r.commercial===c);});
    trajetsByComm[c]=calculerTrajets(rdvsParCr);
  });

  return(
    <div>
      <div style={{display:"flex",gap:5,marginBottom:14,flexWrap:"wrap"}}>
        {jours.map((j,ji)=>(
          <button key={j} onClick={()=>setJourActif(j)} style={{padding:"7px 14px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:jourActif===j?"#0f172a":"#fff",color:jourActif===j?"#fff":"#64748b",boxShadow:jourActif===j?"0 2px 8px rgba(0,0,0,0.15)":"none"}}>
            <JourLabel label={j} onRename={v=>{onRenameJour(ji,v);setJourActif(v);}}/>
          </button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${commerciaux.length},1fr)`,gap:10}}>
        {commerciaux.map(c=>{
          const trajets=trajetsByComm[c]||[];
          return(
            <div key={c} style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
              <div style={{background:"#0f172a",color:"#fff",fontWeight:800,fontSize:13,padding:"8px 12px",textAlign:"center"}}>{c}</div>
              {CRENEAUX.map(cr=>{
                const rdvs=(jourPlanning[cr]||[]).filter(r=>r.commercial===c);
                const trajetsDuCr=trajets.filter(t=>t.fromCr===cr);
                return(
                  <div key={cr} style={{borderBottom:"1px solid #f1f5f9",padding:"6px 8px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#94a3b8",marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
                      {cr}
                      {!estBloque(jourActif,cr,c)&&<span onClick={()=>toggleBlocage(jourActif,cr,c)} title="Bloquer" style={{fontSize:8,color:"#d1d5db",cursor:"pointer",userSelect:"none"}} onMouseEnter={e=>e.currentTarget.style.color="#EF4444"} onMouseLeave={e=>e.currentTarget.style.color="#d1d5db"}>🔒</span>}
                    </div>
                    {rdvs.map((rdv,ri)=>{
                      const traj=trajetsDuCr.filter(t=>t.fromIdx===ri);
                      return(
                        <div key={rdv.id}>
                          <RdvCard rdv={rdv} onRemove={()=>onRemove(jourActif,cr,rdv.id)} onToggleConfirm={()=>onToggleConfirm(jourActif,cr,rdv.id)} onEdit={()=>onEdit(jourActif,cr,rdv)}/>
                          {traj.length>0&&(
                            <div style={{display:"flex",flexWrap:"wrap",gap:2,marginBottom:4,paddingLeft:4}}>
                              {traj.map((t,ti)=><BadgeTrajet key={ti} min={t.min} cr2={t.toCr} seuils={seuils}/>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {estBloque(jourActif,cr,c)?(
                      <div style={{background:"#0f172a",borderRadius:8,minHeight:28,cursor:"pointer"}} onClick={()=>toggleBlocage(jourActif,cr,c)} title="Débloquer"/>
                    ):(
                      <button onClick={()=>onAdd(jourActif,cr,c)}
                        style={{width:"100%",padding:"2px 0",background:"none",border:"1.5px dashed #e2e8f0",borderRadius:6,color:"#cbd5e1",fontSize:14,cursor:"pointer"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor="#3B82F6";e.currentTarget.style.color="#3B82F6";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#cbd5e1";}}>+</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── VUE CALENDRIER ───────────────────────────────────────────────────────────
function VueCalendrier({planning,commerciaux,jours,onRenameJour,filtreComm,setFiltreComm,filtreDept,setFiltreDept,onAdd,onRemove,onToggleConfirm,onEdit,secteurLabels,onRenameSecteur}){
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <select value={filtreComm} onChange={e=>setFiltreComm(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
          <option value="">Tous les commerciaux</option>
          {commerciaux.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtreDept} onChange={e=>setFiltreDept(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
          <option value="">Tous les secteurs</option>
          {Object.entries(DEPARTEMENTS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:`repeat(${jours.length},1fr)`,gap:8}}>
        {jours.map((j,ji)=>{
          const rdvsTous=[];
          CRENEAUX.forEach(cr=>{
            (planning[j]?.[cr]||[]).forEach(rdv=>{
              if(filtreComm&&rdv.commercial!==filtreComm)return;
              if(filtreDept&&rdv.dept!==filtreDept)return;
              rdvsTous.push({...rdv,cr});
            });
          });

          return(
            <div key={j} style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
              <div style={{background:"#1e293b",color:"#fff",fontWeight:800,fontSize:12,padding:"7px 10px",textAlign:"center"}}>
                <JourLabel label={j} onRename={v=>onRenameJour(ji,v)}/>
              </div>

              {/* Mini-tableau secteurs × créneaux */}
              <div style={{borderBottom:"1px solid #e2e8f0"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={{padding:"4px 3px",fontSize:9,color:"#94a3b8",fontWeight:700,borderBottom:"1px solid #f1f5f9"}}></th>
                      {commerciaux.map(c=>(
                        <th key={c} style={{padding:"4px 3px",fontSize:9,fontWeight:700,color:"#475569",borderBottom:"1px solid #f1f5f9",borderLeft:"1px solid #f1f5f9"}}>
                          <SecteurLabel label={secteurLabels[c]||c} onRename={v=>onRenameSecteur(c,v)}/>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CRENEAUX.map(cr=>(
                      <tr key={cr}>
                        <td style={{padding:"3px",fontSize:9,fontWeight:700,color:"#475569",borderBottom:"1px solid #f1f5f9"}}>{cr}</td>
                        {commerciaux.map(c=>{
                          const nbRdv=(planning[j]?.[cr]||[]).filter(r=>r.commercial===c).length;
                          return(
                            <td key={c} style={{padding:"3px",textAlign:"center",borderBottom:"1px solid #f1f5f9",borderLeft:"1px solid #f1f5f9"}}>
                              <span style={{
                                display:"inline-block",fontSize:11,fontWeight:700,padding:"2px 6px",borderRadius:5,minWidth:28,
                                background:nbRdv>0?"#f1f5f9":"#D1FAE5",
                                color:nbRdv>0?"#94a3b8":"#059669"
                              }}>
                                {nbRdv>0?nbRdv:"Libre"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{padding:6,minHeight:80}}>
                {rdvsTous.length===0&&<div style={{fontSize:11,color:"#cbd5e1",textAlign:"center",marginTop:12}}>— vide —</div>}
                {rdvsTous.map(rdv=>{
                  const dep=DEPARTEMENTS[rdv.dept];
                  return(
                    <div key={rdv.id} onClick={()=>onEdit(j,rdv.cr,rdv)} title="Cliquer pour modifier" style={{background:rdv.confirme?"#FDE68A":dep.light,border:`1.5px solid ${rdv.confirme?"#D97706":dep.color}`,borderRadius:7,padding:"4px 7px",marginBottom:4,position:"relative",cursor:"pointer"}}>
                      <div style={{fontSize:10,fontWeight:800,color:rdv.confirme?"#92400E":dep.color}}>{rdv.cr} · {dep.label.split("–")[0].trim()}</div>
                      <div style={{fontSize:10,color:"#374151"}}>{rdv.ville}</div>
                      {rdv.codePostal&&<div style={{fontSize:9,color:"#94a3b8"}}>{rdv.codePostal}</div>}
                      {rdv.client&&<div style={{fontSize:9,color:"#94a3b8"}}>{rdv.client}</div>}
                      {!filtreComm&&<div style={{fontSize:9,color:"#64748b",fontStyle:"italic"}}>{rdv.commercial}</div>}
                      <div style={{position:"absolute",top:3,right:3,display:"flex",gap:1}}>
                        <button onClick={e=>{e.stopPropagation();onToggleConfirm(j,rdv.cr,rdv.id);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,padding:1,opacity:rdv.confirme?1:0.3}}>⭐</button>
                        <button onClick={e=>{e.stopPropagation();onRemove(j,rdv.cr,rdv.id);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:11,padding:1}}>✕</button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={()=>onAdd(j,CRENEAUX[0],filtreComm||commerciaux[0])}
                  style={{width:"100%",padding:"3px 0",background:"none",border:"1.5px dashed #e2e8f0",borderRadius:6,color:"#cbd5e1",fontSize:14,cursor:"pointer",marginTop:2}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="#3B82F6";e.currentTarget.style.color="#3B82F6";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#cbd5e1";}}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
function PanneauReglages({seuils,setSeuils,marges,setMarges,onClose}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:"#fff",borderRadius:16,padding:28,width:380,maxHeight:"85vh",overflowY:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
        <h3 style={{margin:"0 0 16px",fontSize:17,fontWeight:700,color:"#1e293b"}}>⚙️ Réglages</h3>

        <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:8}}>Seuils de trajet</div>
        <label style={labelStyle}>Proche jusqu'à (min)</label>
        <input type="number" value={seuils.proche} onChange={e=>setSeuils(s=>({...s,proche:Number(e.target.value)}))} style={inputStyle}/>
        <label style={labelStyle}>Moyen jusqu'à (min) — au-delà = trop long</label>
        <input type="number" value={seuils.moyen} onChange={e=>setSeuils(s=>({...s,moyen:Number(e.target.value)}))} style={inputStyle}/>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          <span style={{background:"#D1FAE5",color:"#10B981",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>✓ proche</span>
          <span style={{background:"#FEF3C7",color:"#D97706",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>~ moyen</span>
          <span style={{background:"#FEE2E2",color:"#EF4444",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700}}>✗ trop long</span>
        </div>

        <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginTop:20,marginBottom:8}}>Marges entre créneaux (minutes)</div>
        {Object.keys(marges).map(k=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:12,color:"#64748b",flex:1}}>{k.replace("-"," → ")}</span>
            <input type="number" value={marges[k]} onChange={e=>setMarges(m=>({...m,[k]:Number(e.target.value)}))} style={{...inputStyle,width:70,padding:"5px 8px"}}/>
          </div>
        ))}

        <button onClick={onClose} style={{width:"100%",marginTop:20,padding:"10px 0",borderRadius:8,border:"none",background:"#3B82F6",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Fermer</button>
      </div>
    </div>
  );
}

const MOT_DE_PASSE = "0707";

export default function App(){
  const[connecte,setConnecte]=useState(()=>sessionStorage.getItem("planning_connecte")==="oui");
  const[motDePasseInput,setMotDePasseInput]=useState("");
  const[erreurMdp,setErreurMdp]=useState(false);
  const[vue,setVue]=useState("Jour");
  const[jours,setJours]=useState([...JOURS_DEFAULT]);
  const[commerciaux,setCommerciaux]=useState(["Commercial A","Commercial B","Commercial C","Commercial D"]);
  const[editingNom,setEditingNom]=useState(null);
  const[nomTemp,setNomTemp]=useState("");
  const[planning,setPlanning]=useState(()=>emptyPlanning(JOURS_DEFAULT));
  const[modal,setModal]=useState(null);
  const[jourActif,setJourActif]=useState(JOURS_DEFAULT[0]);
  const[filtreComm,setFiltreComm]=useState("");
  const[filtreDept,setFiltreDept]=useState("");
  const[showGererComm,setShowGererComm]=useState(false);
  const[showSuggestion,setShowSuggestion]=useState(false);
  const[showReglages,setShowReglages]=useState(false);
  const[seuils,setSeuils]=useState({proche:50,moyen:90});
  const[margesState,setMargesState]=useState({...MARGES});
  const[departements,setDepartements]=useState(JSON.parse(JSON.stringify(DEPARTEMENTS)));
  const[nomNouveauComm,setNomNouveauComm]=useState("");
  const[blocages,setBlocages]=useState(new Set());
  const[messageEquipe,setMessageEquipe]=useState("");
  const[editingMessage,setEditingMessage]=useState(false);
  const[messageTemp,setMessageTemp]=useState("");
  const[secteurLabels,setSecteurLabels]=useState({});

  function renameSecteur(commercial,label){
    setSecteurLabels(prev=>({...prev,[commercial]:label}));
  }
  const[loading,setLoading]=useState(true);
  const isFirstLoad=useRef(true);

  // Chargement initial depuis Supabase
  async function chargerTout(){
    const[jD,cD,pD,sD,mD,dD,bD,msgD,slD]=await Promise.all([
      loadData("jours"),
      loadData("commerciaux"),
      loadData("planning"),
      loadData("seuils"),
      loadData("marges"),
      loadData("departements"),
      loadData("blocages"),
      loadData("messageEquipe"),
      loadData("secteurLabels"),
    ]);
    if(jD)setJours(jD);
    if(cD)setCommerciaux(cD);
    if(pD)setPlanning(pD);
    if(sD)setSeuils(sD);
    if(mD)setMargesState(mD);
    if(dD)setDepartements(dD);
    if(bD)setBlocages(new Set(bD));
    if(msgD)setMessageEquipe(msgD);
    if(slD)setSecteurLabels(slD);
  }

  // Chargement initial
  useEffect(()=>{
    async function premierChargement(){
      await chargerTout();
      isFirstLoad.current=false;
      setLoading(false);
    }
    premierChargement();
  },[]);

  // Rafraîchissement automatique toutes les 5 secondes (sauf si on est en train d'écrire un message ou d'éditer un RDV)
  useEffect(()=>{
    const interval=setInterval(()=>{
      if(!editingMessage&&!modal) chargerTout();
    },5000);
    return ()=>clearInterval(interval);
  },[editingMessage,modal]);

  // Sauvegarde automatique à chaque changement (sauf au premier chargement)
  useEffect(()=>{ if(!isFirstLoad.current) saveData("jours",jours); },[jours]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("commerciaux",commerciaux); },[commerciaux]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("planning",planning); },[planning]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("seuils",seuils); },[seuils]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("marges",margesState); },[margesState]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("departements",departements); },[departements]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("blocages",Array.from(blocages)); },[blocages]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("messageEquipe",messageEquipe); },[messageEquipe]);
  useEffect(()=>{ if(!isFirstLoad.current) saveData("secteurLabels",secteurLabels); },[secteurLabels]);

  function blocageKey(j,cr,c){return`${j}||${cr}||${c}`;}
  function estBloque(j,cr,c){return blocages.has(blocageKey(j,cr,c));}
  function toggleBlocage(j,cr,c){
    setBlocages(prev=>{const n=new Set(prev);const k=blocageKey(j,cr,c);n.has(k)?n.delete(k):n.add(k);return n;});
  }

  // Renommer un jour (met à jour la clé dans le planning)
  function renameJour(idx,newLabel){
    if(!newLabel.trim())return;
    const old=jours[idx];
    const newJours=jours.map((j,i)=>i===idx?newLabel.trim():j);
    setJours(newJours);
    setPlanning(prev=>{
      const p={...prev};
      p[newLabel.trim()]=p[old]||{};
      CRENEAUX.forEach(cr=>{if(!p[newLabel.trim()][cr])p[newLabel.trim()][cr]=[];});
      delete p[old];
      return p;
    });
    if(jourActif===old)setJourActif(newLabel.trim());
  }

  function addCommercial(){
    const nom=nomNouveauComm.trim()||`Commercial ${String.fromCharCode(65+commerciaux.length)}`;
    setCommerciaux(prev=>[...prev,nom]);setNomNouveauComm("");
  }
  function removeCommercial(c){
    setCommerciaux(prev=>prev.filter(x=>x!==c));
    setPlanning(prev=>{
      const p=JSON.parse(JSON.stringify(prev));
      jours.forEach(j=>CRENEAUX.forEach(cr=>{p[j][cr]=(p[j][cr]||[]).filter(r=>r.commercial!==c);}));
      return p;
    });
  }
  function renameCommercial(idx,newName){
    if(!newName.trim())return;
    const old=commerciaux[idx];
    setCommerciaux(prev=>prev.map((n,i)=>i===idx?newName.trim():n));
    setPlanning(prev=>{
      const p=JSON.parse(JSON.stringify(prev));
      jours.forEach(j=>CRENEAUX.forEach(cr=>{p[j][cr]=(p[j][cr]||[]).map(r=>r.commercial===old?{...r,commercial:newName.trim()}:r);}));
      return p;
    });
    setEditingNom(null);
  }

  function handleAdd(jour,creneau,commercial){setModal({jour,creneau,commercial});}
  function handleEdit(jour,creneau,rdv){setModal({jour,creneau,commercial:rdv.commercial,rdvEdit:rdv});}
  function handleDeleteFromModal(){
    if(modal?.rdvEdit){handleRemove(modal.jour,modal.creneau,modal.rdvEdit.id);}
    setModal(null);
  }
  function handleSave(data){
    const{jour,rdvEdit}=modal;
    const creneauCible=data.creneau; // utilise le créneau choisi dans le formulaire, pas celui de la case cliquée
    setPlanning(prev=>{
      const newPrev={...prev,[jour]:{...prev[jour]}};
      if(rdvEdit){
        // Si le créneau a changé en édition, on retire du vieux créneau et on ajoute au nouveau
        const ancienCreneau=modal.creneau;
        if(ancienCreneau!==creneauCible){
          newPrev[jour][ancienCreneau]=(newPrev[jour][ancienCreneau]||[]).filter(r=>r.id!==rdvEdit.id);
          newPrev[jour][creneauCible]=[...(newPrev[jour][creneauCible]||[]),data];
        } else {
          newPrev[jour][creneauCible]=(newPrev[jour][creneauCible]||[]).map(r=>r.id===rdvEdit.id?data:r);
        }
      } else {
        newPrev[jour][creneauCible]=[...(newPrev[jour][creneauCible]||[]),data];
      }
      return newPrev;
    });
    setModal(null);
  }
  function handleRemove(jour,creneau,id){
    setPlanning(prev=>({...prev,[jour]:{...prev[jour],[creneau]:(prev[jour][creneau]||[]).filter(r=>r.id!==id)}}));
  }
  function handleToggleConfirm(jour,creneau,id){
    setPlanning(prev=>({...prev,[jour]:{...prev[jour],[creneau]:(prev[jour][creneau]||[]).map(r=>r.id===id?{...r,confirme:!r.confirme}:r)}}));
  }

  let totalRdv=0,totalConfirmes=0;
  jours.forEach(j=>CRENEAUX.forEach(cr=>(planning[j]?.[cr]||[]).forEach(r=>{totalRdv++;if(r.confirme)totalConfirmes++;})));

  function handleLogin(e){
    e.preventDefault();
    if(motDePasseInput===MOT_DE_PASSE){
      sessionStorage.setItem("planning_connecte","oui");
      setConnecte(true);
      setErreurMdp(false);
    } else {
      setErreurMdp(true);
    }
  }

  if(!connecte){
    return(
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f1f5f9",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
        <form onSubmit={handleLogin} style={{background:"#fff",borderRadius:16,padding:32,width:320,boxShadow:"0 8px 40px rgba(0,0,0,0.15)",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8}}>📅</div>
          <h2 style={{margin:"0 0 4px",fontSize:18,fontWeight:800,color:"#0f172a"}}>Planning Commerciaux</h2>
          <p style={{fontSize:12,color:"#64748b",margin:"0 0 20px"}}>Entrez le mot de passe pour accéder au planning</p>
          <input
            type="password"
            value={motDePasseInput}
            onChange={e=>{setMotDePasseInput(e.target.value);setErreurMdp(false);}}
            placeholder="Mot de passe"
            autoFocus
            style={{width:"100%",padding:"12px 14px",borderRadius:10,border:erreurMdp?"1.5px solid #EF4444":"1.5px solid #e2e8f0",fontSize:16,textAlign:"center",outline:"none",boxSizing:"border-box",marginBottom:10}}
          />
          {erreurMdp&&<div style={{color:"#EF4444",fontSize:12,fontWeight:600,marginBottom:10}}>Mot de passe incorrect</div>}
          <button type="submit" style={{width:"100%",padding:"12px 0",borderRadius:10,border:"none",background:"#3B82F6",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Se connecter</button>
        </form>
      </div>
    );
  }

  if(loading){
    return(
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f1f5f9",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>📅</div>
          <div style={{fontSize:14,color:"#64748b",fontWeight:600}}>Chargement du planning…</div>
        </div>
      </div>
    );
  }

  return(
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",background:"#f1f5f9",minHeight:"100vh",padding:"12px 10px"}}>
      <style>{`.cp-input::placeholder{color:#e5e7eb;}`}</style>
      {modal&&<ModalRdv onClose={()=>setModal(null)} onSave={handleSave} onDelete={handleDeleteFromModal} commerciaux={commerciaux} defaultComm={modal.commercial} defaultCreneau={modal.creneau} rdvEdit={modal.rdvEdit}/>}
      {showSuggestion&&<ModalSuggestion onClose={()=>setShowSuggestion(false)} onPick={(jour,creneau,commercial,data)=>{
        setShowSuggestion(false);
        setPlanning(prev=>({...prev,[jour]:{...prev[jour],[creneau]:[...(prev[jour][creneau]||[]),{id:newId(),commercial,creneau,dept:data.dept,ville:data.ville,client:"",codePostal:data.codePostal,coords:data.coords,confirme:false}]}}));
      }} commerciaux={commerciaux} jours={jours} planning={planning} estBloque={estBloque} seuils={seuils}/>}
      {showReglages&&<PanneauReglages seuils={seuils} setSeuils={setSeuils} marges={margesState} setMarges={setMargesState} onClose={()=>setShowReglages(false)}/>}

      <div style={{maxWidth:1500,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <h1 style={{fontSize:20,fontWeight:800,color:"#0f172a",margin:0}}>📅 Planning Commerciaux</h1>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{background:"#D1FAE5",color:"#059669",borderRadius:8,padding:"5px 12px",fontWeight:800,fontSize:12}}>{totalRdv} RDV</div>
          <div style={{background:"#FEF3C7",color:"#D97706",borderRadius:8,padding:"5px 12px",fontWeight:800,fontSize:12}}>⭐ {totalConfirmes}</div>
          <button onClick={()=>setShowSuggestion(true)} style={{padding:"5px 12px",borderRadius:8,border:"none",background:"#3B82F6",cursor:"pointer",fontWeight:700,fontSize:12,color:"#fff"}}>🎯 Meilleur créneau</button>
          <button onClick={()=>setShowGererComm(v=>!v)} style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,color:"#64748b"}}>👥 Commerciaux</button>
          <button onClick={()=>setShowReglages(true)} style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,color:"#64748b"}}>⚙️ Réglages</button>
        </div>
      </div>

      {showGererComm&&(
        <div style={{maxWidth:1500,margin:"0 auto 10px",background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#0f172a",marginBottom:10}}>👥 Équipe commerciale</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
            {commerciaux.map((c,idx)=>(
              <div key={c} style={{display:"flex",alignItems:"center",gap:4,background:"#f8fafc",borderRadius:8,padding:"5px 8px",border:"1.5px solid #e2e8f0"}}>
                {editingNom===idx?(
                  <>
                    <input autoFocus value={nomTemp} onChange={e=>setNomTemp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")renameCommercial(idx,nomTemp);if(e.key==="Escape")setEditingNom(null);}} style={{padding:"3px 6px",borderRadius:5,border:"1px solid #3B82F6",fontSize:12,outline:"none",width:120}}/>
                    <button onClick={()=>renameCommercial(idx,nomTemp)} style={{background:"#3B82F6",color:"#fff",border:"none",borderRadius:5,padding:"3px 7px",fontSize:11,cursor:"pointer"}}>✓</button>
                    <button onClick={()=>setEditingNom(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:13}}>✕</button>
                  </>
                ):(
                  <>
                    <span style={{fontSize:12,fontWeight:600,color:"#1e293b"}}>{c}</span>
                    <button onClick={()=>{setEditingNom(idx);setNomTemp(c);}} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:11}}>✏️</button>
                    <button onClick={()=>removeCommercial(c)} style={{background:"none",border:"none",cursor:"pointer",color:"#EF4444",fontSize:12}}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={nomNouveauComm} onChange={e=>setNomNouveauComm(e.target.value)} placeholder="Nom du nouveau commercial" onKeyDown={e=>e.key==="Enter"&&addCommercial()} style={{padding:"7px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,outline:"none",width:220}}/>
            <button onClick={addCommercial} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#3B82F6",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Ajouter</button>
          </div>
        </div>
      )}

      <div style={{maxWidth:1500,margin:"0 auto 10px",display:"flex",flexWrap:"wrap",gap:5,alignItems:"center"}}>
        {Object.entries(DEPARTEMENTS).map(([k,v])=>(
          <span key={k} style={{background:v.light,color:v.color,border:`1.5px solid ${v.color}`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>{v.label}</span>
        ))}
        <span style={{background:"#FEF3C7",color:"#D97706",border:"1.5px solid #FCD34D",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>⭐ Confirmé</span>
        <span style={{background:"#D1FAE5",color:"#10B981",border:"1.5px solid #10B981",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>✓ &lt;50mn</span>
        <span style={{background:"#FEF3C7",color:"#D97706",border:"1.5px solid #D97706",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>~ moyen</span>
        <span style={{background:"#FEE2E2",color:"#EF4444",border:"1.5px solid #EF4444",borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>✗ trop long</span>
        <span style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>Double-clic sur un jour pour le renommer</span>
      </div>

      <div style={{maxWidth:1500,margin:"0 auto 12px"}}>
        {editingMessage?(
          <div style={{background:"#FEF9E7",border:"1.5px solid #FCD34D",borderRadius:8,padding:"6px 10px"}}>
            <textarea
              autoFocus
              value={messageTemp}
              onChange={e=>setMessageTemp(e.target.value)}
              placeholder="Écris un message pour l'équipe : consignes, motivation, rappel..."
              style={{width:"100%",minHeight:28,border:"none",background:"transparent",fontSize:12,fontWeight:600,color:"#92400E",outline:"none",resize:"vertical",fontFamily:"inherit"}}
            />
            <div style={{display:"flex",gap:6,marginTop:4}}>
              <button onClick={()=>{setMessageEquipe(messageTemp);setEditingMessage(false);}} style={{padding:"3px 10px",borderRadius:6,border:"none",background:"#D97706",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}}>Enregistrer</button>
              <button onClick={()=>setEditingMessage(false)} style={{padding:"3px 10px",borderRadius:6,border:"1.5px solid #FCD34D",background:"#fff",color:"#92400E",fontWeight:600,fontSize:11,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        ):(
          <div onClick={()=>{setMessageTemp(messageEquipe);setEditingMessage(true);}} style={{background:messageEquipe?"#FEF9E7":"#f8fafc",border:`1.5px dashed ${messageEquipe?"#FCD34D":"#e2e8f0"}`,borderRadius:8,padding:"6px 10px",cursor:"pointer"}}>
            {messageEquipe?(
              <div style={{fontSize:12,fontWeight:600,color:"#92400E",whiteSpace:"pre-wrap"}}>📌 {messageEquipe}</div>
            ):(
              <div style={{fontSize:11,color:"#cbd5e1",fontStyle:"italic"}}>+ Cliquer pour écrire un message à l'équipe</div>
            )}
          </div>
        )}
      </div>

      <div style={{maxWidth:1500,margin:"0 auto 12px",display:"flex",gap:6}}>
        {VUES.map(v=>(
          <button key={v} onClick={()=>setVue(v)} style={{padding:"7px 18px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:vue===v?"#0f172a":"#fff",color:vue===v?"#fff":"#64748b",boxShadow:vue===v?"0 2px 8px rgba(0,0,0,0.15)":"none"}}>{v}</button>
        ))}
      </div>

      <div style={{maxWidth:1500,margin:"0 auto"}}>
        {vue==="Jour"&&<VueJour planning={planning} commerciaux={commerciaux} jours={jours} onRenameJour={renameJour} jourActif={jourActif} setJourActif={setJourActif} onAdd={handleAdd} onRemove={handleRemove} onToggleConfirm={handleToggleConfirm} onEdit={handleEdit} estBloque={estBloque} toggleBlocage={toggleBlocage} seuils={seuils}/>}
        {vue==="Calendrier"&&<VueCalendrier planning={planning} commerciaux={commerciaux} jours={jours} onRenameJour={renameJour} filtreComm={filtreComm} setFiltreComm={setFiltreComm} filtreDept={filtreDept} setFiltreDept={setFiltreDept} onAdd={handleAdd} onRemove={handleRemove} onToggleConfirm={handleToggleConfirm} onEdit={handleEdit} secteurLabels={secteurLabels} onRenameSecteur={renameSecteur}/>}
      </div>

      <div style={{maxWidth:1500,margin:"12px auto 0",padding:"8px 14px",background:"#fff",borderRadius:10,fontSize:10,color:"#94a3b8"}}>
        🚗 Trajets estimés ville à ville · ⭐ confirmer/déconfirmer · ✕ supprimer
      </div>
    </div>
  );
}
