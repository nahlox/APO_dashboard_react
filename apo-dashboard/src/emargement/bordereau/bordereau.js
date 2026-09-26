// Module « Bordereau des Heures » — repris de l'artefact d'émargement
// (claude.ai/artifact/LnNTgmwqfTqVKHhxQ9zchp) et branché sur Supabase.
// Rendu identique à l'artefact (DOM + CSS d'origine dans un Shadow DOM) ;
// seules la couche de données (sections 3 et 14) et le démarrage (15) ont été réécrits.
/* eslint-disable */
export const ROSTER=[
  {id:"A-01",nom:"DJEZOU ROGER",fonction:"Chef de quart",statut:"CDI",grp:"A"},
  {id:"A-02",nom:"HORO FULGENCE",fonction:"Op. clarification",statut:"CDI",grp:"A"},
  {id:"A-03",nom:"ALLOU KOUAME",fonction:"Ouv. clarification",statut:"CDD",grp:"A"},
  {id:"A-04",nom:"BAHI ANGE",fonction:"Ouv. clarification",statut:"CDD",grp:"A"},
  {id:"A-05",nom:"DION MAKAPEU FRANCK",fonction:"Op. presse",statut:"CDD",grp:"A"},
  {id:"A-06",nom:"GOUE CARMEL",fonction:"Op. malaxeur",statut:"CDD",grp:"A"},
  {id:"A-07",nom:"YOBOUET ERNERST",fonction:"Op. stérilisation",statut:"CDD",grp:"A"},
  {id:"A-08",nom:"DIDOKO MAHI",fonction:"Ouv. stérilisation",statut:"CDI",grp:"A"},
  {id:"A-09",nom:"DJE BI TA WILFRIED",fonction:"Ouv. stérilisation",statut:"CDD",grp:"A"},
  {id:"A-10",nom:"OUEDRAOGO ISSOUF",fonction:"Ouv. stérilisation",statut:"CDD",grp:"A"},
  {id:"A-11",nom:"ESSE KOUASSI",fonction:"Op. chaudière",statut:"CDD",grp:"A"},
  {id:"A-12",nom:"KOUASSI FERDINAND",fonction:"Ouv. chaudière",statut:"CDD",grp:"A"},
  {id:"A-13",nom:"YELIBI AHMED",fonction:"Ouv. chaudière",statut:"CDD",grp:"A"},
  {id:"A-14",nom:"DEGBA CHRISTIAN LOPEZ",fonction:"Ouv. chaudière",statut:"CDD",grp:"A"},
  {id:"A-15",nom:"KIPRE ANDERSON",fonction:"Ouv. chaudière",statut:"CDI",grp:"A"},
  {id:"A-16",nom:"KOUAME BIENVENU",fonction:"Ouv. florentin",statut:"CDD",grp:"A"},
  {id:"A-17",nom:"KOFFI YANNICK K",fonction:"Op. bassin",statut:"CDD",grp:"A"},
  {id:"A-18",nom:"KIEGBO ROLANDE",fonction:"Ouv. laboratoire",statut:"CDD",grp:"A"},
  {id:"B-01",nom:"OUEDRAOGO LACINAN",fonction:"Chef de quart",statut:"CDD",grp:"B"},
  {id:"B-02",nom:"SEHI APPOLOS",fonction:"Op. clarification",statut:"CDI",grp:"B"},
  {id:"B-03",nom:"KOUASSI JOEL",fonction:"Ouv. clarification",statut:"CDD",grp:"B"},
  {id:"B-04",nom:"OUATTARA DJODJAMA BLANCHE",fonction:"Ouv. clarification",statut:"CDD",grp:"B"},
  {id:"B-05",nom:"MALAN ACHILLE",fonction:"Op. presse",statut:"CDI",grp:"B"},
  {id:"B-06",nom:"GNAORE OMER",fonction:"Ouv. presse",statut:"CDD",grp:"B"},
  {id:"B-07",nom:"NADE DAGO CHARLES",fonction:"Op. stérilisation",statut:"CDD",grp:"B"},
  {id:"B-08",nom:"KOUADIO KOUAME SIMEON",fonction:"Ouv. stérilisation",statut:"CDD",grp:"B"},
  {id:"B-09",nom:"OTROU MEGUI",fonction:"Ouv. chaudière",statut:"CDD",grp:"B"},
  {id:"B-10",nom:"KOUASSI NESTOR",fonction:"Ouv. stérilisation",statut:"CDD",grp:"B"},
  {id:"B-11",nom:"TRAORE BONEYE",fonction:"Op. chaudière",statut:"CDI",grp:"B"},
  {id:"B-12",nom:"KAMBOU OLO ALBERT",fonction:"Ouv. chaudière",statut:"CDD",grp:"B"},
  {id:"B-13",nom:"OUATTARA MOUSSA",fonction:"Ouv. chaudière",statut:"CDD",grp:"B"},
  {id:"B-14",nom:"IRIE BI VANIE GISLAIN",fonction:"Ouv. chaudière",statut:"CDD",grp:"B"},
  {id:"B-15",nom:"YAO KOUASSI MARC ELYSEE",fonction:"Op. lagunage",statut:"CDD",grp:"B"},
  {id:"B-16",nom:"BANGALI ZLAMPIEU SARAH",fonction:"Ouv. laboratoire",statut:"CDD",grp:"B"},
  {id:"C-01",nom:"ADOU ATSE FREJUS",fonction:"Chef de quart",statut:"CDI",grp:"C"},
  {id:"C-02",nom:"KATIE AYMARD",fonction:"Op. clarification",statut:"CDI",grp:"C"},
  {id:"C-03",nom:"TABEA CLAREL",fonction:"Ouv. clarification",statut:"CDD",grp:"C"},
  {id:"C-04",nom:"KABERT MIRABEL",fonction:"Ouv. clarification",statut:"CDD",grp:"C"},
  {id:"C-05",nom:"N'GUESSAN MERMOZ",fonction:"Op. presse",statut:"CDD",grp:"C"},
  {id:"C-06",nom:"DEGBA YABA THIERRY",fonction:"Op. malaxeur",statut:"CDI",grp:"C"},
  {id:"C-07",nom:"KOUAKOU RAPHAEL",fonction:"Ouv. presse",statut:"CDD",grp:"C"},
  {id:"C-08",nom:"N'GORAN KOUASSI",fonction:"Op. stérilisation",statut:"CDI",grp:"C"},
  {id:"C-09",nom:"OROU ZEBOLOU",fonction:"Ouv. stérilisation",statut:"CDD",grp:"C"},
  {id:"C-10",nom:"ZADI MAMBO",fonction:"Ouv. stérilisation",statut:"CDD",grp:"C"},
  {id:"C-11",nom:"DEGBA YABA ELISEE",fonction:"Ouv. stérilisation",statut:"CDD",grp:"C"},
  {id:"C-12",nom:"KOKORA FRANCK",fonction:"Op. chaudière",statut:"CDD",grp:"C"},
  {id:"C-13",nom:"N'DA KOUAME",fonction:"Ouv. chaudière",statut:"CDD",grp:"C"},
  {id:"C-14",nom:"SEPY JULES",fonction:"Ouv. chaudière",statut:"CDD",grp:"C"},
  {id:"C-15",nom:"GROH ELIE",fonction:"Ouv. chaudière",statut:"CDD",grp:"C"},
  {id:"C-16",nom:"DEGBA OUPOH ARSENE",fonction:"Ouv. chaudière",statut:"CDI",grp:"C"},
  {id:"C-17",nom:"AKA YAPO FRANCK ELOI",fonction:"Op. bassin lagunage",statut:"CDD",grp:"C"},
  {id:"C-18",nom:"GBOMENE MARTHE",fonction:"Ouv. laboratoire",statut:"CDD",grp:"C"},
  {id:"CP-01",nom:"KANGA FLORA",fonction:"Pont bascule",statut:"CDD",grp:"CP"},
  {id:"CP-02",nom:"N'GORAN JEAN EUDES CARMEL",fonction:"Pont bascule",statut:"CDD",grp:"CP"},
  {id:"CP-03",nom:"BIAGNE EMMANUEL",fonction:"Pont bascule",statut:"CDI",grp:"CP"},
  {id:"CP-04",nom:"ASSI AYE FRANCK DAVID",fonction:"Pont bascule",statut:"CDI",grp:"CP"},
  {id:"CP-05",nom:"TOTO BORIS",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-06",nom:"N'DA LEONTINE",fonction:"Ouvrière carreau",statut:"CDD",grp:"CP"},
  {id:"CP-07",nom:"DIGBEU ZEBI ANDRIEN",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-08",nom:"KIEGBO GISELE",fonction:"Ouvrière carreau",statut:"CDD",grp:"CP"},
  {id:"CP-09",nom:"DOUDOU JEAN",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-10",nom:"KORE GBAYORO",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-11",nom:"NEME GUILLAUME",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-12",nom:"TOH YEMOUDA BEATRICE",fonction:"Ouvrière carreau",statut:"CDD",grp:"CP"},
  {id:"CP-13",nom:"SEPI KORE RICHARD",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-14",nom:"ALLO KODJI SERGE ROLAND",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-15",nom:"KONAN KOUAME SYLVANUS",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CP-16",nom:"YAKESSE OUNDO JEAN P",fonction:"Ouvrier carreau",statut:"CDD",grp:"CP"},
  {id:"CHAUF-01",nom:"AMON DINDJI",fonction:"Machiniste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-02",nom:"DOGROU LOBOUE ARNAUD",fonction:"Machiniste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-03",nom:"OPKALE ROGACIEN",fonction:"Machiniste",statut:"CDI",grp:"CHAUF"},
  {id:"CHAUF-04",nom:"GNAORE RODRIGUE",fonction:"Machiniste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-05",nom:"KONAN KOUAKOU ARMAND",fonction:"Tractoriste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-06",nom:"GOUET BAHI ERIC",fonction:"Tractoriste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-07",nom:"N'GUESSAN OLIVIER",fonction:"Tractoriste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-08",nom:"GUISSO DAVID",fonction:"Tractoriste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-09",nom:"YAO KOFFI JEAN EUDES",fonction:"Tractoriste",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-10",nom:"POYEGNON BORIS",fonction:"Chauffeur benne",statut:"CDI",grp:"CHAUF"},
  {id:"CHAUF-11",nom:"TOURE YODE",fonction:"Chauffeur benne",statut:"CDI",grp:"CHAUF"},
  {id:"CHAUF-12",nom:"KONE DJIBRIL",fonction:"Chauffeur benne",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-13",nom:"KOUAKOU YAO JEAN KADER",fonction:"Chauffeur benne",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-14",nom:"OUEDRAOGO AROUNA",fonction:"Chauffeur benne",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-15",nom:"KONE DONISSONGUI MOUSSA",fonction:"Chauffeur benne",statut:"CDD",grp:"CHAUF"},
  {id:"CHAUF-16",nom:"TA BI",fonction:"Chauffeur pick-up",statut:"CDI",grp:"CHAUF"},
  {id:"CHAUF-17",nom:"KODJO KOALA",fonction:"Chauffeur pick-up",statut:"CDD",grp:"CHAUF"},
  {id:"MECA-01",nom:"YEO MONHOUA",fonction:"Mécanicien engin",statut:"CDD",grp:"MECA"},
  {id:"MECA-02",nom:"BAKAYOKO BRAHIMA",fonction:"Mécanicien engin",statut:"CDD",grp:"MECA"},
  {id:"MECA-03",nom:"GOLI AMANI CLEMENT",fonction:"Mécanicien engin",statut:"CDD",grp:"MECA"},
  {id:"MAINT-01",nom:"KOUADIO KOUAKOU LAZARE",fonction:"Chef maintenance",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-02",nom:"LATH NICKSON",fonction:"Électricien",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-03",nom:"DIOMANDE MOUSSA",fonction:"Mécanicien",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-04",nom:"OKAIMGNI GISHLAIN",fonction:"Soudeur",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-05",nom:"OULAI ARNAUD",fonction:"Mécano-soudeur",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-06",nom:"KOUAME KOUAKOU JONAS",fonction:"Électricien",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-07",nom:"KOUASSI PHILLIPE",fonction:"Mécanicien",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-08",nom:"KOUAME HERMANN",fonction:"Mécanicien",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-09",nom:"KOYET SERGE PACOME",fonction:"Soudeur",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-10",nom:"YAPI JEAN CAMEL",fonction:"Soudeur",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-11",nom:"GNAZEBO KEVIN",fonction:"Électricien",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-12",nom:"KOFFI GUILLAUME",fonction:"Mécanicien",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-13",nom:"DIE EZECHIEL",fonction:"Mécanicien",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-14",nom:"ZADI FRANCK",fonction:"Soudeur",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-15",nom:"GUEDE MAHI YANNICK",fonction:"Soudeur",statut:"CDD",grp:"MAINT"},
  {id:"MAINT-16",nom:"KOUAKOU YAO JEAN BAPTISTE",fonction:"Gestionnaire de stock",statut:"CDI",grp:"MAINT"},
  {id:"MAINT-17",nom:"KOUASSI BINI DIDIER",fonction:"Gestionnaire de stock",statut:"CDD",grp:"MAINT"},
  {id:"MEN-01",nom:"BARBERE AMANDINE",fonction:"Ouvrière ménage",statut:"CDD",grp:"MEN"},
  {id:"MEN-02",nom:"DALIGOU INES",fonction:"Ouvrière ménage",statut:"CDD",grp:"MEN"},
  {id:"MEN-03",nom:"GOGOUA LEA",fonction:"Ouvrière ménage",statut:"CDD",grp:"MEN"},
  {id:"MEN-04",nom:"N'ZIAN MADELEINE",fonction:"Ouvrière ménage",statut:"CDD",grp:"MEN"},
  {id:"ADM-01",nom:"MAHDI",fonction:"Chef d'usine",statut:"CDD",grp:"ADM"},
  {id:"ADM-02",nom:"YAO KOUASSI MICHEL",fonction:"Chef comptable",statut:"CDI",grp:"ADM"},
  {id:"ADM-03",nom:"N'DRI YOROBO ARISTIDE",fonction:"Comptable",statut:"CDI",grp:"ADM"},
  {id:"ADM-04",nom:"GRODJUE MARIE NOELLE BENIE",fonction:"Caissière",statut:"CDI",grp:"ADM"},
  {id:"ADM-05",nom:"DOULO VANIE LOU TRA GERMAINE",fonction:"Assistante de direction",statut:"CDI",grp:"ADM"},
  {id:"ADM-06",nom:"OHOUO ACHIKA BRICE",fonction:"Resp. agricole",statut:"CDI",grp:"ADM"},
  {id:"ADM-07",nom:"GOORE BI",fonction:"Resp. contrôle qualité",statut:"CDI",grp:"ADM"},
  {id:"ADM-08",nom:"AMANI KOUADIO GISLAIN",fonction:"Resp. HSE",statut:"CDD",grp:"ADM"}
];

export function mountBordereau(root, api){
"use strict";


/* =========================================================
   1. Référentiel
   ========================================================= */
var QUARTS={
  q07 :{label:"Quart 07h", court:"07h", start:"07:00", end:"15:00", pause:30},
  q15 :{label:"Quart 15h", court:"15h", start:"15:00", end:"23:00", pause:30},
  q23 :{label:"Quart 23h", court:"23h", start:"23:00", end:"07:00", pause:30},
  jour:{label:"Journée",   court:"jour",start:"07:00", end:"17:00", pause:60}
};
var GROUPES=[
  {id:"A",    nom:"Équipe A",                  q:"q07"},
  {id:"B",    nom:"Équipe B",                  q:"q23"},
  {id:"C",    nom:"Équipe C",                  q:"q15"},
  {id:"CP",   nom:"Carreau et pont",           q:"jour"},
  {id:"CHAUF",nom:"Chauffeurs et machinistes", q:"jour"},
  {id:"MECA", nom:"Mécaniciens engin",         q:"jour"},
  {id:"MAINT",nom:"Maintenance",               q:"jour"},
  {id:"MEN",  nom:"Ménage",                    q:"jour"},
  {id:"ADM",  nom:"Administration",            q:"jour"}
];
var SITUATIONS=[{s:"P",label:"Présent"},{s:"CP",label:"Congé payé"},{s:"AM",label:"Arrêt maladie"},
                {s:"ABS",label:"Absent"},{s:"R",label:"Repos / férié"}];
var SITLABEL={}; SITUATIONS.forEach(function(x){SITLABEL[x.s]=x.label;});

var HISTO_JOURS=28, FENETRE_DB=60;
var K_DAYS="bdh4.days", K_EMPS="bdh4.emps", K_GRPQ="bdh4.grpq";

/* =========================================================
   2. Dates et heures
   ========================================================= */
function pad(n){return (n<10?"0":"")+n;}
function iso(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function fromISO(s){var p=s.split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
function addDays(d,n){var x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function startOfWeek(d){var x=new Date(d.getTime());x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x;}
var JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
var JOURS_C=["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
var MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
var MOIS_C=["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
function longDate(d){var s=JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()]+" "+d.getFullYear();
  return s.charAt(0).toUpperCase()+s.slice(1);}
function shortDate(d){return d.getDate()+" "+MOIS_C[d.getMonth()];}
function toMin(t){if(!t)return null;var p=String(t).split(":");return (+p[0])*60+(+p[1]);}
function toHHMM(m){m=((m%1440)+1440)%1440;return pad(Math.floor(m/60))+":"+pad(m%60);}
function dur(m){if(m==null)return "—";var s=m<0?"−":"";m=Math.abs(m);
  var h=Math.floor(m/60),r=m%60;return s+h+" h"+(r?" "+pad(r):"");}
function durShort(m){if(m==null)return "—";var s=m<0?"−":"";m=Math.abs(m);return s+Math.floor(m/60)+"h"+pad(m%60);}
function nowMin(){var n=new Date();return n.getHours()*60+n.getMinutes();}
function nowHHMM(){var n=new Date();return pad(n.getHours())+":"+pad(n.getMinutes());}

var TODAY=new Date(); TODAY.setHours(0,0,0,0);
var TODAY_ISO=iso(TODAY), YEST_ISO=iso(addDays(TODAY,-1));

/* =========================================================
   3. Magasin de données — Supabase (tables employes, emargements, rh_config)
   Isolation par client et droits d'écriture garantis par le RLS.
   ========================================================= */
var sb=api.sb;
var Store={mode:"local",emps:[],days:{},grpq:{},seeded:false,writable:!!api.writable,busy:0,
           dbid:{},byDbid:{}};
var SIT2DB={P:"present",CP:"conge",AM:"maladie",ABS:"absent",R:"repos"};
var DB2SIT={present:"P",mission:"P",conge:"CP",maladie:"AM",absent:"ABS",repos:"R",ferie:"R"};
function hhmm(t){return t?String(t).slice(0,5):null;}
function chk(r){if(r&&r.error)throw r.error;return r;}

var chain=Promise.resolve();
function queue(fn){
  Store.busy++;
  chain=chain.then(fn).then(done,function(err){done();onDbError(err);});
  return chain;
  function done(){Store.busy--;}
}
function onDbError(err){
  var code=err&&err.code, msg;
  if(code==="42501")msg="Enregistrement refusé : le bordereau de ce mois est validé, ou vos droits sont en lecture seule.";
  else msg="Enregistrement impossible — vérifiez la connexion. ("+((err&&err.message)||code||"erreur")+")";
  if(window.console&&console.warn)console.warn("bordereau:",err);
  toast(msg,null,null);
  load();          // on se réaligne sur la base
}

/* --- lecture --- */
function EMPS(){return Store.emps;}
function getE(empId,dateISO){
  var d=Store.days[dateISO];
  if(!d)return null;
  var e=d[empId];
  return (e&&e.s)?e:null;
}
function canon(e){
  return {s:(e&&e.s)||null,in:(e&&e.in)||null,out:(e&&e.out)||null,
          pause:(e&&e.pause!=null)?e.pause:null,note:(e&&e.note)||null};
}
function sortEmps(){Store.emps.sort(function(a,b){return a.id<b.id?-1:(a.id>b.id?1:0);});}

function load(){
  var since=iso(addDays(TODAY,-FENETRE_DB));
  return Promise.all([
    sb.from("employes").select("id,matricule,nom,poste,type_contrat,service").eq("actif",true),
    sb.from("emargements").select("employe_id,date_jour,statut,heure_arrivee,heure_depart,pause_minutes,observation")
      .gte("date_jour",since).limit(20000),
    sb.from("rh_config").select("quarts").maybeSingle()
  ]).then(function(r){
    r.forEach(chk);
    if(Store.busy)return;                      // une écriture est en cours : on garde l'état local
    var dbid={},byDbid={};
    var emps=(r[0].data||[]).map(function(o){
      var id=o.matricule||("E"+o.id);
      dbid[id]=o.id;byDbid[o.id]=id;
      return {id:id,nom:o.nom,fonction:o.poste||"—",statut:o.type_contrat==="CDI"?"CDI":"CDD",grp:o.service||"A"};
    });
    Store.dbid=dbid;Store.byDbid=byDbid;
    if(emps.length){Store.emps=emps;Store.seeded=true;}
    else{Store.emps=ROSTER.slice();Store.seeded=false;}
    sortEmps();
    var days={};
    (r[1].data||[]).forEach(function(o){
      var id=byDbid[o.employe_id];if(!id)return;
      if(!days[o.date_jour])days[o.date_jour]={};
      days[o.date_jour][id]={s:DB2SIT[o.statut]||"P",in:hhmm(o.heure_arrivee),out:hhmm(o.heure_depart),
                             pause:null,note:o.observation||null};
    });
    Store.days=days;
    Store.grpq=(r[2].data&&r[2].data.quarts)||{};
    setMode("db");
    if(!(typeof dlg!=="undefined"&&dlg.open))renderAll();
  });
}

/* --- écriture --- */
function setE(dateISO,empId,entry){
  var c=canon(entry);
  if(!Store.days[dateISO])Store.days[dateISO]={};
  Store.days[dateISO][empId]=c;
  var eid=Store.dbid[empId];
  if(!eid){
    toast("Cet employé n'est pas encore enregistré en base — onglet Effectif, « Recharger l'effectif ».",null,null);
    return Promise.resolve();
  }
  return queue(function(){
    if(!c.s){
      return sb.from("emargements").delete().eq("employe_id",eid).eq("date_jour",dateISO).then(chk);
    }
    return sb.from("emargements").upsert({
      tenant_id:api.tenantId,employe_id:eid,date_jour:dateISO,statut:SIT2DB[c.s]||"present",
      heure_arrivee:c.s==="P"?c.in:null,heure_depart:c.s==="P"?c.out:null,pause_minutes:0,observation:c.note
    },{onConflict:"tenant_id,employe_id,date_jour"}).then(chk);
  });
}
function putEmp(emp){
  var i=-1;
  Store.emps.forEach(function(e,ix){if(e.id===emp.id)i=ix;});
  if(i>=0)Store.emps[i]=emp; else Store.emps.push(emp);
  sortEmps();
  var champs={nom:emp.nom,poste:emp.fonction,type_contrat:emp.statut,service:emp.grp,actif:true};
  return queue(function(){
    var known=Store.dbid[emp.id];
    var find=known?Promise.resolve(known):
      sb.from("employes").select("id").eq("matricule",emp.id).maybeSingle().then(chk)
        .then(function(r){return r.data&&r.data.id;});
    return find.then(function(id){
      if(id){
        Store.dbid[emp.id]=id;Store.byDbid[id]=emp.id;
        return sb.from("employes").update(champs).eq("id",id).then(chk);
      }
      champs.tenant_id=api.tenantId;champs.matricule=emp.id;
      return sb.from("employes").insert(champs).select("id").single().then(chk).then(function(r){
        Store.dbid[emp.id]=r.data.id;Store.byDbid[r.data.id]=emp.id;Store.seeded=true;
      });
    });
  });
}
function dropEmp(id){
  // Retrait = désactivation : l'historique d'émargement de la personne est conservé.
  Store.emps=Store.emps.filter(function(e){return e.id!==id;});
  var eid=Store.dbid[id];
  if(!eid)return Promise.resolve();
  return queue(function(){return sb.from("employes").update({actif:false}).eq("id",eid).then(chk);});
}
function putQuart(gid,qk){
  Store.grpq[gid]=qk;
  var copy={};
  Object.keys(Store.grpq).forEach(function(k){copy[k]=Store.grpq[k];});
  return queue(function(){
    return sb.from("rh_config").upsert({tenant_id:api.tenantId,quarts:copy},{onConflict:"tenant_id"}).then(chk);
  });
}

/* =========================================================
   4. Calculs métier
   ========================================================= */
function grpById(id){for(var i=0;i<GROUPES.length;i++)if(GROUPES[i].id===id)return GROUPES[i];return GROUPES[0];}
function quartKey(gid){return Store.grpq[gid]||grpById(gid).q;}
function quartOf(emp){return QUARTS[quartKey(emp.grp)]||QUARTS.jour;}
function workedMin(e){
  if(!e||e.s!=="P"||!e.in||!e.out)return null;
  var a=toMin(e.in),b=toMin(e.out);
  if(b<a)b+=1440;                                  // franchit minuit ; b===a vaut zéro
  return b-a;                                      // sortie moins entrée, rien de plus
}
function elapsedMin(e){
  if(!e||!e.in)return null;
  var d=nowMin()-toMin(e.in);
  if(d<0)d+=1440;
  return d;
}
function posteCommence(emp){
  var q=quartOf(emp),ss=toMin(q.start),se=toMin(q.end),n=nowMin();
  if(se>ss)return n>=ss-30;
  return n>=ss-30||n<se;
}
function dateDuPoste(emp){
  var q=quartOf(emp),ss=toMin(q.start),se=toMin(q.end);
  if(se>ss)return TODAY_ISO;
  return nowMin()<se ? YEST_ISO : TODAY_ISO;
}

/* =========================================================
   5. Outils
   ========================================================= */
function $(id){return root.getElementById(id);}
function el(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n;}
function initials(n){
  var p=String(n).trim().split(/\s+/).filter(Boolean);
  return ((p[0]||"?")[0]+(p[1]?p[1][0]:"")).toUpperCase();
}
function norm(s){return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function empsOf(gid){return Store.emps.filter(function(e){return e.grp===gid;});}
function empById(id){for(var i=0;i<Store.emps.length;i++)if(Store.emps[i].id===id)return Store.emps[i];return null;}

var state={tab:"poste",week:startOfWeek(TODAY),q:"",grp:"*",showHors:false};

/* =========================================================
   6. Onglets
   ========================================================= */
var TABS=[["poste","v-poste"],["recap","v-recap"],["semaine","v-semaine"],["suivi","v-suivi"],["employes","v-employes"]];
function setTab(name){
  state.tab=name;
  TABS.forEach(function(t){
    $("tab-"+t[0]).setAttribute("aria-selected",t[0]===name?"true":"false");
    $(t[1]).hidden=t[0]!==name;
  });
  renderAll();
}
TABS.forEach(function(t){$("tab-"+t[0]).addEventListener("click",function(){setTab(t[0]);});});
function renderAll(){
  if(state.tab==="poste")renderDesk();
  else if(state.tab==="recap")renderRecap();
  else if(state.tab==="semaine")renderWeek();
  else if(state.tab==="suivi")renderSuivi();
  else if(state.tab==="employes")renderEmployes();
}

/* =========================================================
   7. Émargement
   ========================================================= */
function scanJour(){
  var g={topoint:[],enposte:[],fini:[],hors:[]};
  Store.emps.forEach(function(emp){
    var ey=getE(emp.id,YEST_ISO);
    if(ey&&ey.s==="P"&&ey.in&&!ey.out){g.enposte.push({emp:emp,date:YEST_ISO,e:ey,veille:true});return;}
    var eT=getE(emp.id,TODAY_ISO);
    if(ey&&ey.s==="P"&&ey.in&&ey.out&&toMin(ey.out)<toMin(ey.in)&&nowMin()<720&&(!eT||!eT.in)){
      g.fini.push({emp:emp,date:YEST_ISO,e:ey,veille:true});return;
    }
    if(eT&&eT.s==="P"&&eT.in&&!eT.out){g.enposte.push({emp:emp,date:TODAY_ISO,e:eT});return;}
    if(eT&&eT.s==="P"&&eT.in&&eT.out){g.fini.push({emp:emp,date:TODAY_ISO,e:eT});return;}
    if(eT&&eT.s!=="P"){g.hors.push({emp:emp,date:TODAY_ISO,e:eT});return;}
    if(posteCommence(emp))g.topoint.push({emp:emp,date:dateDuPoste(emp),e:null});
    else g.hors.push({emp:emp,date:TODAY_ISO,e:null,avenir:true});
  });
  return g;
}
function matchQ(emp){
  if(state.grp!=="*"&&emp.grp!==state.grp)return false;
  if(!state.q)return true;
  var q=norm(state.q);
  return norm(emp.nom).indexOf(q)>-1||norm(emp.id).indexOf(q)>-1||norm(emp.fonction).indexOf(q)>-1;
}

function ligne(item,mode){
  var emp=item.emp,e=item.e,q=quartOf(emp);
  var row=el("div","prow");
  row.dataset.emp=emp.id;

  var open=el("button","openrow");open.type="button";
  open.setAttribute("aria-label","Corriger la journée de "+emp.nom);
  open.appendChild(el("span","av",initials(emp.nom)));
  var info=el("span","pinfo");
  info.appendChild(el("b",null,emp.nom));
  var meta=el("span");
  meta.appendChild(el("i","tag"+(emp.statut==="CDI"?" tag-cdi":""),emp.statut||"CDD"));
  meta.appendChild(document.createTextNode((emp.fonction||"—")+" · "+grpById(emp.grp).nom));
  info.appendChild(meta);
  open.appendChild(info);
  open.addEventListener("click",function(){openDlg(emp.id,item.date);});
  row.appendChild(open);

  var t=el("span","ptime");
  if(mode==="topoint"){
    row.appendChild(boutonAction(emp,item.date,"in"));
  }else if(mode==="enposte"){
    t.appendChild(el("span","a",(item.veille?"hier ":"")+e.in));
    t.appendChild(el("span","b","depuis "+durShort(elapsedMin(e))));
    row.appendChild(t);
    row.appendChild(boutonAction(emp,item.date,"out"));
  }else if(mode==="fini"){
    t.appendChild(el("span","a",e.in+" → "+e.out));
    t.appendChild(el("span","b",(item.veille?"nuit · ":"")+dur(workedMin(e))));
    row.appendChild(t);
    row.appendChild(el("span","badge bg-ok","Réglé"));
  }else{
    var cls="bg-r",txt="Repos";
    if(item.avenir){cls="bg-soon";txt="Pas encore au poste";}
    else if(e&&e.s==="CP"){cls="bg-cp";txt="Congé payé";}
    else if(e&&e.s==="AM"){cls="bg-am";txt="Arrêt maladie";}
    else if(e&&e.s==="ABS"){cls="bg-abs";txt="Absent";}
    row.appendChild(el("span","badge "+cls,txt));
  }
  return row;
}
function boutonAction(emp,dateISO,champ){
  var b=el("button","act "+(champ==="in"?"act-in":"act-out"));
  b.type="button";
  b.appendChild(el("span","g",champ==="in"?"▸":"■"));
  b.appendChild(el("span",null,champ==="in"?"ENTRÉE":"SORTIE"));
  b.setAttribute("aria-label",(champ==="in"?"Enregistrer l'entrée de ":"Enregistrer la sortie de ")+emp.nom);
  if(!Store.writable){b.disabled=true;b.title="Lecture seule";}
  b.addEventListener("click",function(){pointer(emp,dateISO,champ);});
  return b;
}

function section(cls,titre,items,mode,vide,repliable){
  var s=el("section","sect "+cls),h=el("div","sect-h");
  h.appendChild(el("b",null,titre));
  h.appendChild(el("span","n",String(items.length)));
  s.appendChild(h);
  if(!items.length){s.appendChild(el("div","empty",vide));return s;}
  if(repliable&&items.length>6){
    var b=el("button","btn btn-ghost btn-sm more",state.showHors?"Masquer":"Afficher la liste");
    b.type="button";
    b.addEventListener("click",function(){state.showHors=!state.showHors;renderDesk();});
    h.appendChild(b);
    if(!state.showHors)return s;
  }
  var box=el("div","rows");
  items.forEach(function(it){box.appendChild(ligne(it,mode));});
  s.appendChild(box);
  return s;
}

function renderGrpBar(g){
  var bar=$("grpbar");bar.textContent="";
  var todoBy={};
  g.topoint.forEach(function(it){todoBy[it.emp.grp]=(todoBy[it.emp.grp]||0)+1;});
  function chip(id,nom,total,todo){
    var b=el("button","gchip");b.type="button";
    b.setAttribute("aria-pressed",state.grp===id?"true":"false");
    b.appendChild(el("span",null,nom));
    b.appendChild(el("span","n",String(total)));
    if(todo)b.appendChild(el("span","b",String(todo)));
    b.addEventListener("click",function(){state.grp=id;state.showHors=false;renderDesk();});
    bar.appendChild(b);
  }
  chip("*","Toutes",Store.emps.length,g.topoint.length);
  GROUPES.forEach(function(gr){
    var n=empsOf(gr.id).length;
    if(n)chip(gr.id,gr.nom,n,todoBy[gr.id]||0);
  });
}

function renderDesk(){
  $("dayTitle").textContent=longDate(TODAY);
  var g=scanJour(),c=$("counters");
  c.textContent="";
  [["a",g.topoint.length,"à émarger"],["b",g.enposte.length,"au poste"],
   ["c",g.fini.length,"quart réglé"],["",Store.emps.length,"à l'effectif"]].forEach(function(x){
    var b=el("div","cnt"+(x[0]?" "+x[0]:""));
    b.appendChild(el("div","v",String(x[1])));
    b.appendChild(el("div","k",x[2]));
    c.appendChild(b);
  });
  renderGrpBar(g);

  var d=$("desk");d.textContent="";
  if(!Store.emps.length){
    d.appendChild(el("div","empty","Aucun employé. Ouvrez l'onglet Effectif pour charger la liste."));
    $("deskNote").textContent="";
    return;
  }
  var f=function(a){return a.filter(function(it){return matchQ(it.emp);});};
  var filtre=state.q||state.grp!=="*";
  var vide=filtre?"Personne ici pour ce filtre.":null;
  d.appendChild(section("sect-a","À émarger",f(g.topoint),"topoint",
    vide||"Tout le monde est passé — rien à saisir."));
  d.appendChild(section("sect-b","Au poste",f(g.enposte),"enposte",
    vide||"Personne n'est actuellement au poste."));
  d.appendChild(section("sect-c","Quart réglé",f(g.fini),"fini",
    vide||"Aucune sortie enregistrée pour l'instant."));
  d.appendChild(section("sect-d","Hors poste aujourd'hui",f(g.hors),"hors",
    vide||"Personne.",!state.q));

  $("deskNote").textContent="L'heure inscrite est celle de l'horloge au moment du clic — c'est la signature. "+
    "Cliquez sur le nom pour corriger une heure, noter un congé ou une absence. "+
    "Quand le quart est fini, l'onglet Récap du jour écrit le message à envoyer.";
}

function pointer(emp,dateISO,champ){
  var avant=getE(emp.id,dateISO);
  var copie=avant?canon(avant):null;
  var e=avant?canon(avant):{};
  e.s="P";
  e[champ]=nowHHMM();
  setE(dateISO,emp.id,e);
  renderDesk();
  var r=root.querySelector('.prow[data-emp="'+emp.id+'"]');
  if(r)r.classList.add("flash");
  toast((champ==="in"?"Entrée":"Sortie")+" — "+emp.nom+" à ",e[champ],function(){
    setE(dateISO,emp.id,copie||{});
    renderDesk();
  });
}

var toastTimer=null,toastUndoFn=null;
function toast(txt,heure,undo){
  clearTimeout(toastTimer);
  var box=$("toastTxt");
  box.textContent=txt;
  if(heure)box.appendChild(el("b",null,heure));
  toastUndoFn=undo||null;
  $("toastUndo").hidden=!undo;
  $("toast").hidden=false;
  toastTimer=setTimeout(function(){$("toast").hidden=true;toastUndoFn=null;},7000);
}
$("toastUndo").addEventListener("click",function(){
  if(toastUndoFn)toastUndoFn();
  $("toast").hidden=true;toastUndoFn=null;clearTimeout(toastTimer);
});

$("q").addEventListener("input",function(){
  state.q=this.value;$("qClear").hidden=!this.value;renderDesk();
});
$("qClear").addEventListener("click",function(){
  $("q").value="";state.q="";this.hidden=true;renderDesk();$("q").focus();
});

function tick(){
  var n=new Date();
  $("clockHM").textContent=pad(n.getHours())+":"+pad(n.getMinutes());
  $("clockSec").textContent=":"+pad(n.getSeconds());
  if(n.getSeconds()===0&&state.tab==="poste"&&!dlg.open)renderDesk();
}

/* =========================================================
   8. Récap du jour
   ========================================================= */
function etatJour(emp){
  var e=getE(emp.id,TODAY_ISO);
  if(e)return e.s;
  var q=quartOf(emp);
  if(toMin(q.end)<=toMin(q.start)){
    var ey=getE(emp.id,YEST_ISO);
    if(ey&&ey.s==="P"&&ey.in)return "P";
  }
  return null;
}
function bilanJour(){
  var lignes=[],tot={eff:0,pres:0,abs:0,cp:0,am:0,rep:0,todo:0};
  GROUPES.forEach(function(g){
    var membres=empsOf(g.id);
    if(!membres.length)return;
    var b={g:g,eff:0,pres:0,absL:[],cp:0,am:0,rep:0,todo:0,total:membres.length,
           demarre:membres.some(posteCommence)};
    membres.forEach(function(emp){
      var s=etatJour(emp);
      if(s==="R"){b.rep++;return;}
      b.eff++;
      if(s==="P")b.pres++;
      else if(s==="ABS")b.absL.push(emp);
      else if(s==="CP")b.cp++;
      else if(s==="AM")b.am++;
      else b.todo++;
    });
    lignes.push(b);
    tot.pres+=b.pres;tot.abs+=b.absL.length;tot.cp+=b.cp;tot.am+=b.am;tot.rep+=b.rep;
    if(b.demarre){tot.eff+=b.eff;tot.todo+=b.todo;}
  });
  return {lignes:lignes,tot:tot};
}
function recapText(){
  var b=bilanJour(),L=[];
  L.push("Pointage du "+JOURS[TODAY.getDay()]+" "+TODAY.getDate()+" "+MOIS[TODAY.getMonth()]);
  L.push("");
  b.lignes.forEach(function(x){
    if(x.eff===0&&x.rep){L.push(x.g.nom+" au repos");L.push("");return;}
    if(!x.demarre&&!x.pres&&!x.absL.length){
      L.push(x.g.nom+" pas encore au poste");
      L.push("");return;
    }
    if(x.todo===x.eff&&x.eff){
      L.push(x.g.nom+" pas encore émargé ("+pad(x.eff)+" attendus)");
      L.push("");return;
    }
    L.push(x.g.nom+" présent "+pad(x.pres)+" absent "+pad(x.absL.length));
    x.absL.forEach(function(e){L.push(e.nom+", "+String(e.fonction||"").toLowerCase());});
    if(x.cp)L.push("dont "+pad(x.cp)+" en congé");
    if(x.am)L.push("dont "+pad(x.am)+" en arrêt maladie");
    L.push("");
  });
  L.push("Total usine présent "+pad(b.tot.pres)+" absent "+pad(b.tot.abs));
  return L.join("\n").replace(/\n{3,}/g,"\n\n").trim()+"\n";
}
function renderRecap(){
  $("recapTitle").textContent=longDate(TODAY);
  var b=bilanJour();
  $("recapTa").value=recapText();
  var w=$("recapWarn");w.textContent="";
  if(b.tot.todo){
    var box=el("div","warnbox");
    box.appendChild(el("b",null,b.tot.todo+(b.tot.todo>1?" employés ne sont pas encore émargés.":" employé n'est pas encore émargé.")));
    box.appendChild(document.createTextNode(" Ils ne comptent ni en présent ni en absent. Terminez l'émargement avant d'envoyer, ou marquez-les absents."));
    w.appendChild(box);
  }
  $("recapSub").textContent=b.tot.pres+" présents · "+b.tot.abs+" absents";

  var t=$("grpTable");t.textContent="";
  var thead=el("thead"),hr=el("tr");
  ["Équipe / service","Effectif","Présent","Absent","Congé","À émarger"].forEach(function(h){
    var th=el("th",null,h);th.scope="col";hr.appendChild(th);
  });
  thead.appendChild(hr);t.appendChild(thead);
  var tb=el("tbody");
  if(!b.lignes.length){
    var tr0=el("tr"),td0=el("td",null,"Aucun employé enregistré.");
    td0.colSpan=6;td0.style.textAlign="center";td0.style.color="var(--muted)";
    tr0.appendChild(td0);tb.appendChild(tr0);
  }
  b.lignes.forEach(function(x){
    var tr=el("tr"),td=el("td","gname");
    td.appendChild(el("b",null,x.g.nom));
    td.appendChild(el("span",null,QUARTS[quartKey(x.g.id)].label+
      (x.demarre?"":" · pas encore au poste")+(x.rep?" · "+x.rep+" au repos":"")));
    tr.appendChild(td);
    tr.appendChild(el("td",null,String(x.eff)));
    tr.appendChild(el("td",x.pres?"okv":"muted",pad(x.pres)));
    tr.appendChild(el("td",x.absL.length?"bad":"muted",pad(x.absL.length)));
    tr.appendChild(el("td",x.cp?"":"muted",x.cp?pad(x.cp):"—"));
    tr.appendChild(el("td",x.todo?"warnv":"muted",x.todo?pad(x.todo):"—"));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  var tf=el("tfoot"),fr=el("tr");
  fr.appendChild(el("td","txt","Total usine"));
  [b.tot.eff,b.tot.pres,b.tot.abs,b.tot.cp,b.tot.todo].forEach(function(v,i){
    fr.appendChild(el("td",null,i>=1?pad(v):String(v)));
  });
  tf.appendChild(fr);t.appendChild(tf);
}
$("recapRefresh").addEventListener("click",renderRecap);
$("selectBtn").addEventListener("click",function(){
  var ta=$("recapTa");ta.focus();ta.setSelectionRange(0,ta.value.length);
});
$("copyBtn").addEventListener("click",function(){
  var ta=$("recapTa"),ok=false;
  ta.focus();ta.setSelectionRange(0,ta.value.length);
  try{ok=document.execCommand("copy");}catch(e){}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(ta.value).then(flashCopied,function(){});
    ok=true;
  }
  if(ok)flashCopied();
});
function flashCopied(){
  var m=$("copiedMsg");m.classList.add("on");
  setTimeout(function(){m.classList.remove("on");},1900);
}

/* =========================================================
   9. Boîte de dialogue « corriger »
   ========================================================= */
var dlg=$("dlg"),dlgCtx=null;
function openDlg(empId,dateISO){
  var emp=empById(empId); if(!emp)return;
  dlgCtx={emp:emp,date:dateISO};
  var e=getE(empId,dateISO)||{},q=quartOf(emp);
  $("dAv").textContent=initials(emp.nom);
  $("dName").textContent=emp.nom;
  $("dMeta").textContent=emp.id+" · "+(emp.fonction||"—")+" · "+grpById(emp.grp).nom+" · "+q.label+
    " · "+(dateISO===TODAY_ISO?"aujourd'hui":shortDate(fromISO(dateISO)));
  dlgSituation(e.s||"P");
  $("dIn").value=e.in||"";
  $("dOut").value=e.out||"";
  $("dNote").value=e.note||"";
  $("dOk").disabled=!Store.writable;
  $("dDelete").disabled=!Store.writable;
  dlgCalc();
  if(dlg.showModal)dlg.showModal(); else dlg.setAttribute("open","");
}
function dlgSituation(cur){
  var box=$("dStatut");box.textContent="";
  SITUATIONS.forEach(function(st){
    var b=el("button",null);b.type="button";b.dataset.s=st.s;
    b.setAttribute("aria-pressed",st.s===cur?"true":"false");
    b.appendChild(el("i","dot"));b.appendChild(el("span",null,st.label));
    b.addEventListener("click",function(){
      Array.prototype.forEach.call(box.children,function(c){c.setAttribute("aria-pressed","false");});
      b.setAttribute("aria-pressed","true");
      $("dTimesWrap").hidden=st.s!=="P";
      if(st.s==="P"&&!$("dIn").value)$("dIn").value=quartOf(dlgCtx.emp).start;
      dlgCalc();
    });
    box.appendChild(b);
  });
  $("dTimesWrap").hidden=cur!=="P";
}
function dlgRead(){
  var sel=$("dStatut").querySelector('[aria-pressed="true"]');
  var s=sel?sel.dataset.s:"P",o={s:s};
  if(s==="P"){o.in=$("dIn").value||null;o.out=$("dOut").value||null;}
  if($("dNote").value)o.note=$("dNote").value;
  return o;
}
function dlgCalc(){
  var e=dlgRead(),emp=dlgCtx&&dlgCtx.emp,box=$("dCalc");
  box.textContent="";
  if(e.s!=="P"){box.textContent=SITLABEL[e.s]+" — aucune heure comptée.";return;}
  if(!e.in){box.textContent="Aucune entrée enregistrée.";return;}
  function part(k,v){var s=el("span",null,k+" ");s.appendChild(el("b",null,v));box.appendChild(s);}
  if(!e.out){part("Entré à",e.in);box.appendChild(el("span",null,"· sortie non saisie"));return;}
  part("Travaillé",dur(workedMin(e)));
}
["dIn","dOut","dNote"].forEach(function(id){$(id).addEventListener("input",dlgCalc);});
$("dOk").addEventListener("click",function(){
  if(!dlgCtx)return;
  setE(dlgCtx.date,dlgCtx.emp.id,dlgRead());
  dlg.close();renderAll();
});
$("dCancel").addEventListener("click",function(){dlg.close();});
$("dDelete").addEventListener("click",function(){
  if(!dlgCtx)return;
  setE(dlgCtx.date,dlgCtx.emp.id,{});
  dlg.close();renderAll();
});

/* =========================================================
   10. Semaine
   ========================================================= */
function cellFor(emp,dISO){
  var e=getE(emp.id,dISO),btn=el("button","cellbtn"),lbl;
  btn.type="button";
  if(!e&&dISO>TODAY_ISO){btn.className+=" cl-fut";btn.appendChild(el("span","code","·"));lbl="à venir";}
  else if(!e){btn.className+=" cl-none";btn.appendChild(el("span","code","—"));lbl="non émargé";}
  else if(e.s==="P"&&!e.out){btn.className+=" cl-live";btn.appendChild(el("span","code","AU POSTE"));
    lbl="entré à "+e.in+", sortie non saisie";}
  else if(e.s==="P"){
    var w=workedMin(e);
    btn.className+=" cl-P";
    btn.appendChild(el("span","h",durShort(w)));
    lbl=e.in+" → "+e.out+" · "+dur(w);
  }else{btn.className+=" cl-"+e.s;btn.appendChild(el("span","code",e.s));lbl=SITLABEL[e.s];}
  btn.setAttribute("aria-label",emp.nom+", "+shortDate(fromISO(dISO))+" : "+lbl);
  btn.dataset.tip="<b>"+esc(emp.nom)+"</b> · "+shortDate(fromISO(dISO))+"<br>"+esc(lbl);
  btn.addEventListener("click",function(){openDlg(emp.id,dISO);});
  return btn;
}
function renderWeek(){
  var ws=state.week,we=addDays(ws,6);
  $("weekTitle").textContent="Semaine du "+ws.getDate()+
    (ws.getMonth()===we.getMonth()?"":" "+MOIS_C[ws.getMonth()])+" au "+we.getDate()+" "+MOIS[we.getMonth()];
  $("wNext").disabled=ws.getTime()>=startOfWeek(TODAY).getTime();
  $("wPrev").disabled=ws.getTime()<=startOfWeek(addDays(TODAY,-(FENETRE_DB-7))).getTime();

  var days=[];for(var i=0;i<7;i++)days.push(addDays(ws,i));
  var t=$("weekTable");t.textContent="";

  var thead=el("thead"),hr=el("tr"),th0=el("th","c-name","Employé");th0.scope="col";hr.appendChild(th0);
  days.forEach(function(d){
    var th=el("th",iso(d)===TODAY_ISO?"today":null);th.scope="col";
    th.appendChild(el("span",null,JOURS_C[d.getDay()]));
    th.appendChild(el("span","dnum",pad(d.getDate())+"/"+pad(d.getMonth()+1)));
    hr.appendChild(th);
  });
  var thT=el("th",null,"Total");thT.scope="col";hr.appendChild(thT);
  thead.appendChild(hr);t.appendChild(thead);

  var tbody=el("tbody"),dayTot=[0,0,0,0,0,0,0],gTot=0,any=false,rempli=0;
  GROUPES.forEach(function(gr){
    var membres=empsOf(gr.id);
    if(!membres.length)return;
    any=true;
    var trh=el("tr","grphead"),tdh=el("td","c-name",gr.nom+" · "+QUARTS[quartKey(gr.id)].label);
    trh.appendChild(tdh);
    var tdh2=el("td");tdh2.colSpan=8;trh.appendChild(tdh2);
    tbody.appendChild(trh);
    membres.forEach(function(emp){
      var tr=el("tr"),tot=0,td0=el("td","c-name");
      td0.appendChild(el("b",null,emp.nom));
      td0.appendChild(el("span",null,(emp.statut||"")+" · "+(emp.fonction||"—")));
      tr.appendChild(td0);
      days.forEach(function(d,ix){
        var dISO=iso(d),e=getE(emp.id,dISO),w=workedMin(e)||0;
        if(e)rempli++;
        tot+=w;dayTot[ix]+=w;
        var td=el("td");td.appendChild(cellFor(emp,dISO));tr.appendChild(td);
      });
      gTot+=tot;
      tr.appendChild(el("td","c-tot"+(tot?"":" zero"),tot?durShort(tot):"—"));
      tbody.appendChild(tr);
    });
  });
  if(!any){
    var trv=el("tr"),tdv=el("td",null,"Aucun employé — chargez l'effectif dans l'onglet Effectif.");
    tdv.colSpan=9;tdv.style.padding="16px";tdv.style.color="var(--muted)";
    trv.appendChild(tdv);tbody.appendChild(trv);
  }
  t.appendChild(tbody);

  var tfoot=el("tfoot"),fr=el("tr");
  fr.appendChild(el("td","c-name","Total usine"));
  dayTot.forEach(function(m){fr.appendChild(el("td",null,m?durShort(m):"—"));});
  fr.appendChild(el("td","c-tot"+(gTot?"":" zero"),gTot?durShort(gTot):"—"));
  tfoot.appendChild(fr);t.appendChild(tfoot);

  var nt=$("weekNotice");nt.textContent="";
  if(!rempli&&any){
    var n=el("div","notice");
    n.appendChild(el("b",null,"Semaine vierge. "));
    n.appendChild(document.createTextNode(
      "C'est le bordereau tel qu'il se remplira : chaque émargement de l'onglet Émargement vient poser une case ici. "+
      "Cliquez sur n'importe quelle case pour saisir une journée à la main."));
    nt.appendChild(n);
  }

  var lg=$("weekLegend");lg.textContent="";
  [["h","7h45","Heures travaillées"],["live","···","Au poste, sortie non saisie"],
   ["CP","CP","Congé payé"],["AM","AM","Arrêt maladie"],["ABS","ABS","Absent"],
   ["R","R","Repos / férié"],["none","—","Pas émargé"],["fut","","À venir"]].forEach(function(x){
    var sp=el("span","lg");
    sp.appendChild(el("i","sw-"+x[0],x[1]));
    sp.appendChild(el("span",null,x[2]));
    lg.appendChild(sp);
  });
}
$("wPrev").addEventListener("click",function(){state.week=addDays(state.week,-7);renderWeek();});
$("wNext").addEventListener("click",function(){state.week=addDays(state.week,7);renderWeek();});
$("wToday").addEventListener("click",function(){state.week=startOfWeek(TODAY);renderWeek();});

/* =========================================================
   11. Suivi
   ========================================================= */
function periodDays(n){var a=[];for(var d=n-1;d>=0;d--)a.push(addDays(TODAY,-d));return a;}
function statsAll(){
  var days=periodDays(HISTO_JOURS),out={},tot={work:0,abs:0,cp:0,att:0,pres:0,cdi:0,cdd:0};
  Store.emps.forEach(function(emp){
    if(emp.statut==="CDI")tot.cdi++; else tot.cdd++;
    var s={work:0,abs:0,cp:0,am:0,jours:0,att:0};
    days.forEach(function(d){
      var e=getE(emp.id,iso(d));
      if(!e||e.s==="R")return;
      s.att++;
      if(e.s==="P"){var w=workedMin(e);if(w!=null){s.work+=w;s.jours++;}}
      else if(e.s==="ABS")s.abs++;
      else if(e.s==="CP")s.cp++;
      else if(e.s==="AM")s.am++;
    });
    s.presence=s.att?Math.round((s.att-s.abs)/s.att*100):null;
    out[emp.id]=s;
    tot.work+=s.work;tot.abs+=s.abs;tot.cp+=s.cp;
    tot.att+=s.att;tot.pres+=(s.att-s.abs);
  });
  tot.presence=tot.att?Math.round(tot.pres/tot.att*100):null;
  return {per:out,tot:tot,days:days};
}
function kpi(k,v,unit,note,cls){
  var b=el("div","kpi"+(cls?" "+cls:""));
  b.appendChild(el("div","k",k));
  var vv=el("div","v",v);if(unit)vv.appendChild(el("small",null,unit));
  b.appendChild(vv);b.appendChild(el("div","n",note));
  return b;
}
function renderSuivi(){
  var st=statsAll(),d0=st.days[0],d1=st.days[st.days.length-1];
  var histo=st.tot.att>0;
  $("suiviTitle").textContent="Du "+shortDate(d0)+" au "+shortDate(d1);
  $("effTot").textContent=Store.emps.length;

  var box=$("kpis");box.textContent="";
  box.appendChild(kpi("Effectif",Store.emps.length,"",st.tot.cdi+" CDI · "+st.tot.cdd+" CDD"));
  box.appendChild(kpi("Équipes et services",GROUPES.filter(function(g){return empsOf(g.id).length;}).length,"",
    "3 quarts + services journée"));
  box.appendChild(kpi("Taux de présence",histo?st.tot.presence:"—",histo?"%":"",
    histo?st.tot.att+" journées attendues":"en attente d'émargements",histo?"good":""));
  box.appendChild(kpi("Absences",histo?st.tot.abs:"—",histo?"j":"","Jours d'absence sur la période",
    histo&&st.tot.abs>6?"bad":""));
  box.appendChild(kpi("Heures travaillées",histo?Math.round(st.tot.work/60).toLocaleString("fr-FR"):"—",histo?"h":"",
    "Sur l'ensemble de l'usine"));

  var nt=$("suiviNotice");nt.textContent="";
  $("suiviCharts").hidden=!histo;
  $("recapPanel").hidden=!histo;
  if(!histo){
    var n=el("div","notice");
    n.appendChild(el("b",null,"Pas encore d'historique. "));
    n.appendChild(document.createTextNode(
      "Assiduité, heures travaillées et congés se calculent à partir des émargements : "+
      "cette page se remplira toute seule dès les premiers quarts pointés. L'effectif, lui, est déjà en base."));
    nt.appendChild(n);
    return;
  }
  chartGrp(st);chartPresence();recapTable(st);
}
function barPathH(x,y,w,h,r){
  r=Math.max(0,Math.min(r,w,h/2));if(w<=0)return "";
  return "M"+x+" "+y+"H"+(x+w-r)+"a"+r+" "+r+" 0 0 1 "+r+" "+r+"V"+(y+h-r)+"a"+r+" "+r+" 0 0 1 "+(-r)+" "+r+"H"+x+"Z";
}
function barPathV(x,y,w,h,r){
  r=Math.max(0,Math.min(r,w/2,h));
  return "M"+x+" "+(y+h)+"V"+(y+r)+"a"+r+" "+r+" 0 0 1 "+r+" "+(-r)+"H"+(x+w-r)+"a"+r+" "+r+" 0 0 1 "+r+" "+r+"V"+(y+h)+"Z";
}
function chartGrp(st){
  var svg=$("chartGrp"),rows=[];
  GROUPES.forEach(function(g){
    var membres=empsOf(g.id);
    if(!membres.length)return;
    var att=0,pres=0,abs=0;
    membres.forEach(function(e){
      var s=st.per[e.id]; if(!s)return;
      att+=s.att; pres+=(s.att-s.abs); abs+=s.abs;
    });
    if(!att)return;
    rows.push({nom:g.nom,pct:Math.round(pres/att*100),att:att,abs:abs,n:membres.length});
  });
  if(!rows.length){
    svg.setAttribute("viewBox","0 0 560 60");
    svg.innerHTML='<text x="280" y="34" text-anchor="middle" font-size="12" fill="var(--muted)">Aucune donnée</text>';
    return;
  }
  var LBL=150,VALW=42,ROW=30,TOP=14,BOT=26,W=560,H=TOP+rows.length*ROW+BOT;
  var plotW=W-LBL-VALW-10, x=function(v){return LBL+v/100*plotW;};
  var p=[];
  [0,25,50,75,100].forEach(function(v){
    p.push('<line x1="'+x(v).toFixed(1)+'" y1="'+(TOP-4)+'" x2="'+x(v).toFixed(1)+'" y2="'+(TOP+rows.length*ROW)+'" stroke="var(--grid)" stroke-width="1"/>');
    p.push('<text x="'+x(v).toFixed(1)+'" y="'+(TOP+rows.length*ROW+15)+'" text-anchor="middle" font-size="9.5" fill="var(--muted)">'+v+' %</text>');
  });
  rows.forEach(function(r,i){
    var y=TOP+i*ROW,bh=15,by=y+(ROW-bh)/2-1;
    p.push('<text x="'+(LBL-9)+'" y="'+(by+7)+'" text-anchor="end" font-size="11" fill="var(--ink-2)">'+esc(r.nom)+'</text>');
    p.push('<text x="'+(LBL-9)+'" y="'+(by+18)+'" text-anchor="end" font-size="9" fill="var(--muted)">'+r.n+' pers.</text>');
    p.push('<path d="'+barPathH(LBL,by,plotW,bh,4)+'" fill="var(--surface-2)"/>');
    p.push('<path d="'+barPathH(LBL,by,Math.max(x(r.pct)-LBL,2),bh,4)+'" fill="var(--accent)"/>');
    p.push('<text x="'+(W-6)+'" y="'+(by+11)+'" text-anchor="end" font-size="11" font-family="IBM Plex Mono, monospace" fill="var(--ink-2)">'+r.pct+' %</text>');
    p.push('<rect x="'+LBL+'" y="'+y+'" width="'+(plotW+VALW)+'" height="'+ROW+'" fill="transparent" data-tip="'+
           esc("<b>"+r.nom+"</b><br>"+r.pct+" % de présence<br>"+r.abs+" absence(s) sur "+r.att+" journées attendues")+'"/>');
  });
  svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.innerHTML=p.join("");wireTips(svg);
}
function chartPresence(){
  var svg=$("chartPresence"),days=periodDays(14);
  var vals=days.map(function(d){
    var dISO=iso(d),n=0,att=0;
    Store.emps.forEach(function(e){
      var en=getE(e.id,dISO);
      if(en&&en.s==="R")return;
      att++;if(en&&en.s==="P")n++;
    });
    return {d:d,n:n,att:att};
  });
  var LEFT=30,RIGHT=6,TOP=12,BOT=30,W=560,H=200,plotW=W-LEFT-RIGHT,plotH=H-TOP-BOT;
  var max=Math.max(Store.emps.length,1),y=function(v){return TOP+plotH-v/max*plotH;};
  var step=plotW/vals.length,bw=Math.min(24,step-7),p=[];
  var ticks=[0,Math.round(max/3),Math.round(max*2/3),max];
  ticks.forEach(function(v){
    p.push('<line x1="'+LEFT+'" y1="'+y(v).toFixed(1)+'" x2="'+(W-RIGHT)+'" y2="'+y(v).toFixed(1)+'" stroke="var(--grid)" stroke-width="1"/>');
    p.push('<text x="'+(LEFT-7)+'" y="'+(y(v)+3.5).toFixed(1)+'" text-anchor="end" font-size="9.5" fill="var(--muted)">'+v+'</text>');
  });
  vals.forEach(function(v,i){
    var cx=LEFT+i*step+step/2,bx=cx-bw/2,h=Math.max(v.n/max*plotH,v.n?2:0),last=i===vals.length-1;
    if(h>0)p.push('<path d="'+barPathV(bx,y(v.n),bw,h,4)+'" fill="var(--accent)" opacity="'+(last?"1":"0.55")+'"/>');
    if(i%2===0||last)p.push('<text x="'+cx.toFixed(1)+'" y="'+(H-BOT+15)+'" text-anchor="middle" font-size="9" fill="var(--muted)">'+pad(v.d.getDate())+'/'+pad(v.d.getMonth()+1)+'</text>');
    p.push('<text x="'+cx.toFixed(1)+'" y="'+(H-BOT+25)+'" text-anchor="middle" font-size="8" fill="var(--muted)">'+JOURS_C[v.d.getDay()].charAt(0)+'</text>');
    p.push('<rect x="'+(cx-step/2)+'" y="'+TOP+'" width="'+step+'" height="'+plotH+'" fill="transparent" data-tip="'+
           esc("<b>"+shortDate(v.d)+"</b><br>"+v.n+" au poste sur "+v.att+" attendus")+'"/>');
  });
  p.push('<line x1="'+LEFT+'" y1="'+y(0)+'" x2="'+(W-RIGHT)+'" y2="'+y(0)+'" stroke="var(--line-strong)" stroke-width="1"/>');
  svg.setAttribute("viewBox","0 0 "+W+" "+H);svg.innerHTML=p.join("");wireTips(svg);
}
function recapTable(st){
  var t=$("recapTable");t.textContent="";
  var thead=el("thead"),hr=el("tr");
  ["Employé","Équipe","Jours","Heures","Absences","Congés","Présence"].forEach(function(h){
    var th=el("th",null,h);th.scope="col";hr.appendChild(th);
  });
  thead.appendChild(hr);t.appendChild(thead);
  var tb=el("tbody");
  Store.emps.forEach(function(emp){
    var s=st.per[emp.id];
    if(!s||!s.att)return;
    var tr=el("tr"),td=el("td","nm");
    td.appendChild(el("b",null,emp.nom));
    td.appendChild(el("span",null,(emp.statut||"")+" · "+(emp.fonction||"—")));
    tr.appendChild(td);
    tr.appendChild(el("td","txt",grpById(emp.grp).nom));
    tr.appendChild(el("td",null,String(s.jours)));
    tr.appendChild(el("td",null,Math.round(s.work/60)+" h"));
    tr.appendChild(el("td",s.abs?"bad":"muted",s.abs||"—"));
    tr.appendChild(el("td",s.cp?"":"muted",s.cp?s.cp+" j":"—"));
    tr.appendChild(el("td",s.presence<90?"warnv":"okv",s.presence+" %"));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
}

/* =========================================================
   12. Effectif
   ========================================================= */
function fillGrpSelects(){
  ["nGrp","pasteGrp"].forEach(function(id){
    var sel=$(id),cur=sel.value;sel.textContent="";
    GROUPES.forEach(function(g){
      var o=document.createElement("option");o.value=g.id;o.textContent=g.nom;sel.appendChild(o);
    });
    if(cur)sel.value=cur;
  });
}
function nextMat(gid){
  var max=0;
  Store.emps.forEach(function(e){
    if(e.grp!==gid)return;
    var m=/(\d+)\s*$/.exec(e.id);
    if(m&&+m[1]>max)max=+m[1];
  });
  return gid+"-"+pad(max+1);
}
function renderEmployes(){
  fillGrpSelects();
  $("empTitle").textContent=Store.emps.length+" personne"+(Store.emps.length>1?"s":"");
  $("empCount").textContent=Store.emps.length+" au total";
  ["nAdd","pasteAdd","reseed"].forEach(function(id){$(id).disabled=!Store.writable;});

  var nt=$("empNotice");nt.textContent="";
  if(Store.mode==="db"&&!Store.seeded){
    var n=el("div","notice");
    n.appendChild(el("b",null,"Effectif pas encore en base. "));
    n.appendChild(document.createTextNode("La liste affichée vient du fichier Excel, intégrée à la page. "+
      "Appuyez sur « Recharger l'effectif du fichier Excel » pour l'enregistrer dans la base partagée."));
    nt.appendChild(n);
  }

  var box=$("grpList");box.textContent="";
  GROUPES.forEach(function(g){
    var membres=empsOf(g.id);
    var card=el("div","grpcard"),h=el("div","grpcard-h");
    h.appendChild(el("b",null,g.nom));
    h.appendChild(el("span","c",membres.length+" pers."));
    var sel=document.createElement("select");
    sel.setAttribute("aria-label","Quart de "+g.nom);
    sel.disabled=!Store.writable;
    Object.keys(QUARTS).forEach(function(qk){
      var o=document.createElement("option");o.value=qk;
      o.textContent=QUARTS[qk].label+" "+QUARTS[qk].start+"–"+QUARTS[qk].end;
      sel.appendChild(o);
    });
    sel.value=quartKey(g.id);
    sel.addEventListener("change",function(){putQuart(g.id,sel.value);renderEmployes();});
    h.appendChild(sel);
    card.appendChild(h);

    if(!membres.length){
      var em=el("div","empty","Personne enregistrée — collez la feuille de cette équipe ci-dessous.");
      em.style.margin="12px 16px";card.appendChild(em);
    }else{
      var sc=el("div","scroller"),t=el("table","recap");
      t.style.minWidth="520px";
      var tb=el("tbody");
      membres.forEach(function(emp){
        var tr=el("tr"),tdn=el("td","nm");
        tdn.appendChild(el("b",null,emp.nom));
        tdn.appendChild(el("span",null,emp.id));
        tr.appendChild(tdn);
        tr.appendChild(el("td","txt",emp.fonction||"—"));
        var tds=el("td"),ss=document.createElement("select");
        ss.setAttribute("aria-label","Statut de "+emp.nom);
        ss.style.width="auto";ss.style.padding="4px 7px";
        ss.disabled=!Store.writable;
        ["CDD","CDI"].forEach(function(v){
          var o=document.createElement("option");o.value=v;o.textContent=v;ss.appendChild(o);
        });
        ss.value=emp.statut||"CDD";
        ss.addEventListener("change",function(){
          var copie={id:emp.id,nom:emp.nom,fonction:emp.fonction,statut:ss.value,grp:emp.grp};
          putEmp(copie);
        });
        tds.appendChild(ss);tr.appendChild(tds);
        var tdd=el("td"),db=el("button","delbtn","×");
        db.type="button";db.setAttribute("aria-label","Retirer "+emp.nom);
        db.disabled=!Store.writable;
        db.addEventListener("click",function(){dropEmp(emp.id);renderEmployes();});
        tdd.appendChild(db);tr.appendChild(tdd);
        tb.appendChild(tr);
      });
      t.appendChild(tb);sc.appendChild(t);card.appendChild(sc);
    }
    box.appendChild(card);
  });

  $("empFoot").textContent=
    "Noms, fonctions et statuts repris de POINTAGE_PERSONNEL_APO.xlsx — 117 personnes réparties en 9 équipes et services. "+
    "L'orthographe des fonctions a été unifiée (OP - CLARIF, OUV-CLARIF et OUV- CLARIF sont devenus « Op. clarification » "+
    "et « Ouv. clarification ») : le sens est conservé, la forme est normalisée. "+
    (Store.mode==="db"
      ? "Chaque modification faite ici est enregistrée dans la base partagée."
      : "Hors base partagée, les modifications restent dans ce navigateur.");
}
$("nAdd").addEventListener("click",function(){
  var nom=$("nNom").value.trim();
  if(!nom){$("nNom").focus();return;}
  var gid=$("nGrp").value;
  putEmp({id:nextMat(gid),nom:nom,fonction:$("nFonc").value.trim()||"—",
          statut:$("nStat").value,grp:gid});
  $("nNom").value="";$("nFonc").value="";
  renderEmployes();$("nNom").focus();
});
$("pasteAdd").addEventListener("click",function(){
  var gid=$("pasteGrp").value,lines=$("pasteTa").value.split(/\r?\n/),n=0;
  lines.forEach(function(l){
    l=l.trim();if(!l)return;
    l=l.replace(/^\d+\s*[.)\-]?\s+/,"");
    var parts=l.split(/[;\t]/).map(function(x){return x.trim();});
    var nom=parts[0];if(!nom)return;
    var stat=String(parts[2]||"").toUpperCase().indexOf("CDI")>-1?"CDI":"CDD";
    putEmp({id:nextMat(gid),nom:nom,fonction:parts[1]||"—",statut:stat,grp:gid});
    n++;
  });
  $("pasteTa").value="";
  $("pasteMsg").textContent=n?(n+" personne"+(n>1?"s ajoutées":" ajoutée")+" dans "+grpById(gid).nom+"."):"Aucune ligne exploitable.";
  renderEmployes();
});
$("reseed").addEventListener("click",function(){
  if(Store.mode!=="db"){
    Store.emps=ROSTER.slice();saveLocal();renderEmployes();
    $("pasteMsg").textContent="Effectif rechargé.";
    return;
  }
  var i=0;
  $("pasteMsg").textContent="Enregistrement…";
  ROSTER.forEach(function(e){
    putEmp({id:e.id,nom:e.nom,fonction:e.fonction,statut:e.statut,grp:e.grp}).then(function(){
      i++;
      $("pasteMsg").textContent=i>=ROSTER.length?"Effectif enregistré dans la base.":("Enregistrement… "+i+" / "+ROSTER.length);
    });
  });
});

/* =========================================================
   13. Infobulles
   ========================================================= */
var tip=$("tip");
function wireTips(root){
  root.querySelectorAll("[data-tip]").forEach(function(n){
    n.addEventListener("pointerenter",function(ev){showTip(n.dataset.tip,ev);});
    n.addEventListener("pointermove",moveTip);
    n.addEventListener("pointerleave",hideTip);
  });
}
root.addEventListener("pointerover",function(ev){
  var n=ev.target.closest?ev.target.closest(".cellbtn[data-tip]"):null;
  if(n)showTip(n.dataset.tip,ev);
});
root.addEventListener("pointerout",function(ev){
  if(ev.target.closest&&ev.target.closest(".cellbtn[data-tip]"))hideTip();
});
root.addEventListener("pointermove",function(ev){if(tip.classList.contains("on"))moveTip(ev);});
function showTip(html,ev){tip.innerHTML=html;tip.classList.add("on");moveTip(ev);}
function moveTip(ev){
  var w=tip.offsetWidth,h=tip.offsetHeight;
  var x=Math.min(ev.clientX+14,window.innerWidth-w-10),y=ev.clientY-h-12;
  if(y<8)y=ev.clientY+18;
  tip.style.left=Math.max(8,x)+"px";tip.style.top=y+"px";
}
function hideTip(){tip.classList.remove("on");}

/* =========================================================
   14. Connexion à la base Palmeo (Supabase)
   ========================================================= */
function setMode(m){
  Store.mode=m;
  var pill=$("modePill"),txt=$("modeTxt");
  pill.className="pill "+(m==="db"?"pill-db":"pill-local");
  txt.textContent = m==="db"
    ? (Store.writable?"Base Palmeo":"Base Palmeo — lecture seule")
    : (m==="err"?"Hors connexion":"Connexion…");
  pill.title = m==="db"
    ? "Les émargements sont enregistrés dans la base Palmeo et visibles par tous ceux qui ont accès à l'émargement."
    : "La base Palmeo ne répond pas : rechargez la page.";
}
function connect(){
  return load().catch(function(err){
    if(window.console&&console.warn)console.warn("bordereau:",err);
    setMode("err");renderAll();
  });
}

/* =========================================================
   15. Démarrage
   ========================================================= */
var tickTimer=null,pollTimer=null;
function boot(){
  setMode("local");
  tick();tickTimer=setInterval(tick,1000);
  setTab(state.tab);
  connect();
  // Les autres postes (chef d'usine, RH…) voient les pointages des uns et des autres.
  pollTimer=setInterval(function(){
    if(!Store.busy&&!dlg.open&&document.visibilityState!=="hidden")load().catch(function(){});
  },30000);
}
boot();

return function destroy(){
  clearInterval(tickTimer);clearInterval(pollTimer);clearTimeout(toastTimer);
  if(dlg.open)dlg.close();
};
}
