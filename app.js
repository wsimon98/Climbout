/* Climbout - live flight tracker. https://github.com/wsimon98/Climbout  (Apache-2.0) */
(function(){
'use strict';
const R=3958.7613,REFRESH_MS=30000,KT_MPH=1.15077945;
const byId=id=>document.getElementById(id);
const $$=(sel,root)=>[...(root||document).querySelectorAll(sel)];
function text(id,value){const el=byId(id);if(el)el.textContent=value;}
function number(value){return typeof value==='number'&&Number.isFinite(value);}
function fmt(value){return Math.round(value).toLocaleString('en-US');}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function store(key,val){try{if(val===undefined)return JSON.parse(localStorage.getItem('climbout.'+key)||'null');localStorage.setItem('climbout.'+key,JSON.stringify(val));}catch(_){return null;}}

// ---------- airlines: IATA code -> [ICAO code, name] ----------
const AIRLINES={
 DL:['DAL','Delta Air Lines'],UA:['UAL','United Airlines'],AA:['AAL','American Airlines'],WN:['SWA','Southwest Airlines'],
 B6:['JBU','JetBlue'],AS:['ASA','Alaska Airlines'],NK:['NKS','Spirit Airlines'],F9:['FFT','Frontier Airlines'],
 G4:['AAY','Allegiant Air'],HA:['HAL','Hawaiian Airlines'],SY:['SCX','Sun Country Airlines'],MX:['MXY','Breeze Airways'],
 XP:['VXP','Avelo Airlines'],OO:['SKW','SkyWest Airlines'],YX:['RPA','Republic Airways'],'9E':['EDV','Endeavor Air'],
 MQ:['ENY','Envoy Air'],OH:['JIA','PSA Airlines'],YV:['ASH','Mesa Airlines'],QX:['QXE','Horizon Air'],
 ZW:['AWI','Air Wisconsin'],G7:['GJS','GoJet Airlines'],C5:['UCA','CommuteAir'],PT:['PDT','Piedmont Airlines'],
 '9K':['KAP','Cape Air'],AC:['ACA','Air Canada'],WS:['WJA','WestJet'],TS:['TSC','Air Transat'],PD:['POE','Porter Airlines'],
 F8:['FLE','Flair Airlines'],QK:['JZA','Jazz Aviation'],AM:['AMX','Aeromexico'],Y4:['VOI','Volaris'],VB:['VIV','Viva Aerobus'],
 CM:['CMP','Copa Airlines'],AV:['AVA','Avianca'],LA:['LAN','LATAM Airlines'],JJ:['TAM','LATAM Brasil'],G3:['GLO','GOL'],
 AD:['AZU','Azul'],AR:['ARG','Aerolineas Argentinas'],H2:['SKU','SKY Airline'],JA:['JAT','JetSMART'],UP:['BHS','Bahamasair'],
 BW:['BWA','Caribbean Airlines'],KX:['CAY','Cayman Airways'],DM:['DWI','Arajet'],
 BA:['BAW','British Airways'],VS:['VIR','Virgin Atlantic'],LH:['DLH','Lufthansa'],AF:['AFR','Air France'],KL:['KLM','KLM'],
 LX:['SWR','Swiss'],OS:['AUA','Austrian Airlines'],SN:['BEL','Brussels Airlines'],IB:['IBE','Iberia'],UX:['AEA','Air Europa'],
 VY:['VLG','Vueling'],AZ:['ITY','ITA Airways'],TP:['TAP','TAP Air Portugal'],SK:['SAS','SAS Scandinavian'],AY:['FIN','Finnair'],
 DY:['NAX','Norwegian'],EI:['EIN','Aer Lingus'],FR:['RYR','Ryanair'],U2:['EZY','easyJet'],W6:['WZZ','Wizz Air'],
 LO:['LOT','LOT Polish Airlines'],TK:['THY','Turkish Airlines'],PC:['PGT','Pegasus Airlines'],EW:['EWG','Eurowings'],
 DE:['CFG','Condor'],BT:['BTI','airBaltic'],A3:['AEE','Aegean Airlines'],FI:['ICE','Icelandair'],HV:['TRA','Transavia'],
 TO:['TVF','Transavia France'],WK:['EDW','Edelweiss'],LG:['LGL','Luxair'],BY:['TOM','TUI Airways'],LS:['EXS','Jet2'],
 WF:['WIF','Wideroe'],EN:['DLA','Air Dolomiti'],JU:['ASL','Air Serbia'],RO:['ROT','TAROM'],OU:['CTN','Croatia Airlines'],
 EK:['UAE','Emirates'],QR:['QTR','Qatar Airways'],EY:['ETD','Etihad Airways'],SV:['SVA','Saudia'],FZ:['FDB','flydubai'],
 G9:['ABY','Air Arabia'],WY:['OMA','Oman Air'],GF:['GFA','Gulf Air'],RJ:['RJA','Royal Jordanian'],LY:['ELY','El Al'],
 MS:['MSR','EgyptAir'],ET:['ETH','Ethiopian Airlines'],KQ:['KQA','Kenya Airways'],SA:['SAA','South African Airways'],
 AT:['RAM','Royal Air Maroc'],WB:['RWD','RwandAir'],MK:['MAU','Air Mauritius'],KC:['KZR','Air Astana'],HY:['UZB','Uzbekistan Airways'],
 AI:['AIC','Air India'],'6E':['IGO','IndiGo'],UL:['ALK','SriLankan Airlines'],PK:['PIA','Pakistan International'],
 SQ:['SIA','Singapore Airlines'],TR:['TGW','Scoot'],CX:['CPA','Cathay Pacific'],UO:['HKE','HK Express'],NH:['ANA','All Nippon Airways'],
 JL:['JAL','Japan Airlines'],MM:['APJ','Peach Aviation'],KE:['KAL','Korean Air'],OZ:['AAR','Asiana Airlines'],'7C':['JJA','Jeju Air'],
 CI:['CAL','China Airlines'],BR:['EVA','EVA Air'],CA:['CCA','Air China'],MU:['CES','China Eastern'],CZ:['CSN','China Southern'],
 HU:['CHH','Hainan Airlines'],'3U':['CSC','Sichuan Airlines'],MF:['CXA','Xiamen Airlines'],TG:['THA','Thai Airways'],
 VN:['HVN','Vietnam Airlines'],VJ:['VJC','VietJet Air'],MH:['MAS','Malaysia Airlines'],AK:['AXM','AirAsia'],GA:['GIA','Garuda Indonesia'],
 PR:['PAL','Philippine Airlines'],'5J':['CEB','Cebu Pacific'],QF:['QFA','Qantas'],VA:['VOZ','Virgin Australia'],JQ:['JST','Jetstar'],
 NZ:['ANZ','Air New Zealand'],FJ:['FJI','Fiji Airways'],TN:['THT','Air Tahiti Nui'],
 FX:['FDX','FedEx'],'5X':['UPS','UPS Airlines'],'5Y':['GTI','Atlas Air'],K4:['CKS','Kalitta Air'],CV:['CLX','Cargolux'],PO:['PAC','Polar Air Cargo']
};
const ICAO_AIRLINE={};for(const k in AIRLINES)ICAO_AIRLINE[AIRLINES[k][0]]=AIRLINES[k][1];
Object.assign(ICAO_AIRLINE,{EJA:'NetJets',LXJ:'Flexjet',ABX:'ABX Air',GEC:'Lufthansa Cargo',RUK:'Ryanair UK',KLC:'KLM Cityhopper',CFE:'BA CityFlyer',EJU:'easyJet Europe',EZS:'easyJet Switzerland',BCY:'CityJet',SHT:'British Airways Shuttle',CLH:'Lufthansa CityLine',LNK:'Airlink'});

// ---------- aircraft types (ICAO designator -> name) ----------
const TYPES={A19N:'Airbus A319neo',A20N:'Airbus A320neo',A21N:'Airbus A321neo',A318:'Airbus A318',A319:'Airbus A319',A320:'Airbus A320',A321:'Airbus A321',
 A306:'Airbus A300-600',A310:'Airbus A310',A332:'Airbus A330-200',A333:'Airbus A330-300',A338:'Airbus A330-800neo',A339:'Airbus A330-900neo',
 A343:'Airbus A340-300',A346:'Airbus A340-600',A359:'Airbus A350-900',A35K:'Airbus A350-1000',A388:'Airbus A380',BCS1:'Airbus A220-100',BCS3:'Airbus A220-300',
 B712:'Boeing 717',B733:'Boeing 737-300',B734:'Boeing 737-400',B735:'Boeing 737-500',B736:'Boeing 737-600',B737:'Boeing 737-700',B738:'Boeing 737-800',
 B739:'Boeing 737-900',B37M:'Boeing 737 MAX 7',B38M:'Boeing 737 MAX 8',B39M:'Boeing 737 MAX 9',B3XM:'Boeing 737 MAX 10',B744:'Boeing 747-400',
 B748:'Boeing 747-8',B752:'Boeing 757-200',B753:'Boeing 757-300',B762:'Boeing 767-200',B763:'Boeing 767-300',B764:'Boeing 767-400',
 B772:'Boeing 777-200',B77L:'Boeing 777-200LR / 777F',B773:'Boeing 777-300',B77W:'Boeing 777-300ER',B778:'Boeing 777-8',B779:'Boeing 777-9',
 B788:'Boeing 787-8',B789:'Boeing 787-9',B78X:'Boeing 787-10',MD11:'McDonnell Douglas MD-11',MD88:'McDonnell Douglas MD-88',
 CRJ2:'Bombardier CRJ200',CRJ7:'Bombardier CRJ700',CRJ9:'Bombardier CRJ900',CRJX:'Bombardier CRJ1000',E170:'Embraer E170',E75L:'Embraer E175',
 E75S:'Embraer E175',E190:'Embraer E190',E195:'Embraer E195',E290:'Embraer E190-E2',E295:'Embraer E195-E2',E135:'Embraer ERJ-135',E145:'Embraer ERJ-145',
 DH8C:'De Havilland Dash 8-300',DH8D:'De Havilland Dash 8-400',AT43:'ATR 42-300',AT45:'ATR 42-500',AT46:'ATR 42-600',AT72:'ATR 72',AT75:'ATR 72-500',AT76:'ATR 72-600',
 SF34:'Saab 340',C172:'Cessna 172',C182:'Cessna 182',C208:'Cessna 208 Caravan',PC12:'Pilatus PC-12',BE20:'Beechcraft King Air 200',B350:'Beechcraft King Air 350',
 C68A:'Cessna Citation Latitude',C700:'Cessna Citation Longitude',E55P:'Embraer Phenom 300',CL35:'Bombardier Challenger 350',GLEX:'Bombardier Global Express',
 GLF5:'Gulfstream V',GLF6:'Gulfstream G650',C17:'Boeing C-17 Globemaster III',K35R:'Boeing KC-135 Stratotanker'};
function typeName(t){return t?(TYPES[t]?TYPES[t]+' ('+t+')':t):'';}

// ---------- smart search: work out what the user typed ----------
function stripNum(n){return String(parseInt(n,10));}
function parseQuery(raw,forced){
 const s=String(raw||'').toUpperCase().trim().replace(/\s+/g,' ');
 if(!s)return{error:'Type a flight number, callsign, tail number or hex code.'};
 const c=s.replace(/ /g,'');
 const iata=c.match(/^([A-Z0-9]{2})-?(\d{1,4})([A-Z]?)$/),icao=c.match(/^([A-Z]{3})(\d{1,4})([A-Z]{0,2})$/);
 const fromIata=()=>{const a=AIRLINES[iata[1]];return{id:a[0]+stripNum(iata[2])+iata[3],mode:'callsign',label:iata[1]+stripNum(iata[2])+iata[3],from:iata[1]+stripNum(iata[2])+iata[3]};};
 const isIata=iata&&/[A-Z]/.test(iata[1])&&AIRLINES[iata[1]];
 if(forced==='hex'){const h=c.replace(/^~/,'');return /^[0-9A-F]{6}$/.test(h)?{id:h,mode:'hex',label:h}:{error:'An ICAO hex code is exactly 6 characters, 0-9 and A-F.'};}
 if(forced==='reg')return /^[A-Z0-9][A-Z0-9-]{1,9}$/.test(c)?{id:c,mode:'reg',label:c}:{error:'Tail numbers are 2-10 letters, digits or dashes (N12345, G-ABCD).'};
 if(forced==='callsign'){
   if(icao)return{id:icao[1]+stripNum(icao[2])+icao[3],mode:'callsign',label:c};
   if(isIata)return fromIata();
   return /^[A-Z0-9]{2,8}$/.test(c)?{id:c,mode:'callsign',label:c}:{error:'Callsigns are 2-8 letters and digits (UAL123).'};
 }
 // registrations that look like flight numbers (JA829J = Japanese tail, not JetSMART 829J)
 if(/^(JA[0-9]{3}[A-Z]|JA[0-9]{2}[A-Z]{2}|HL[0-9]{4})$/.test(c))return{id:c,mode:'reg',label:c};
 if(icao)return{id:icao[1]+stripNum(icao[2])+icao[3],mode:'callsign',label:c};
 if(isIata)return fromIata();
 if(/^[0-9A-F]{6}$/.test(c)&&/[0-9]/.test(c)&&!/^N[1-9]/.test(c))return{id:c,mode:'hex',label:c};
 if(/^[A-Z0-9]{1,2}-[A-Z0-9]{1,5}$/.test(c))return{id:c,mode:'reg',label:c};
 if(/^N[1-9][0-9]{0,4}[A-Z]{0,2}$/.test(c)||/^JA[0-9]{4}$/.test(c))return{id:c,mode:'reg',label:c};
 if(iata&&/[A-Z]/.test(iata[1]))return{id:c.replace('-',''),mode:'callsign',label:c,note:'Unknown airline code '+iata[1]+': searching callsign '+c.replace('-','')+'. Airline callsigns use 3 letters (UAL123).'};
 if(/^[A-Z0-9]{2,8}$/.test(c))return{id:c,mode:'callsign',label:c};
 return{error:'That does not look like a flight number, callsign, tail number or hex code.'};
}
const MODE_LABEL={callsign:'callsign',reg:'tail number',hex:'ICAO hex'};

// ---------- state ----------
let cfg=null;  // {id,mode,label,from}
const state={gen:0,map:null,plane:null,routeLine:null,trail:null,apLayer:null,follow:true,requesting:false,history:[],last:null,lastData:null,
 tileFailures:0,backupMap:false,controller:null,requestSeq:0,mapMode:'lite',spdMode:'gs',tmpMode:'a',oat:null,wxv:{G:null,A:null},wxAir:null,
 fresh:false,autoZoomed:false,route:null,routeTried:'',routeCtl:null,manual:null,metarKey:'',
 weather:{request:0,lastPos:null,lastFetch:0,lastAlt:null,controller:null}};
const isSmall=document.documentElement.classList.contains('m')||document.documentElement.classList.contains('ml');
let ov={wx:isSmall,dock:false,tools:false};
{const o=store('ov');if(o&&typeof o==='object')ov=Object.assign(ov,o);}
function setOv(k,v){ov[k]=v;store('ov',ov);}

// ---------- geometry ----------
function dist(a,b){const toRad=Math.PI/180,dLat=(b[0]-a[0])*toRad,dLon=(b[1]-a[1])*toRad;const x=Math.sin(dLat/2)**2+Math.cos(a[0]*toRad)*Math.cos(b[0]*toRad)*Math.sin(dLon/2)**2;return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function greatCircle(a,b,n){const t=Math.PI/180,[la1,lo1,la2,lo2]=[a[0]*t,a[1]*t,b[0]*t,b[1]*t];const d=2*Math.asin(Math.sqrt(Math.sin((la2-la1)/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin((lo2-lo1)/2)**2));if(!d)return[a,b];const out=[];for(let i=0;i<=n;i++){const f=i/n,A=Math.sin((1-f)*d)/Math.sin(d),B=Math.sin(f*d)/Math.sin(d);const x=A*Math.cos(la1)*Math.cos(lo1)+B*Math.cos(la2)*Math.cos(lo2),y=A*Math.cos(la1)*Math.sin(lo1)+B*Math.cos(la2)*Math.sin(lo2),z=A*Math.sin(la1)+B*Math.sin(la2);out.push([Math.atan2(z,Math.sqrt(x*x+y*y))/t,Math.atan2(y,x)/t]);}return out;}
// Longitudes are unwrapped next to a reference so lines across the date line stay continuous.
function wrapNear(lon,ref){while(lon-ref>180)lon-=360;while(lon-ref<-180)lon+=360;return lon;}
function unwrapLine(pts){const out=[];let ref=null;for(const p of pts){const lo=ref===null?p[1]:wrapNear(p[1],ref);out.push([p[0],lo]);ref=lo;}return out;}
function routePts(){const r=state.route;if(!r||!r.from||!r.to)return[];return unwrapLine(greatCircle([r.from.lat,r.from.lon],[r.to.lat,r.to.lon],64));}
function cardinal(deg){return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(((deg%360)+360)%360/22.5)%16];}
// ---------- time (viewer's own time zone) ----------
function dateStr(ts){return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true,timeZoneName:'short'}).format(new Date(ts*1000));}
function timeStr(ts){return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZoneName:'short',hour12:true}).format(new Date(ts*1000));}
function shortTime(ts){return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(ts*1000));}
function tzAbbr(){try{const p=new Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).formatToParts(new Date()).find(x=>x.type==='timeZoneName');return p?p.value:'LOCAL';}catch(_){return 'LOCAL';}}
function hm(mins){return mins>=60?Math.floor(mins/60)+'h '+String(mins%60).padStart(2,'0')+'m':mins+' min';}
function setStatus(status,message){byId('connection').className='connection'+(status==='live'?' live':status==='error'?' error':'');text('connectionText',message);byId('mapOverlay').className='map-overlay'+(status==='live'?' live':'');text('mapOverlayText',message);}
function setNotice(message,status){byId('notice').className='notice'+(status==='live'?' live':status==='error'?' error':'');text('noticeText',message);}
function apCode(ap){return ap?(ap.iata||ap.icao):'---';}
function apName(ap){return ap?(ap.city||ap.name||ap.icao):'';}
function airportIcon(code){return L.divIcon({html:'<div class="airport-pin">'+esc(code)+'</div>',className:'',iconSize:[52,25],iconAnchor:[26,12]});}
function planeIcon(heading,stale){const rotation=number(heading)?Math.round(heading):0;return L.divIcon({html:'<div class="plane-pin'+(stale?' stale-pin':'')+'"><svg viewBox="0 0 24 24" style="transform:rotate('+rotation+'deg)"><path d="M12 1.5 9.6 9.1 2 13v3l8-2v5.1L7 21v1.5l5-1.1 5 1.1V21l-3-1.9V14l8 2v-3l-7.6-3.9L12 1.5Z"/></svg></div>',className:'',iconSize:[54,54],iconAnchor:[27,27]});}
const validPt=p=>Array.isArray(p)&&p.length>=2&&number(p[0])&&number(p[1])&&Math.abs(p[0])<=90&&Math.abs(p[1])<=180;

// ---------- low-data map: world-wide, auto-fitted, no tiles ----------
const LAND=(window.CLIMBOUT_LAND||'').split('|').filter(Boolean).map(r=>{const pts=r.split(' ').map(p=>p.split(',').map(Number));let a=180,b=-180;for(const p of pts){if(p[0]<a)a=p[0];if(p[0]>b)b=p[0];}return{pts,minLon:a,maxLon:b};});
function liteRender(){
 const svg=byId('liteSvg');if(!svg)return;
 const W=Math.max(200,Math.round(svg.clientWidth||1000)),H=Math.max(150,Math.round(svg.clientHeight||525));
 svg.setAttribute('viewBox','0 0 '+W+' '+H);byId('liteBg').setAttribute('width',W);byId('liteBg').setAttribute('height',H);
 const ac=state.last,hasPlane=ac&&number(ac.lat)&&number(ac.lon);
 const rp=routePts();
 const refLon=rp.length?rp[0][1]:hasPlane?ac.lon:0;
 const track=(state.history||[]).filter(validPt).map(p=>[p[0],wrapNear(p[1],refLon)]);
 const plane=hasPlane?[ac.lat,wrapNear(ac.lon,refLon)]:null;
 const pts=rp.concat(track,plane?[plane]:[]);
 let minLat,maxLat,minLon,maxLon;
 if(pts.length){
   minLat=Math.min(...pts.map(p=>p[0]));maxLat=Math.max(...pts.map(p=>p[0]));minLon=Math.min(...pts.map(p=>p[1]));maxLon=Math.max(...pts.map(p=>p[1]));
   const pad=Math.max(1.5,(maxLat-minLat)*.18,(maxLon-minLon)*.12);
   minLat-=pad;maxLat+=pad;minLon-=pad;maxLon+=pad;
   const minSpan=8;if(maxLat-minLat<minSpan){const c=(maxLat+minLat)/2;minLat=c-minSpan/2;maxLat=c+minSpan/2;}
 }else{minLat=-56;maxLat=76;minLon=-170;maxLon=190;}
 minLat=Math.max(-85,minLat);maxLat=Math.min(85,maxLat);
 const k=Math.max(.2,Math.cos((minLat+maxLat)/2*Math.PI/180));
 // fit the box inside the panel, then widen the visible area to the panel's shape (kept within the poles)
 // keep a pixel margin so airport labels next to the edge points stay on screen
 const PX=pts.length?(W<520?44:60):0,PY=pts.length?30:0;
 const s=Math.min(Math.max(50,W-2*PX)/((maxLon-minLon)*k),Math.max(50,H-2*PY)/(maxLat-minLat));
 const cLon=(minLon+maxLon)/2;let cLat=(minLat+maxLat)/2;
 const halfH=H/2/s;if(halfH<88){cLat=Math.max(-88+halfH,Math.min(88-halfH,cLat));}else cLat=0;
 minLon=cLon-W/2/(k*s);maxLon=cLon+W/2/(k*s);maxLat=cLat+halfH;minLat=cLat-halfH;
 const X=lon=>(lon-minLon)*k*s,Y=lat=>(maxLat-lat)*s;
 const xy=p=>X(p[1]).toFixed(1)+','+Y(p[0]).toFixed(1);
 // land, repeated left/right of the date line when the view crosses it
 let d='';
 for(const ring of LAND){for(const off of [-360,0,360]){if(ring.maxLon+off<minLon||ring.minLon+off>maxLon)continue;
   d+='M'+ring.pts.map(p=>X(p[0]+off).toFixed(1)+','+Y(p[1]).toFixed(1)).join('L')+'Z';}}
 byId('liteLand').setAttribute('d',d);
 // graticule with labels
 const span=Math.max(maxLat-minLat,(maxLon-minLon)/2),step=[1,2,5,10,15,30].find(v=>span/v<=7)||30;
 let g='<path stroke="#99ccff" stroke-opacity=".16" stroke-width="1" fill="none" d="';const lbl=[];
 for(let la=Math.ceil(Math.max(-80,minLat)/step)*step;la<=Math.min(80,maxLat);la+=step){g+='M0 '+Y(la).toFixed(1)+'H'+W;lbl.push('<text x="6" y="'+(Y(la)-4).toFixed(1)+'">'+Math.abs(la)+'°'+(la>0?'N':la<0?'S':'')+'</text>');}
 for(let lo=Math.ceil(minLon/step)*step;lo<=maxLon;lo+=step){const L0=((lo+540)%360)-180;g+='M'+X(lo).toFixed(1)+' 0V'+H;lbl.push('<text x="'+(X(lo)+4).toFixed(1)+'" y="'+(H-8)+'">'+Math.abs(L0)+'°'+(L0>0&&L0<180?'E':L0<0?'W':'')+'</text>');}
 byId('liteGrid').innerHTML=g+'"/><g class="lite-lbl">'+lbl.join('')+'</g>';
 // route + airports
 byId('liteRoute').setAttribute('d',rp.length?rp.map((p,i)=>(i?'L':'M')+xy(p)).join(' '):'');
 const r=state.route,mark=(id,ap)=>{const g2=byId(id);if(!ap){g2.setAttribute('visibility','hidden');return;}
   g2.setAttribute('transform','translate('+xy([ap.lat,wrapNear(ap.lon,refLon)])+')');g2.querySelector('text').textContent=apCode(ap);g2.setAttribute('visibility','visible');};
 mark('liteFrom',r&&r.from);mark('liteTo',r&&r.to);
 // put the destination label on the side away from the origin
 if(r&&r.from&&r.to){const e=X(wrapNear(r.to.lon,refLon))>=X(r.from.lon);const tf=byId('liteFrom').querySelector('text'),tt=byId('liteTo').querySelector('text');
   tf.setAttribute('text-anchor',e?'end':'start');tf.setAttribute('x',e?-12:12);tt.setAttribute('text-anchor',e?'start':'end');tt.setAttribute('x',e?12:-12);}
 byId('liteTrack').setAttribute('points',track.map(xy).join(' '));
 const pl=byId('litePlane');
 if(plane){const hd=number(ac.track)?ac.track:number(ac.true_heading)?ac.true_heading:0;
   pl.setAttribute('transform','translate('+xy(plane)+') rotate('+hd+') scale('+(W<520?.75:1)+')');pl.setAttribute('visibility','visible');pl.setAttribute('opacity',state.fresh?'1':'0.4');}
 else pl.setAttribute('visibility','hidden');
 byId('liteCaption').setAttribute('y',H-30);
 text('liteFooter',!cfg?'Pick a flight to see it here. This map works without map tiles.':plane?(state.fresh?'Observed aircraft position - low-data map':'Last known aircraft position - signal delayed'):r?'Waiting for live coordinates - route shown for reference':'Waiting for live coordinates');
}
let liteTimer=0;
function liteSoon(){cancelAnimationFrame(liteTimer);liteTimer=requestAnimationFrame(()=>{if(state.mapMode==='lite')liteRender();});}
window.addEventListener('resize',liteSoon,{passive:true});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(liteSoon).observe(byId('liteMap'));

function setMapMode(mode){
 if(mode==='street'&&typeof L==='undefined')mode='lite';
 state.mapMode=mode;
 byId('mapWrap').classList.toggle('low-data',mode==='lite');
 byId('streetMode').setAttribute('aria-pressed',String(mode==='street'));
 byId('liteMode').setAttribute('aria-pressed',String(mode==='lite'));
 byId('fitBtn').disabled=mode==='lite';byId('centerBtn').disabled=mode==='lite';
 if(mode==='lite'){liteSoon();return;}
 if(!state.map)initMap();
 if(state.map)requestAnimationFrame(()=>{state.map.invalidateSize({animate:false,pan:false});drawRouteOnMap();
   if(state.last&&number(state.last.lat)){state.autoZoomed=false;updateMap(state.last,state.history,state.fresh);if(!state.follow||!state.fresh)fitRoute();}else fitRoute();});
}
function initMap(){if(typeof L==='undefined'){setMapMode('lite');text('liteFooter','Street map library unavailable. Low-data map remains available.');return;}
 const map=L.map('map',{zoomControl:false,worldCopyJump:true,scrollWheelZoom:true,touchZoom:true,doubleClickZoom:true,boxZoom:true,keyboard:true,dragging:true,tap:false,zoomSnap:1,zoomDelta:1,wheelPxPerZoomLevel:90,minZoom:2,maxBounds:[[-85,-540],[85,540]],maxBoundsViscosity:.6}).setView([30,-40],3);state.map=map;L.control.zoom({position:'topright'}).addTo(map);L.control.scale({position:'bottomright',imperial:true,metric:false}).addTo(map);
 // One raster source at a time. Switch to a backup if the primary tiles repeatedly fail.
 const tileOptions={maxZoom:18,updateWhenIdle:false,updateWhenZooming:false,keepBuffer:3};
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{...tileOptions,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'});
 const backup=L.tileLayer('https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{...tileOptions,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'});
 tiles.on('tileerror',function(){
   if(state.backupMap)return;
   if(++state.tileFailures>=8){state.backupMap=true;map.removeLayer(tiles);backup.addTo(map);byId('mapError').textContent='Primary map tiles unavailable. Using backup map imagery.';byId('mapError').hidden=false;}
 });
 let backupFails=0;
 backup.on('tileerror',function(){if(++backupFails<8)return;setMapMode('lite');text('liteFooter','Street imagery could not load. Switched to the low-data map.');});
 backup.on('load',function(){byId('mapError').hidden=true;});
 tiles.addTo(map);
 // Weather overlays (US NEXRAD radar + NWS warning polygons). Free, no key; radar is US-only.
 const wx5=()=>Math.floor(Date.now()/300000);
 const radar=L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png?t={t}',{maxZoom:18,opacity:.62,t:wx5,pane:'overlayPane',attribution:'Radar: NEXRAD via Iowa Env. Mesonet'});
 const warns=L.tileLayer.wms('https://mesonet.agron.iastate.edu/cgi-bin/wms/us/wwa.cgi',{layers:'warnings_p',format:'image/png',transparent:true,opacity:.9,version:'1.1.1',attribution:'Warnings: NWS via Iowa Env. Mesonet'});
 const wxCtl=L.control({position:'topright'});
 wxCtl.onAdd=function(){const d=L.DomUtil.create('div','wx-ctl leaflet-bar');
   d.innerHTML='<div class="wx-head"><b>US WEATHER</b><button type="button" class="wx-min" id="wxMin">Hide</button></div><div class="wx-body"><label><input type="checkbox" id="wxRadar" checked> Radar <small id="wxAge"></small></label><label><input type="checkbox" id="wxWarn" checked> Storm warnings</label><div class="wx-legend"><i style="background:#04e9e7"></i><i style="background:#019f44"></i><i style="background:#fdf802"></i><i style="background:#fd9500"></i><i style="background:#fd0000"></i><i style="background:#bc0000"></i><i style="background:#f800fd"></i><span>light &rarr; severe</span></div></div>';
   L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);return d;};
 wxCtl.addTo(map);
 {const box=wxCtl.getContainer(),btn=byId('wxMin');
  const apply=min=>{box.classList.toggle('min',min);btn.textContent=min?'Show':'Hide';setOv('wx',min);};
  btn.addEventListener('click',()=>apply(!box.classList.contains('min')));
  apply(ov.wx);}
 const tog=(id,layer)=>{const el=byId(id);const f=()=>el.checked?layer.addTo(map):map.removeLayer(layer);el.addEventListener('change',f);f();};
 tog('wxRadar',radar);tog('wxWarn',warns);
 const stamp=()=>{const el=byId('wxAge');if(el)el.textContent='updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});};
 stamp();
 setInterval(()=>{if(document.hidden)return;if(map.hasLayer(radar))radar.redraw();if(map.hasLayer(warns))warns.redraw();stamp();},300000);
 // Android rotation and browser UI resizing can leave Leaflet with stale tile bounds.
 const resizeMap=()=>map.invalidateSize({animate:false,pan:false,debounceMoveend:true});
 window.addEventListener('resize',resizeMap,{passive:true});
 window.addEventListener('orientationchange',()=>setTimeout(resizeMap,250),{passive:true});
 window.addEventListener('pageshow',resizeMap);
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(resizeMap).observe(byId('map'));
 state.apLayer=L.layerGroup().addTo(map);
 state.routeLine=L.polyline([],{color:'#cc3333',weight:3,dashArray:'8 9',opacity:.8}).addTo(map);
 state.trail=L.polyline([],{color:'#ff9900',weight:5,opacity:.95,lineCap:'round'}).addTo(map);
 map.on('dragstart',()=>{if(state.follow){state.follow=false;byId('follow').checked=false;}});
 drawRouteOnMap();fitRoute();
}
function drawRouteOnMap(){
 if(!state.map)return;
 state.apLayer.clearLayers();
 const r=state.route,rp=routePts();
 state.routeLine.setLatLngs(rp);
 if(r&&r.from)L.marker([r.from.lat,rp.length?rp[0][1]:r.from.lon],{icon:airportIcon(apCode(r.from))}).addTo(state.apLayer).bindPopup('<strong>'+esc(r.from.name||r.from.icao)+'</strong><br>'+esc(r.from.icao)+(r.from.iata?' / '+esc(r.from.iata):'')+' - origin');
 if(r&&r.to)L.marker([r.to.lat,rp.length?rp[rp.length-1][1]:r.to.lon],{icon:airportIcon(apCode(r.to))}).addTo(state.apLayer).bindPopup('<strong>'+esc(r.to.name||r.to.icao)+'</strong><br>'+esc(r.to.icao)+(r.to.iata?' / '+esc(r.to.iata):'')+' - destination');
}
function refLon(){const rp=routePts();return rp.length?rp[Math.floor(rp.length/2)][1]:null;}
function fitRoute(){
 state.autoZoomed=false;if(!state.map)return;
 const rp=routePts(),ac=state.last,pts=rp.slice();
 if(ac&&number(ac.lat)&&number(ac.lon)){const ref=refLon();pts.push([ac.lat,ref===null?ac.lon:wrapNear(ac.lon,ref)]);}
 if(pts.length>1)state.map.fitBounds(L.latLngBounds(pts),{padding:[42,36],maxZoom:7});
 else if(pts.length===1)state.map.setView(pts[0],7);
 else state.map.setView([30,-40],3);
}
function updateMap(ac,history,isFresh){state.fresh=isFresh;if(state.mapMode==='lite')liteSoon();if(!state.map)return;
 const ref=refLon()??(ac&&number(ac.lon)?ac.lon:0);
 const trace=(Array.isArray(history)?history:[]).filter(validPt).map(p=>[p[0],wrapNear(p[1],ref)]);
 state.trail.setLatLngs(trace);
 if(!ac||!number(ac.lat)||!number(ac.lon))return;
 const ll=[ac.lat,wrapNear(ac.lon,ref)],hdg=number(ac.track)?ac.track:number(ac.true_heading)?ac.true_heading:0;
 if(!state.plane)state.plane=L.marker(ll,{icon:planeIcon(hdg,!isFresh),zIndexOffset:1000}).addTo(state.map);
 else{state.plane.setLatLng(ll);state.plane.setIcon(planeIcon(hdg,!isFresh));}
 state.plane.bindPopup('<b>'+esc(ac.flight||(cfg&&cfg.id)||'')+'</b><br>'+(isFresh?'Observed ADS-B position':'Last known ADS-B position; signal stale'));
 if(state.follow&&isFresh){
   // Abrupt camera animations on every 30s telemetry refresh can expose empty tiles.
   if(!state.autoZoomed){state.autoZoomed=true;state.map.setView(ll,Math.max(state.map.getZoom(),6),{animate:false});}
   else state.map.panTo(ll,{animate:true,duration:.8});
 }
}

// ---------- visual instruments ----------
const ALT_CEIL=41000,CRUISE=[30000,40000],SPD_MAX=700,VS_MAX=3000,WX_T=[-80,110],WX_W=120;
let altMax=45000;
function buildAltScale(max){
 altMax=max;const sc=byId('altScale');if(!sc)return;sc.innerHTML='';
 for(let v=0;v<=max;v+=5000){const i=document.createElement('i');i.style.bottom=(v/max*100)+'%';if(v%10000===0)i.className='mj';i.textContent=(v/1000)+'K';sc.appendChild(i);}
 byId('altMaxLbl').textContent=fmt(max);
 const c=byId('altCruise');c.style.bottom=(CRUISE[0]/max*100)+'%';c.style.height=((CRUISE[1]-CRUISE[0])/max*100)+'%';
 byId('altCeil').style.bottom=(ALT_CEIL/max*100)+'%';
}
function setAlt(alt){
 const bar=byId('altBar');
 if(!number(alt)){byId('altFill').style.height='0%';bar.classList.remove('on');return;}
 if(alt>altMax)buildAltScale(Math.ceil(alt/5000)*5000+5000);
 const f=Math.max(0,Math.min(1,alt/altMax))*100;
 byId('altFill').style.height=f+'%';byId('altMark').style.bottom=f+'%';bar.classList.add('on');
}
function buildGauge(){
 const g=byId('gaugeTicks');if(!g)return;let h='';
 for(let v=0;v<=SPD_MAX;v+=100){const a=Math.PI*(1-v/SPD_MAX),c=Math.cos(a),s=Math.sin(a);
   h+='<line x1="'+(100+c*90).toFixed(1)+'" y1="'+(104-s*90).toFixed(1)+'" x2="'+(100+c*96).toFixed(1)+'" y2="'+(104-s*96).toFixed(1)+'"/>';
   h+='<text x="'+(100+c*106).toFixed(1)+'" y="'+(107-s*106).toFixed(1)+'">'+v+'</text>';}
 g.innerHTML=h;
}
function setSpeedGauge(mph){byId('gaugeFill').style.strokeDasharray=(number(mph)?Math.max(0,Math.min(1,mph/SPD_MAX))*100:0)+' 100';}
function setVs(v){
 const f=byId('vsFill');if(!number(v)){f.style.width='0%';return;}
 const p=Math.max(-1,Math.min(1,v/VS_MAX))*50;
 f.className='vs-fill'+(v<0?' down':'');
 f.style.width=Math.abs(p)+'%';f.style.left=(p>=0?50:50+p)+'%';
}
function buildSig(){const m=byId('sigMeter');if(!m)return;m.innerHTML='';for(let i=0;i<12;i++)m.appendChild(document.createElement('i'));}
function setSig(seconds,fresh){
 const segs=byId('sigMeter').children;
 if(!number(seconds)){for(const s of segs)s.className='';text('sigAge','--');text('sigHint','No position report');return;}
 const n=Math.max(0,Math.round(12*(1-Math.min(seconds,120)/120)));
 const cls=fresh?(n>=8?'on':n>=4?'on mid':'on low'):'on low';
 for(let i=0;i<segs.length;i++)segs[i].className=i<n?cls:'';
 text('sigAge',seconds<90?Math.round(seconds)+'S':Math.round(seconds/60)+'M');
 text('sigHint',fresh?'Receiving live position reports':'Signal stale - last known position');
}
function vizReset(){resetTargets();text('dockSpeed','--');text('dockSpeedSub',' ');text('dockAlt','--');text('dockVs',' ');setAlt(null);setSpeedGauge(null);setVs(null);setSig(null,false);}
function renderTemp(){
 const m=state.tmpMode,g=state.wxv.G,ar=state.wxv.A,oat=state.oat;
 let val=null,lbl='Air temp',sub='';
 if(m==='a'){
   if(number(oat)){val=oat*9/5+32;sub='Reported by aircraft';}
   else if(ar&&number(ar.temp)){val=ar.temp;sub='Model estimate at altitude';}
   else if(g&&number(g.temp)){val=g.temp;lbl='Ground temp';sub='Altitude model needs 4,500+ ft';}
 }else{lbl='Ground temp';if(g&&number(g.temp)){val=g.temp;sub='Surface model estimate';}}
 text('dockTmpLbl',lbl);text('dockTemp',val!==null?fmt(val):'--');
 const c=val!==null?Math.round((val-32)*5/9)+'°C':'';
 text('dockTempSub',[c,sub].filter(Boolean).join(' · ')||' ');
 $$('#tmpSeg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===state.tmpMode)));
}
function setWx(p,temp,wind,dirFrom){
 state.wxv[p]=number(temp)?{temp:temp,wind:wind}:null;renderTemp();
 const t=byId('wx'+p+'Therm').parentNode,mk=byId('wx'+p+'ThermMk'),wv=byId('wx'+p+'WindBar').parentNode,bar=byId('wx'+p+'WindBar');
 if(number(temp)){t.classList.add('on');mk.style.left=Math.max(0,Math.min(1,(temp-WX_T[0])/(WX_T[1]-WX_T[0])))*100+'%';}else t.classList.remove('on');
 if(!bar.children.length)for(let i=0;i<12;i++)bar.appendChild(document.createElement('i'));
 if(number(wind)){wv.classList.add('on');const n=Math.round(Math.min(1,wind/WX_W)*12);for(let i=0;i<12;i++)bar.children[i].className=i<n?'on':'';
   if(number(dirFrom))byId('wx'+p+'Arrow').style.transform='rotate('+Math.round(dirFrom+180)+'deg)';}
 else{wv.classList.remove('on');for(const c of bar.children)c.className='';}
}
// altitude (orange) + ground speed (blue) over the recorded track
function drawProfile(history){
 const svg=byId('profileSvg'),W=800,H=230,L0=52,Rm=46,T=14,B=30;
 const pts=(Array.isArray(history)?history:[]).filter(p=>Array.isArray(p)&&number(p[2])&&number(p[3])).sort((x,y)=>x[2]-y[2]);
 flightLog(pts);
 if(pts.length<2){svg.innerHTML='';text('profileNote','The profile builds from points recorded while anyone tracks this flight here. It fills in as the flight goes on.');return;}
 const t0=pts[0][2],t1=pts[pts.length-1][2],span=Math.max(1,t1-t0),aMax=Math.max(45000,Math.ceil(Math.max(...pts.map(p=>p[3]))/5000)*5000);
 const X=t=>L0+(t-t0)/span*(W-L0-Rm),YA=v=>T+(1-v/aMax)*(H-T-B),YS=v=>T+(1-v/SPD_MAX)*(H-T-B);
 let g='';
 for(let v=0;v<=aMax;v+=10000)g+='<line x1="'+L0+'" x2="'+(W-Rm)+'" y1="'+YA(v)+'" y2="'+YA(v)+'" stroke="#2a2233" stroke-width="1"/><text x="'+(L0-6)+'" y="'+(YA(v)+4)+'" text-anchor="end">'+(v/1000)+'K</text>';
 for(let v=0;v<=SPD_MAX;v+=200)g+='<text x="'+(W-Rm+6)+'" y="'+(YS(v)+4)+'" fill="#99ccff" style="fill:#99ccff">'+v+'</text>';
 const area='M'+X(pts[0][2])+' '+YA(0)+' '+pts.map(p=>'L'+X(p[2]).toFixed(1)+' '+YA(p[3]).toFixed(1)).join(' ')+' L'+X(t1)+' '+YA(0)+' Z';
 g+='<path d="'+area+'" fill="#ff9900" opacity=".22"/>';
 g+='<polyline fill="none" stroke="#ff9900" stroke-width="3" stroke-linejoin="round" points="'+pts.map(p=>X(p[2]).toFixed(1)+','+YA(p[3]).toFixed(1)).join(' ')+'"/>';
 const sp=pts.filter(p=>number(p[4]));
 if(sp.length>1)g+='<polyline fill="none" stroke="#99ccff" stroke-width="2.5" stroke-linejoin="round" points="'+sp.map(p=>X(p[2]).toFixed(1)+','+YS(p[4]*KT_MPH).toFixed(1)).join(' ')+'"/>';
 const tz=esc(tzAbbr());
 g+='<text x="'+L0+'" y="'+(H-8)+'">'+shortTime(t0)+' '+tz+'</text><text x="'+(W-Rm)+'" y="'+(H-8)+'" text-anchor="end">'+shortTime(t1)+' '+tz+'</text>';
 g+='<circle cx="'+X(t1)+'" cy="'+YA(pts[pts.length-1][3])+'" r="5" fill="#ffcc66" stroke="#000" stroke-width="2"/>';
 svg.innerHTML=g;
 text('profileNote',pts.length+' recorded points, '+Math.round(span/60)+' minutes. Altitude scale left, ground speed scale right. Times in '+tzAbbr()+'.');
}
function tickClocks(){
 const f=tz=>new Intl.DateTimeFormat('en-US',{timeZone:tz,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
 text('clkZ',f('UTC'));text('clkL',f(undefined));text('clkLLbl',tzAbbr().toUpperCase().slice(0,8));
}

// ---------- speed (ground / air), autopilot selections ----------
function windVec(ac){
 if(number(ac.wd)&&number(ac.ws))return{dir:ac.wd,kt:ac.ws,src:'aircraft'};
 const w=state.wxAir;
 if(w&&Date.now()-w.at<20*60*1000&&number(w.dir)&&number(w.mph))return{dir:w.dir,kt:w.mph/KT_MPH,src:'forecast'};
 return null;
}
function airspeed(ac){
 if(number(ac.tas))return{kt:ac.tas,src:'reported by aircraft'};
 const t=number(ac.track)?ac.track:number(ac.true_heading)?ac.true_heading:null,w=windVec(ac);
 if(!number(ac.gs)||t===null||!w)return null;
 const r=Math.PI/180,to=(w.dir+180)*r;
 const ax=ac.gs*Math.sin(t*r)-w.kt*Math.sin(to),ay=ac.gs*Math.cos(t*r)-w.kt*Math.cos(to);
 return{kt:Math.hypot(ax,ay),src:w.src==='aircraft'?'from aircraft-reported wind':'estimated from forecast wind'};
}
function machOf(ac,tasKt){
 if(number(ac.mach))return ac.mach;
 const alt=number(ac.alt_baro)?ac.alt_baro:number(ac.alt_geom)?ac.alt_geom:0,w=state.wxAir;
 let K=null;
 if(w&&number(w.tempF)&&number(w.altFt)&&Math.abs(w.altFt-alt)<6000)K=(w.tempF-32)*5/9+273.15;
 if(K===null)K=alt<36089?288.15-0.0019812*alt:216.65;
 return tasKt/(661.4788*Math.sqrt(K/288.15));
}
function setSpdTitles(){const air=state.spdMode==='tas';text('spdTitle',air?'Air speed (true)':'Ground speed');text('spdTag',air?'TAS':'GS');text('dockSpdLbl','Speed');
 $$('.spd-seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.m===state.spdMode)));}
function renderSpeed(ac){
 const air=state.spdMode==='tas',as=airspeed(ac);
 let mph=null,foot='-- knots',machTxt='';const extra=[];
 if(air){if(as){mph=as.kt*KT_MPH;foot=fmt(as.kt)+' knots true airspeed - '+as.src;}else foot='Air speed needs wind data - waiting';}
 else if(number(ac.gs)){mph=ac.gs*KT_MPH;foot=fmt(ac.gs)+' knots ground speed';}
 if(as&&number(ac.gs)){const d=ac.gs-as.kt;extra.push((d>=0?'TAILWIND ':'HEADWIND ')+fmt(Math.abs(d))+' KT');
   const m=machOf(ac,as.kt);if(number(m)&&m>.3&&m<1.3){extra.push('MACH '+m.toFixed(2));machTxt='MACH '+m.toFixed(2);}}
 if(number(ac.ias))extra.push('IAS '+fmt(ac.ias)+' KT');
 setSpdTitles();setSpeedGauge(mph);text('speed',mph!==null?fmt(mph):'--');text('speedKnots',foot);text('speedExtra',extra.join('   |   '));
 const kt=air?(as?as.kt:null):(number(ac.gs)?ac.gs:null);
 text('dockSpeed',mph!==null?fmt(mph):'--');
 text('dockSpeedSub',[kt!==null?fmt(kt)+' KT':'',machTxt,air&&as&&as.src.indexOf('estimated')>=0?'EST':''].filter(Boolean).join(' · ')||' ');
}
function setAltTarget(v){const t=byId('altTgt');if(!number(v)){t.classList.remove('on');return;}t.style.bottom=Math.max(0,Math.min(1,v/altMax))*100+'%';t.classList.add('on');}
function setHdgBug(h){const b=byId('hdgBug');if(!number(h)){b.classList.remove('on');return;}b.style.transform='rotate('+h+'deg)';b.classList.add('on');}
const NACP={11:'< 3 m',10:'< 10 m',9:'< 30 m',8:'< 93 m',7:'< 185 m',6:'< 556 m',5:'< 926 m',4:'< 1.9 km',3:'< 3.7 km',2:'< 7.4 km',1:'< 18.5 km'};
function resetTargets(){
 for(const id of ['tgtAlt','tgtHdg','tgtQnh','tgtAcc','tgtRssi','tgtMsgs'])text(id,'--');
 for(const id of ['tgtAltHint','tgtHdgHint','tgtQnhIn','tgtAccHint'])text(id,'Not transmitted');
 setAltTarget(null);setHdgBug(null);text('speedExtra','');
}
function setTargets(ac){
 resetTargets();
 const alt=number(ac.alt_baro)?ac.alt_baro:null,sa=ac.nav_altitude_mcp,sh=ac.nav_heading,q=ac.nav_qnh;
 if(number(sa)){text('tgtAlt',fmt(sa)+' ft');const d=alt===null?0:sa-alt;text('tgtAltHint',Math.abs(d)<300?'Level at selection':d>0?'Climbing to selection':'Descending to selection');setAltTarget(sa);}
 if(number(sh)){text('tgtHdg',String(Math.round(sh)).padStart(3,'0')+'°');text('tgtHdgHint',cardinal(sh)+' selected heading');setHdgBug(sh);}
 if(number(q)){text('tgtQnh',q.toFixed(1)+' hPa');text('tgtQnhIn',(q*0.029530).toFixed(2)+' inHg');}
 if(number(ac.nac_p)){text('tgtAcc',NACP[ac.nac_p]||'NACp '+ac.nac_p);text('tgtAccHint','Horizontal position (NACp '+ac.nac_p+')');}
 if(number(ac.rssi))text('tgtRssi',ac.rssi.toFixed(1));
 if(number(ac.messages))text('tgtMsgs',fmt(ac.messages));
}

// ---------- METAR for the route's airports ----------
function metarAirports(){const r=state.route,out=[];if(r&&r.from)out.push([r.from.icao,'Departure',apName(r.from),'var(--pe)',apCode(r.from)]);if(r&&r.to)out.push([r.to.icao,'Arrival',apName(r.to),'var(--blu)',apCode(r.to)]);return out;}
function metarCard(m,role,city,color){
 const fc=['VFR','MVFR','IFR','LIFR'].includes(m.fltCat)?m.fltCat:'NA';
 const wind=m.wdir==='VRB'||number(m.wdir)?(m.wdir==='VRB'?'Variable':String(m.wdir).padStart(3,'0')+'°')+' '+fmt(m.wspd||0)+' kt'+(number(m.wgst)?' G'+fmt(m.wgst):''):'--';
 const layer=(Array.isArray(m.clouds)?m.clouds:[]).find(c=>c&&['BKN','OVC','VV'].includes(c.cover));
 const ceil=layer?layer.cover+' '+fmt(layer.base||0)+' ft':'No ceiling';
 const tc=number(m.temp)?Math.round(m.temp)+'°C / '+Math.round(m.temp*9/5+32)+'°F':'--';
 const dp=number(m.dewp)?Math.round(m.dewp)+'°C':'--';
 const alt=number(m.altim)?(m.altim*0.029530).toFixed(2)+' inHg':'--';
 const age=number(m.obsTime)?Math.max(0,Math.round((Date.now()/1000-m.obsTime)/60)):null;
 return '<article class="cell metar" style="--c:'+color+'"><div class="cell-l"><span><b>'+esc(role)+' / '+esc(m.icaoId)+'</b>'+esc(city)+'</span><em class="fc fc-'+fc+'">'+(fc==='NA'?'N/A':fc)+'</em></div>'+
  '<div class="m-grid"><div><span>Wind</span><b>'+esc(wind)+'</b></div><div><span>Visibility</span><b>'+esc(m.visib!=null?m.visib+' mi':'--')+'</b></div><div><span>Ceiling</span><b>'+esc(ceil)+'</b></div>'+
  '<div><span>Temp</span><b>'+esc(tc)+'</b></div><div><span>Dew point</span><b>'+esc(dp)+'</b></div><div><span>Altimeter</span><b>'+esc(alt)+'</b></div></div>'+
  '<div class="m-grid"><div style="grid-column:1/-1"><span>Present weather</span><b>'+esc(m.wxString||'None reported')+'</b></div></div>'+
  '<div class="m-raw">'+esc(m.rawOb||'')+'</div><div class="m-age">'+(age!==null?'Observed '+age+' min ago':'Observation time unknown')+'</div></article>';
}
function renderMetarTabs(){
 const aps=metarAirports(),seg=byId('metarSeg');
 seg.innerHTML=aps.map((a,i)=>'<button type="button" data-i="'+i+'" aria-pressed="'+(i===0)+'">'+esc(a[1])+' '+esc(a[4])+'</button>').join('');
 seg.hidden=aps.length<2;byId('metarGrid').dataset.show='0';
 if(!aps.length){byId('metarGrid').innerHTML='<article class="cell metar" style="--c:var(--pe)"><div class="cell-l"><span>Airport reports appear once the route is known</span></div></article>';text('metarStatus',' ');}
}
async function loadMetar(){
 const aps=metarAirports();if(!aps.length)return;
 const gen=state.gen,ids=aps.map(x=>x[0]).join(',');
 try{
   const res=await fetch('./api.php?metar='+encodeURIComponent(ids),{cache:'no-store'});
   const d=await res.json();
   if(gen!==state.gen||ids!==metarAirports().map(x=>x[0]).join(','))return;
   if(!d||d.ok!==true||!Array.isArray(d.metar))throw new Error(d&&d.message||'unavailable');
   byId('metarGrid').innerHTML=aps.map(([id,role,city,color])=>{const m=d.metar.find(x=>x&&x.icaoId===id);return m?metarCard(m,role,city,color):'<article class="cell metar" style="--c:'+color+'"><div class="cell-l"><span>No current report for '+esc(id)+'</span></div></article>';}).join('');
   text('metarStatus','Airport reports (METAR) from the NWS Aviation Weather Center'+(d.stale?' - showing older cached data':'')+'. Checked '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.');
 }catch(err){if(gen===state.gen)text('metarStatus','Airport reports unavailable right now ('+err.message+'). Will retry.');}
}

function flightLog(pts){
 const ol=byId('flightLog'),ev=[];
 if(pts.length<2){ol.innerHTML='<li class="flog-empty">Events appear here as the flight is recorded.</li>';return;}
 ev.push([pts[0][2],'First position recorded at '+fmt(pts[0][3])+' ft']);
 let pk=0;pts.forEach((p,i)=>{if(p[3]>pts[pk][3])pk=i;});
 for(const th of [10000,20000,30000]){const i=pts.findIndex(p=>p[3]>=th);if(i>0&&i<=pk)ev.push([pts[i][2],'Climbing through '+fmt(th)+' ft']);}
 if(pts[pk][3]>=20000)ev.push([pts[pk][2],'Peak altitude '+fmt(pts[pk][3])+' ft']);
 const di=pts.findIndex((p,i)=>i>pk&&p[3]<=pts[pk][3]-2000);
 if(pts[pk][3]>=20000&&di>0){ev.push([pts[di][2],'Descent begun at '+fmt(pts[di][3])+' ft']);
   for(const th of [30000,20000,10000]){const j=pts.findIndex((p,i)=>i>=di&&p[3]<=th);if(j>di&&th<pts[pk][3]-2000)ev.push([pts[j][2],'Descending through '+fmt(th)+' ft']);}}
 const last=pts[pts.length-1];ev.push([last[2],'Latest report: '+fmt(last[3])+' ft'+(number(last[4])?', '+fmt(last[4]*KT_MPH)+' mph':'')]);
 ev.sort((x,y)=>x[0]-y[0]);
 ol.innerHTML=ev.map(e=>'<li><time>'+esc(shortTime(e[0]))+'</time><span>'+esc(e[1])+'</span></li>').join('');
}
function clearTrip(){
 for(const id of ['estimatedArrival','todInfo','timeLeft','dockTime'])text(id,'--');
 text('progressPct','--%');text('remaining','-- mi remaining (direct)');text('dockEta',' ');
 byId('progressFill').style.width='0%';byId('dockProg').style.width='0%';
}
function clearTelemetry(clearMap){
 for(const id of ['speed','altitude','heading','vertical','observation','coordinates','squawk','registration','icao'])text(id,'--');
 text('speedKnots','-- knots');text('altitudeHint','Altitude unavailable');text('verticalHint','Vertical rate unavailable');
 text('direction','Heading unavailable');text('lastPosition','Position unavailable');text('aircraftType','Not reported');
 byId('squawk').className='';byId('needle').style.transform='rotate(0deg)';clearTrip();vizReset();
 if(clearMap){drawProfile([]);if(state.plane&&state.map)state.map.removeLayer(state.plane);state.plane=null;if(state.trail)state.trail.setLatLngs([]);state.last=null;state.history=[];state.fresh=false;liteSoon();}
}
function ageLabel(seconds){if(!Number.isFinite(seconds))return 'age unknown';if(seconds<90)return Math.round(seconds)+' sec old';return Math.round(seconds/60)+' min old';}

// ---------- Open-Meteo model weather: surface is 2/10m; pressure levels are estimates, not cockpit measurements ----------
const WX_LEVELS=[{hpa:850,ft:4900},{hpa:700,ft:9850},{hpa:500,ft:18300},{hpa:400,ft:23600},{hpa:300,ft:30100},{hpa:250,ft:34100},{hpa:200,ft:38700}];
function wxLevel(alt){if(!number(alt)||alt<4500)return null;return WX_LEVELS.reduce((a,b)=>Math.abs(b.ft-alt)<Math.abs(a.ft-alt)?b:a);}
function weatherURL(lat,lon){
 const fields=WX_LEVELS.flatMap(x=>['temperature_'+x.hpa+'hPa','wind_speed_'+x.hpa+'hPa','wind_direction_'+x.hpa+'hPa']);
 return 'https://api.open-meteo.com/v1/forecast?latitude='+lat.toFixed(2)+'&longitude='+lon.toFixed(2)+
   '&current=temperature_2m,wind_speed_10m,wind_direction_10m&hourly='+fields.join(',')+
   '&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC&forecast_days=2';
}
function resetWeather(){
 const w=state.weather;if(w.controller)w.controller.abort();w.controller=null;w.request++;w.lastPos=null;w.lastFetch=0;w.lastAlt=null;
 state.wxAir=null;state.oat=null;
 for(const id of ['weatherGroundTemp','weatherGroundWind','weatherGroundDir','weatherAirTemp','weatherAirWind','weatherAirDir'])text(id,'--');
 setWx('G',null,null,null);setWx('A',null,null,null);
 text('weatherAirLevel','Requires a live aircraft position and altitude');
 text('weatherStatus','Weather loads once an aircraft position or route is known.');
 text('weatherWhere','Waiting for an aircraft position');
}
function updateWeather(ac,fresh){
 const valid=fresh&&ac&&number(ac.lat)&&number(ac.lon);
 const r=state.route,base=r&&(r.from||r.to);
 if(!valid&&!base){text('weatherWhere',cfg?'Waiting for an aircraft position':'No flight selected');return;}
 const pos=valid?[ac.lat,ac.lon]:[base.lat,base.lon];
 const alt=valid?(number(ac.alt_baro)?ac.alt_baro:number(ac.alt_geom)?ac.alt_geom:null):null;
 const level=wxLevel(alt),where=valid?'aircraft area':apName(base)+' ('+apCode(base)+')';
 text('weatherWhere',valid?'Near aircraft / '+ac.lat.toFixed(2)+', '+ac.lon.toFixed(2):apName(base)+' ('+apCode(base)+') / aircraft position not live');
 const w=state.weather,now=Date.now();
 const sameArea=w.lastPos&&dist(pos,w.lastPos)<80;
 if(sameArea&&now-w.lastFetch<7*60*1000&&w.lastAlt===(level?level.hpa:null))return;
 w.lastPos=pos;w.lastAlt=level?level.hpa:null;w.lastFetch=now;
 const seq=++w.request;
 if(w.controller)w.controller.abort();
 const ctl=new AbortController();w.controller=ctl;
 const timer=setTimeout(()=>ctl.abort(),11000);
 text('weatherStatus','Updating weather model for '+where+'...');
 fetch(weatherURL(pos[0],pos[1]),{signal:ctl.signal,cache:'no-store'}).then(r2=>{
   if(!r2.ok)throw Error('Weather HTTP '+r2.status);
   return r2.json();
 }).then(data=>{
   if(seq!==w.request)return;
   if(!data||!data.current)throw Error('No surface weather fields returned');
   const g=data.current;
   text('weatherGroundTemp',number(g.temperature_2m)?fmt(g.temperature_2m)+' F':'--');
   text('weatherGroundWind',number(g.wind_speed_10m)?fmt(g.wind_speed_10m)+' mph':'--');
   text('weatherGroundDir',number(g.wind_direction_10m)?cardinal(g.wind_direction_10m)+' FROM':'--');
   setWx('G',g.temperature_2m,g.wind_speed_10m,g.wind_direction_10m);
   if(level&&data.hourly&&Array.isArray(data.hourly.time)){
     const target=Date.now(),times=data.hourly.time;
     const at=times.reduce((best,t,i)=>Math.abs(Date.parse(t+'Z')-target)<Math.abs(Date.parse(times[best]+'Z')-target)?i:best,0);
     const a=data.hourly;
     const temp=a['temperature_'+level.hpa+'hPa']?.[at],wind=a['wind_speed_'+level.hpa+'hPa']?.[at],dir=a['wind_direction_'+level.hpa+'hPa']?.[at];
     text('weatherAirTemp',number(temp)?fmt(temp)+' F':'--');
     text('weatherAirWind',number(wind)?fmt(wind)+' mph':'--');
     text('weatherAirDir',number(dir)?cardinal(dir)+' FROM':'--');
     setWx('A',temp,wind,dir);state.wxAir={at:Date.now(),dir:dir,mph:wind,tempF:temp,altFt:level.ft};if(state.last&&state.fresh)renderSpeed(state.last);
     text('weatherAirLevel','Approx. '+fmt(level.ft)+' ft pressure level ('+level.hpa+' hPa); aircraft '+fmt(alt)+' ft');
   }else{
     text('weatherAirTemp','--');text('weatherAirWind','--');text('weatherAirDir','--');setWx('A',null,null,null);state.wxAir=null;
     text('weatherAirLevel',valid?'Aircraft below 4,500 ft / no upper-air model shown':'Requires live aircraft position and altitude');
   }
   text('weatherStatus','Model updated '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' / '+(valid?'near the aircraft':'near '+apCode(base))+'.');
 }).catch(err=>{
   if(seq!==w.request)return;
   text('weatherStatus','Weather model unavailable on this connection ('+(err.name==='AbortError'?'timed out':'network error')+'). Aircraft tracking is unaffected.');
 }).finally(()=>{clearTimeout(timer);if(seq===w.request)w.controller=null;});
}

// ---------- route: automatic lookup + manual override ----------
function routeKey(){return cfg?cfg.mode+':'+cfg.id:'';}
function savedManual(){const all=store('routes')||{};const m=all[routeKey()];return m&&typeof m==='object'?m:null;}
function saveManual(from,to){const all=store('routes')||{};if(from||to)all[routeKey()]={from:from||'',to:to||'',at:Date.now()};else delete all[routeKey()];
 const keys=Object.keys(all).sort((a,b)=>(all[b].at||0)-(all[a].at||0));for(const k of keys.slice(40))delete all[k];store('routes',all);}
function setRoute(route){
 state.route=route&&(route.from||route.to)?route:null;
 const r=state.route;
 text('rhFrom',r&&r.from?apCode(r.from):'---');text('rhFromN',r&&r.from?apName(r.from):'Origin unknown');
 text('rhTo',r&&r.to?apCode(r.to):'---');text('rhToN',r&&r.to?apName(r.to):'Destination unknown');
 byId('rhFromN').title=r&&r.from?(r.from.name||''):'';byId('rhToN').title=r&&r.to?(r.to.name||''):'';
 let src='Route unknown - set it below if you know it.';
 if(r)src=r.source==='manual'?'Route set by you on this device':'Route from the '+(r.source||'adsb.lol route database')+(r.stops&&r.stops.length>2?' (multi-stop: '+r.stops.join(' - ')+')':'')+'. Community data - can be wrong.';
 if(r&&r.plausible===false)src='Route from the database does not match where the aircraft is ('+fmt((r.off_route_km||0)/1.609)+' mi off). It may be wrong - set it below.';
 text('routeSrc',src);byId('routeSrc').classList.toggle('warn',!!(r&&r.plausible===false));
 text('pcFrom',r&&r.from?apName(r.from)+' ':'Origin ');text('pcTo',r&&r.to?apName(r.to)+' ':'Destination ');
 if(r&&r.from)byId('pcFrom').insertAdjacentHTML('beforeend','<small>'+esc(apCode(r.from))+'</small>');
 if(r&&r.to)byId('pcTo').insertAdjacentHTML('beforeend','<small>'+esc(apCode(r.to))+'</small>');
 byId('mapScale').hidden=!(r&&r.from&&r.to);text('scFrom',r&&r.from?apCode(r.from):'---');text('scTo',r&&r.to?apCode(r.to):'---');
 byId('rClear').hidden=!(r&&r.source==='manual');
 text('directDistance',r&&r.from&&r.to?fmt(dist([r.from.lat,r.from.lon],[r.to.lat,r.to.lon]))+' mi':'--');
 const key=metarAirports().map(x=>x[0]).join(',');
 if(key!==state.metarKey){state.metarKey=key;renderMetarTabs();loadMetar();}
 drawRouteOnMap();liteSoon();updateHeader();
 if(state.lastData)render(state.lastData,true);else updateWeather(null,false);
 if(state.mapMode==='street'&&state.map&&(!state.last||!state.follow||!state.fresh))fitRoute();
}
const AP_DOWN='Airport lookup is temporarily unavailable - try again in a moment.';
async function fetchAirports(codes){
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),20000);
 try{
   const res=await fetch('./api.php?airport='+encodeURIComponent(codes.join(',')),{cache:'no-store',signal:ctl.signal});
   let d=null;try{d=await res.json();}catch(e){}
   if(!d||d.ok!==true){const e=new Error(d&&d.message||AP_DOWN);e.down=!d||res.status>=500;throw e;}
   d.airports=Array.isArray(d.airports)?d.airports:[];d.missing=Array.isArray(d.missing)?d.missing:[];d.unavailable=Array.isArray(d.unavailable)?d.unavailable:[];
   return d;
 }catch(err){if(err.name==='AbortError'||err instanceof TypeError){const e=new Error(AP_DOWN);e.down=true;throw e;}throw err;}
 finally{clearTimeout(timer);}
}
async function applyManual(from,to,{save=true}={}){
 const gen=state.gen;from=(from||'').toUpperCase().trim();to=(to||'').toUpperCase().trim();
 const ok=c=>!c||/^([A-Z]{3}|[A-Z][A-Z0-9]{3})$/.test(c);
 if(!ok(from)||!ok(to)){text('routeHint','Use 3-letter IATA (SLC) or 4-character ICAO (KSLC) airport codes.');return;}
 if(!from&&!to){clearManual();return;}
 text('routeHint','Looking up '+[from,to].filter(Boolean).join(' and ')+'...');
 try{
   const d=await fetchAirports([from,to].filter(Boolean));
   if(gen!==state.gen)return;
   const find=c=>c?d.airports.find(a=>a.query===c)||null:null;
   const f=find(from),t=find(to);
   if(d.unavailable.length){text('routeHint',AP_DOWN.replace(' - ',' for '+d.unavailable.join(', ')+' - '));return;}
   if(d.missing.length){text('routeHint','Unknown airport: '+d.missing.join(', ')+'. Check the code (ICAO like EGLL, or IATA like LHR).');if(!f&&!t)return;}
   else text('routeHint','Route set. Saved for this flight on this device and added to the link.');
   state.manual={from:from,to:to};if(save)saveManual(from,to);
   byId('rFrom').value=f?f.icao:from;byId('rTo').value=t?t.icao:to;
   setRoute({from:f,to:t,source:'manual'});updateUrl();
 }catch(err){if(gen===state.gen)text('routeHint',err.down?AP_DOWN:'Airport lookup failed: '+err.message);}
}
function clearManual(){
 state.manual=null;saveManual('','');byId('rFrom').value='';byId('rTo').value='';
 text('routeHint','Automatic route lookup restored.');state.routeTried='';setRoute(null);updateUrl();
 if(state.lastData)render(state.lastData,true);
}
const AIRLINE_CS=/^[A-Z]{3}[0-9][0-9A-Z]{0,4}$/;
async function lookupRoute(callsign,lat,lon){
 if(state.manual||!AIRLINE_CS.test(callsign)||state.routeTried===callsign)return;
 state.routeTried=callsign;const gen=state.gen;
 if(state.routeCtl)state.routeCtl.abort();const ctl=new AbortController();state.routeCtl=ctl;
 try{
   const res=await fetch('./api.php?route='+encodeURIComponent(callsign)+'&lat='+lat.toFixed(2)+'&lon='+lon.toFixed(2),{cache:'no-store',signal:ctl.signal});
   const d=await res.json();
   if(gen!==state.gen||state.manual||state.routeTried!==callsign)return;
   if(d&&d.ok===true&&d.route&&d.route.from&&d.route.to&&d.route.plausible===false){
     // the database route does not match where the aircraft is: do not use it for the map or estimates
     setRoute(null);byId('routeSrc').classList.add('warn');
     text('routeSrc','The route database lists '+apCode(d.route.from)+' → '+apCode(d.route.to)+' for '+callsign+', but the aircraft is '+fmt((d.route.off_route_km||0)/1.609)+' mi away from that route, so it is not used. Set the route below if you know it.');
   }else if(d&&d.ok===true&&d.route&&d.route.from&&d.route.to)setRoute(d.route);
   else{setRoute(null);text('routeSrc','No route found for '+callsign+' in the public route database. Set it below if you know it.');}
 }catch(err){if(gen===state.gen&&err.name!=='AbortError'){state.routeTried='';text('routeSrc','Route lookup failed - will retry.');}}
}

// ---------- rendering of one API answer ----------
function showMapMsg(title,msg){const m=byId('mapMsg');if(!title){m.hidden=true;return;}text('mapMsgTitle',title);text('mapMsgText',msg);m.hidden=false;}
function renderEmpty(msg,status){
 clearTelemetry(true);updateWeather(null,false);setStatus(status,msg);
 const id=cfg?cfg.id:'';
 setNotice(status==='error'?'The free tracking feed is temporarily unavailable. Climbout will retry automatically.':'No position for '+id+' right now. This is normal before pushback, after landing, on some taxiways and where no volunteer receiver is in range.',status);
 text('flightPhase',status==='error'?'SOURCE UNAVAILABLE':'NO SIGNAL');
 showMapMsg(status==='error'?'Flight feed unavailable':'No signal from '+id+' right now',
   status==='error'?'The free ADS-B feed did not answer. Climbout keeps retrying every 30 seconds.':'The flight may not have departed yet, may have landed, or may be out of receiver range. Check the flight number, or pick another flight.'+(cfg&&cfg.from&&cfg.from!==cfg.id?' Some airlines fly under a radio callsign that differs from the flight number (like RYR4KM): then search the tail number or pick it from Flights nearby.':''));
 if(!state.route)showTripUnknown(true);
}
function showTripUnknown(on){byId('routeUnknown').hidden=!on;byId('progressPanel').classList.toggle('no-route',on);}
function render(data,again){
 const ac=data&&data.aircraft||null,serverNow=number(data.server_time)?data.server_time:Date.now()/1000;
 state.lastData=data;
 if(data&&data.status==='error'&&!ac){renderEmpty('Feed temporarily unavailable','error');return;}
 if(!ac){renderEmpty('No signal right now','waiting');return;}
 showMapMsg(null);
 const hasPos=number(ac.lat)&&number(ac.lon)&&Math.abs(ac.lat)<=90&&Math.abs(ac.lon)<=180;
 const observed=number(ac.observed_at)&&ac.observed_at>1500000000&&ac.observed_at<=serverNow+120?ac.observed_at:null;
 const seconds=observed!==null?Math.max(0,Math.round(serverNow-observed)):Infinity;
 const fresh=hasPos&&seconds<=90&&data.status==='live';
 const r=state.route;
 // a different airframe or a new callsign on the same tail: forget the old route
 const cs=(ac.flight||'').toUpperCase();
 if(!state.manual&&cs&&state.routeTried&&cs!==state.routeTried&&!again){state.routeTried='';if(state.route){setRoute(null);return render(data,true);}}
 if(hasPos&&!state.manual&&cs)lookupRoute(cs,ac.lat,ac.lon);
 updateWeather(ac,fresh);
 setSig(hasPos?seconds:null,fresh);
 state.oat=fresh&&number(ac.oat)?ac.oat:null;renderTemp();
 const status=fresh?'live':hasPos?'stale':'waiting';
 setStatus(status,fresh?'Aircraft signal live':hasPos?'LAST KNOWN - '+ageLabel(seconds):'Transponder found; awaiting position');
 setNotice(fresh?'Live ADS-B receiver data. The airport-to-airport line is only a map reference, not the filed flight path.':hasPos?'Signal not live. Aircraft position is '+ageLabel(seconds)+'. Displayed location is last known, not current.':'The transponder has no usable position. Other data could be delayed.',fresh?'live':hasPos?'error':'waiting');
 text('callsign',ac.flight||(cfg&&cfg.id)||'--');
 text('registration',ac.r||'Not reported');text('icao',ac.hex?ac.hex.toUpperCase():'--');
 {const SQ={'7500':'HIJACK','7600':'RADIO FAILURE','7700':'EMERGENCY'},sq=String(ac.squawk||''),el=byId('squawk'),em=String(ac.emergency||'none');
  if(SQ[sq]){text('squawk',sq+' - '+SQ[sq]);el.className='alert';}else if(em!=='none'){text('squawk',(sq||'--')+' - '+em.toUpperCase());el.className='alert';}else{text('squawk',sq||'--');el.className='';}}
 text('aircraftType',typeName(ac.t)||'Not reported');
 text('fType',ac.t?(TYPES[ac.t]||ac.t):'--');text('fTail',[ac.r,ac.hex?ac.hex.toUpperCase():''].filter(Boolean).join(' / ')||'--');
 updateHeader(ac);
 text('observation',observed!==null?dateStr(observed):'--');
 text('lastPosition',hasPos?ageLabel(seconds):'Position unavailable');
 text('coordinates',hasPos?ac.lat.toFixed(4)+', '+ac.lon.toFixed(4)+(fresh?'':' (last known)'):'Not available');
 // Do not present delayed values as live instruments.
 if(fresh){
   setTargets(ac);renderSpeed(ac);
   const alt=number(ac.alt_baro)?ac.alt_baro:number(ac.alt_geom)?ac.alt_geom:null;
   setAlt(alt!==null?alt:ac.alt_baro==='ground'?0:null);text('dockAlt',alt!==null?fmt(alt):ac.alt_baro==='ground'?'0':'--');
   if(alt!==null){text('altitude',fmt(alt));text('altitudeHint',number(ac.alt_baro)?'Barometric altitude':'Geometric altitude');}
   else{text('altitude',ac.alt_baro==='ground'?'0':'--');text('altitudeHint',ac.alt_baro==='ground'?'On ground':'Altitude unavailable');}
   const heading=number(ac.track)?ac.track:number(ac.true_heading)?ac.true_heading:null;
   if(heading!==null){text('heading',String(Math.round(heading)).padStart(3,'0'));text('direction',cardinal(heading)+' / compass bearing');byId('needle').style.transform='rotate('+heading+'deg)';}
   else{text('heading','--');text('direction','Heading unavailable');}
   const vertical=number(ac.baro_rate)?ac.baro_rate:number(ac.geom_rate)?ac.geom_rate:null;
   setVs(vertical);text('dockVs',vertical===null?' ':(vertical>100?'▲ ':vertical<-100?'▼ ':'▬ ')+fmt(Math.abs(vertical))+' FT/MIN');
   if(vertical!==null){text('vertical',(vertical>0?'+':'')+fmt(vertical));text('verticalHint',vertical>100?'Climbing':vertical< -100?'Descending':'Level / near level');}
   else{text('vertical','--');text('verticalHint','Vertical rate unavailable');}
 }else{
   for(const id of ['speed','altitude','heading','vertical'])text(id,'--');
   text('speedKnots','Signal stale');text('altitudeHint','Signal stale');text('direction','Signal stale');
   text('verticalHint','Signal stale');byId('needle').style.transform='rotate(0deg)';vizReset();setSig(hasPos?seconds:null,false);
 }
 if(state.last&&ac.hex&&state.last.hex&&ac.hex!==state.last.hex){
   // Aircraft swapping on the same callsign must not connect two aircraft trails.
   if(state.trail)state.trail.setLatLngs([]);
   if(state.plane&&state.map){state.map.removeLayer(state.plane);state.plane=null;}
 }
 state.last=ac;
 state.history=Array.isArray(data.history)?data.history:[];
 if(hasPos){
   text('flightPhase',fresh?(ac.alt_baro==='ground'?'ON GROUND':'AIRCRAFT TRACKED'):'LAST KNOWN POSITION');
   renderTrip(ac,fresh,serverNow);
   drawProfile(state.history);
   updateMap(ac,state.history,fresh);
 }else{
   text('flightPhase','AIRCRAFT DETECTED');clearTrip();showTripUnknown(!r||!r.to);
   if(state.plane&&state.map){state.map.removeLayer(state.plane);state.plane=null;}
   drawProfile(state.history);liteSoon();
 }
}
function renderTrip(ac,fresh,serverNow){
 const r=state.route,to=r&&r.to,from=r&&r.from;
 showTripUnknown(!to);
 if(!to){clearTrip();text('dockTime','--');text('dockEta','ROUTE UNKNOWN - ADD DESTINATION');return;}
 const current=[ac.lat,ac.lon],dest=[to.lat,to.lon],remaining=dist(current,dest);
 let pct=null;
 if(from){
   // Project distances onto the origin-destination line: do not treat all detours as forward progress.
   const total=dist([from.lat,from.lon],dest),fromStart=dist([from.lat,from.lon],current);
   pct=total>0?Math.round(100*Math.max(0,Math.min(1,(fromStart*fromStart+total*total-remaining*remaining)/(2*total*total)))):null;
 }
 text('progressPct',pct!==null?pct+'%':'--%');text('remaining',fmt(remaining)+' mi remaining (direct)');
 byId('progressFill').style.width=(pct||0)+'%';byId('dockProg').style.width=(pct||0)+'%';
 if(fresh&&number(ac.gs)&&ac.gs>250&&remaining>20){
   const eta=serverNow+remaining/(ac.gs*KT_MPH)*3600,m=Math.round((eta-serverNow)/60);
   text('estimatedArrival',timeStr(eta)+' ('+Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m)');
 }else text('estimatedArrival','--');
 {const alt2=number(ac.alt_baro)?ac.alt_baro:number(ac.alt_geom)?ac.alt_geom:null,vr=number(ac.baro_rate)?ac.baro_rate:0;let t='--';
  if(fresh&&alt2!==null&&number(ac.gs)&&ac.gs>200){
    if(vr<=-900)t='Descent underway';
    else if(alt2>18000){const tod=alt2/1000*3*1.15078;
      if(remaining>tod){const m=Math.round((remaining-tod)/(ac.gs*KT_MPH)*60);t=fmt(remaining-tod)+' mi ('+hm(m)+')';}else t='In descent zone';}
  }
  text('todInfo',t);}
 let tl='--',e2=' ';
 if(fresh&&number(ac.gs)&&ac.gs>120){
   if(remaining<=3)tl='Arriving';
   else{
     const alt3=number(ac.alt_baro)?ac.alt_baro:number(ac.alt_geom)?ac.alt_geom:0;
     // still climbing on a long trip: assume it reaches typical cruise speed
     const effKt=(alt3<28000&&remaining>150)?Math.max(ac.gs,430):ac.gs;
     const mins=Math.max(1,Math.round(remaining/(effKt*KT_MPH)*60));
     tl=hm(mins);e2='ETA '+timeStr(serverNow+mins*60)+' · '+apCode(to);
   }
 }else if(!fresh)e2='SIGNAL NOT LIVE';
 text('timeLeft',tl);text('dockTime',tl);text('dockEta',e2);
}

// ---------- header, title, URL ----------
function airlineOf(cs){const m=/^([A-Z]{3})[0-9]/.exec(cs||'');return m&&ICAO_AIRLINE[m[1]]||'';}
function updateHeader(ac){
 const r=state.route,rt=r&&(r.from||r.to)?apCode(r.from)+' → '+apCode(r.to):'';
 if(!cfg){text('chipId','Pick a flight');text('chipRoute','');document.title='Climbout | Live Flight Tracker';return;}
 const cs=(ac&&ac.flight)||(cfg.mode==='callsign'?cfg.id:'');
 text('chipId',cfg.label||cfg.id);text('chipRoute',rt);
 document.title=(cfg.label||cfg.id)+(rt?' · '+rt:'')+' | Climbout';
 const airline=airlineOf(cs),day=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date()).toUpperCase();
 text('fEyebrow',(airline?airline.toUpperCase():cfg.mode==='callsign'?'CALLSIGN':MODE_LABEL[cfg.mode].toUpperCase())+' • '+day);
 const lab=cfg.label||cfg.id,mm=/^([A-Z]+)(.*)$/.exec(lab);
 byId('fTitle').innerHTML=(mm&&mm[2]?esc(mm[1])+'<span class="title-number">'+esc(mm[2])+'</span>':esc(lab))+'<span class="title-slash">/</span> <span class="title-suffix">Live track</span>';
 let ctx='Tracking '+cfg.id+(cfg.from&&cfg.from!==cfg.id?' (from '+cfg.from+')':' ('+MODE_LABEL[cfg.mode]+')');
 if(ac&&ac.flight&&cfg.mode!=='callsign')ctx+=' · now flying as '+ac.flight;
 text('fContext',ctx);
}
function updateUrl(){
 const u=new URL(location.href),p=new URLSearchParams();
 if(cfg){p.set('id',cfg.id);p.set('mode',cfg.mode);if(state.manual){if(state.manual.from)p.set('from',state.manual.from);if(state.manual.to)p.set('to',state.manual.to);}}
 const qs=p.toString();
 try{history.replaceState(history.state,'',u.pathname+(qs?'?'+qs:''));}catch(_){}
}

// ---------- recent flights ----------
function recents(){const r=store('recent');return Array.isArray(r)?r.filter(x=>x&&typeof x.id==='string'&&MODE_LABEL[x.mode]).slice(0,8):[];}
function remember(sel){const list=recents().filter(x=>!(x.id===sel.id&&x.mode===sel.mode));list.unshift({id:sel.id,mode:sel.mode,label:sel.label||sel.id,from:sel.from||'',at:Date.now()});store('recent',list.slice(0,8));store('last',{id:sel.id,mode:sel.mode,label:sel.label||sel.id,from:sel.from||'',at:Date.now()});renderRecents();}
function renderRecents(){
 const list=recents();
 $$('[data-recent]').forEach(box=>{box.hidden=!list.length;
   box.querySelector('[data-chips]').innerHTML=list.map((x,i)=>'<button type="button" class="chip'+(cfg&&cfg.id===x.id&&cfg.mode===x.mode?' on':'')+'" data-i="'+i+'" title="'+esc(MODE_LABEL[x.mode]+' '+x.id)+'">'+esc(x.label||x.id)+'</button>').join('')+'<button type="button" class="chip clear" data-clear>Clear</button>';});
}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-recent] .chip');if(!c)return;
 if(c.hasAttribute('data-clear')){store('recent',[]);store('last',null);renderRecents();return;}
 const x=recents()[+c.dataset.i];if(x)select({id:x.id,mode:x.mode,label:x.label,from:x.from});
});

// ---------- select a flight: full reset, then start polling ----------
function select(sel,opts){
 opts=opts||{};
 state.gen++;state.requestSeq++;
 if(state.controller)state.controller.abort();
 if(state.routeCtl)state.routeCtl.abort();
 state.controller=null;state.routeCtl=null;state.requesting=false;byId('refreshBtn').disabled=false;
 cfg={id:sel.id,mode:sel.mode,label:sel.label||sel.id,from:sel.from||''};
 state.follow=true;byId('follow').checked=true;state.autoZoomed=false;state.lastData=null;state.routeTried='';state.manual=null;state.metarKey='';
 clearTelemetry(true);resetWeather();showMapMsg(null);
 text('callsign',cfg.mode==='callsign'?cfg.id:'--');text('fType','--');text('fTail','--');text('flightPhase','SEARCHING');
 byId('rFrom').value='';byId('rTo').value='';text('routeHint','ICAO (KSLC) or IATA (SLC) codes. Saved for this flight on this device and added to the link.');
 setRoute(null);
 byId('stage').classList.remove('idle');
 const man=opts.manual||savedManual();
 if(man&&(man.from||man.to)){byId('rFrom').value=man.from||'';byId('rTo').value=man.to||'';state.manual={from:man.from||'',to:man.to||''};applyManual(man.from,man.to,{save:!!opts.manual});}
 updateUrl();updateHeader();remember(cfg);closeFinder(true);
 $$('form[data-search] input[name=q]').forEach(i=>{i.value='';i.dispatchEvent(new Event('input'));});
 setStatus('waiting','Searching for '+cfg.id);setNotice('Looking for '+cfg.id+' on the live ADS-B network...','waiting');
 if(state.mapMode==='street')fitRoute();
 refresh();
}
async function refresh(){
 if(!cfg||state.requesting)return;
 state.requesting=true;
 const seq=++state.requestSeq,gen=state.gen;
 const controller=new AbortController();state.controller=controller;
 byId('refreshBtn').disabled=true;
 let timeout=null;
 try{
   timeout=setTimeout(()=>controller.abort(),15000);
   const res=await fetch('./api.php?mode='+encodeURIComponent(cfg.mode)+'&id='+encodeURIComponent(cfg.id),{cache:'no-store',signal:controller.signal});
   const raw=await res.text();
   let data;try{data=JSON.parse(raw);}catch(_){throw new Error('Server returned HTML instead of JSON. Check that PHP runs api.php.');}
   if(seq!==state.requestSeq||gen!==state.gen)return;
   if(!res.ok||!data||data.ok!==true)throw new Error(data&&data.message||'Gateway HTTP '+res.status);
   render(data);
 }catch(error){
   if(seq!==state.requestSeq||gen!==state.gen)return;
   if(error&&error.name!=='AbortError')console.warn('Climbout: flight update failed -',error);
   if(state.last){
     render({aircraft:state.last,history:state.history,status:'stale',server_time:Date.now()/1000});
     setStatus('error','Feed unavailable - LAST KNOWN');
     setNotice('Feed connection failed: '+(error.name==='AbortError'?'request timed out':error.message)+'. Displayed aircraft position is last known. Retrying automatically.','error');
   }else{
     renderEmpty('Aircraft feed unavailable','error');
     setNotice('The aircraft feed failed: '+(error.name==='AbortError'?'request timed out':error.message)+'. Retrying automatically.','error');
   }
 }finally{
   if(timeout!==null)clearTimeout(timeout);
   if(seq===state.requestSeq){state.controller=null;state.requesting=false;byId('refreshBtn').disabled=false;}
 }
}

// ---------- search forms ----------
$$('form[data-search]').forEach(form=>{
 const input=form.querySelector('input[name=q]'),mode=form.querySelector('select[name=mode]'),hint=form.querySelector('[data-hint]'),hint0=hint.textContent;
 const preview=()=>{const v=input.value.trim();if(!v){hint.textContent=hint0;hint.classList.remove('err');return;}
   const p=parseQuery(v,mode.value);hint.classList.toggle('err',!!p.error);
   hint.textContent=p.error?p.error:p.note?p.note:'Will track '+p.id+' ('+MODE_LABEL[p.mode]+(p.from&&p.from!==p.id?', from '+p.from:'')+')';};
 input.addEventListener('input',preview);mode.addEventListener('change',preview);
 form.addEventListener('submit',e=>{e.preventDefault();const p=parseQuery(input.value,mode.value);
   if(p.error){hint.textContent=p.error;hint.classList.add('err');input.focus();return;}
   select(p);if(byId('dr-flight').classList.contains('open'))byId('dr-flight').querySelector('.dr-b').scrollTop=0;});
});

// ---------- flight finder (empty state / change flight) + browse nearby ----------
function openFinder(focus){
 const f=byId('finder');f.hidden=false;f.classList.toggle('closable',!!cfg);
 text('finderTitle',cfg?'Track another flight':'Pick a flight to track');byId('finderX').hidden=!cfg;
 if(byId('stage').classList.contains('has-drawer'))openDrawer(null);
 if(!browse.loaded)browseStart();
 if(focus==='browse')setTimeout(()=>byId('browseHead').scrollIntoView({block:'start',behavior:'smooth'}),60);
 else if(!document.documentElement.classList.contains('touch'))setTimeout(()=>byId('findQ').focus({preventScroll:true}),60);
}
function closeFinder(force){if(!cfg&&!force)return;byId('finder').hidden=true;}
byId('finderX').addEventListener('click',()=>closeFinder());
byId('flightChip').addEventListener('click',()=>{if(!byId('finder').hidden&&cfg)closeFinder();else openFinder();});
document.addEventListener('click',e=>{const b=e.target.closest('[data-open-finder]');if(b)openFinder(b.dataset.openFinder);});

const HUBS=[['America/New_York','KJFK'],['America/Detroit','KDTW'],['America/Chicago','KORD'],['America/Denver','KDEN'],['America/Phoenix','KPHX'],['America/Los_Angeles','KLAX'],
 ['America/Anchorage','PANC'],['Pacific/Honolulu','PHNL'],['America/Toronto','CYYZ'],['America/Vancouver','CYVR'],['America/Mexico_City','MMMX'],['America/Sao_Paulo','SBGR'],
 ['Europe/London','EGLL'],['Europe/Dublin','EIDW'],['Europe/Paris','LFPG'],['Europe/Berlin','EDDF'],['Europe/Amsterdam','EHAM'],['Europe/Madrid','LEMD'],['Europe/Rome','LIRF'],
 ['Europe/Istanbul','LTFM'],['Asia/Dubai','OMDB'],['Asia/Kolkata','VIDP'],['Asia/Singapore','WSSS'],['Asia/Hong_Kong','VHHH'],['Asia/Shanghai','ZSPD'],['Asia/Tokyo','RJTT'],
 ['Asia/Seoul','RKSI'],['Australia/Sydney','YSSY'],['Australia/Melbourne','YMML'],['Pacific/Auckland','NZAA'],['Africa/Johannesburg','FAOR']];
function defaultHub(){let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(_){}
 const hit=HUBS.find(h=>h[0]===tz);if(hit)return hit[1];
 const pre={America:'KATL',Europe:'EGLL',Asia:'OMDB',Australia:'YSSY',Africa:'FAOR',Pacific:'NZAA'}[tz.split('/')[0]];return pre||'KATL';}
const browse={loaded:false,center:null,label:'',r:100,seq:0,list:[],timer:0};
{const s=store('near');if(s&&number(s.lat)&&number(s.lon)){browse.center=[s.lat,s.lon];browse.label=String(s.label||'').slice(0,40);}
 const r=store('radius');if([50,100,200].includes(r))browse.r=r;}
function setRadiusButtons(){$$('#radSeg button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.r===browse.r)));}
setRadiusButtons();
byId('radSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;browse.r=+b.dataset.r;store('radius',browse.r);setRadiusButtons();browseLoad();});
byId('airOnly').addEventListener('change',renderBrowse);
async function browseAirport(code){
 code=String(code||'').toUpperCase().trim();
 if(!/^([A-Z]{3}|[A-Z][A-Z0-9]{3})$/.test(code)){text('browseStatus','Type a 3-letter IATA (ATL) or 4-character ICAO (KATL) airport code.');return;}
 text('browseStatus','Finding '+code+'...');
 try{const d=await fetchAirports([code]);const a=d.airports[0];
   if(!a){text('browseStatus',d.unavailable.length?AP_DOWN:'Unknown airport '+code+'.');return;}
   browse.center=[a.lat,a.lon];browse.label=apCode(a)+' '+apName(a);store('near',{lat:a.lat,lon:a.lon,label:browse.label});byId('browseAp').value='';browseLoad();
 }catch(err){text('browseStatus',err.down?AP_DOWN:'Airport lookup failed: '+err.message);}
}
function browseStart(){browse.loaded=true;if(browse.center)browseLoad();else browseAirport(defaultHub());}
byId('browseApForm').addEventListener('submit',e=>{e.preventDefault();browseAirport(byId('browseAp').value);});
byId('geoBtn').addEventListener('click',()=>{
 if(!('geolocation' in navigator)){text('browseStatus','Location is not available in this browser. Type an airport code instead.');return;}
 text('browseStatus','Asking your browser for your location...');
 navigator.geolocation.getCurrentPosition(p=>{
   // rounded to 0.1 degree (about 6 km) before it is used or sent anywhere
   browse.center=[Math.round(p.coords.latitude*10)/10,Math.round(p.coords.longitude*10)/10];browse.label='your location';browseLoad();
 },err=>{text('browseStatus',err.code===1?'Location permission was declined - that is fine. Type an airport code instead.':'Could not get your location. Type an airport code instead.');},{enableHighAccuracy:false,timeout:12000,maximumAge:600000});
});
async function browseLoad(){
 if(!browse.center)return;
 const seq=++browse.seq,[la,lo]=browse.center;
 text('browseStatus','Loading flights within '+browse.r+' NM of '+(browse.label||la.toFixed(1)+', '+lo.toFixed(1))+'...');
 try{
   const res=await fetch('./api.php?near='+la.toFixed(1)+','+lo.toFixed(1)+'&r='+browse.r,{cache:'no-store'});
   const d=await res.json();if(seq!==browse.seq)return;
   if(!d||d.ok!==true||!Array.isArray(d.flights))throw new Error(d&&d.message||'unavailable');
   browse.list=d.flights;browse.at=d.fetched_at;renderBrowse();
 }catch(err){if(seq===browse.seq){browse.list=[];renderBrowse();text('browseStatus','Could not load nearby flights ('+err.message+'). Try again in a moment.');}}
}
function renderBrowse(){
 const only=byId('airOnly').checked,rows=browse.list.filter(f=>!only||f.airline);
 const where=browse.label||'this point';
 text('browseStatus',browse.list.length?rows.length+' flight'+(rows.length===1?'':'s')+' in the air within '+browse.r+' NM of '+where+(only&&rows.length<browse.list.length?' ('+(browse.list.length-rows.length)+' other aircraft hidden)':'')+'. Tap one to track it.':'No airborne flights with a callsign within '+browse.r+' NM of '+where+' right now.');
 byId('browseList').innerHTML=rows.slice(0,120).map((f,i)=>{const al=airlineOf(f.callsign);
   return '<li><button type="button" data-cs="'+esc(f.callsign)+'" data-hex="'+esc(f.hex||'')+'"><b>'+esc(f.callsign)+'</b><span class="bl-sub">'+esc([al,typeName(f.type)||'',f.reg||''].filter(Boolean).join(' · ')||'Aircraft')+'</span>'+
     '<span class="bl-n"><i>'+(number(f.alt)?fmt(f.alt):'--')+'</i> FT</span><span class="bl-n"><i>'+(number(f.gs)?fmt(f.gs):'--')+'</i> KT</span><span class="bl-n"><i>'+fmt(f.dist)+'</i> NM</span></button></li>';}).join('');
}
byId('browseList').addEventListener('click',e=>{const b=e.target.closest('button[data-cs]');if(!b)return;const cs=b.dataset.cs;
 // airline callsigns are shareable and route-aware; anything else is safest tracked by its unique hex code
 if(AIRLINE_CS.test(cs)||!b.dataset.hex)select({id:cs,mode:'callsign',label:cs});else select({id:b.dataset.hex.toUpperCase(),mode:'hex',label:cs});});
setInterval(()=>{if(!document.hidden&&!byId('finder').hidden&&browse.center)browseLoad();},45000);

// ---------- manual route form ----------
byId('routeForm').addEventListener('submit',e=>{e.preventDefault();if(!cfg){text('routeHint','Pick a flight first.');return;}applyManual(byId('rFrom').value,byId('rTo').value);});
byId('rClear').addEventListener('click',clearManual);

// ---------- map buttons, toggles ----------
byId('refreshBtn').addEventListener('click',refresh);
byId('streetMode').addEventListener('click',()=>setMapMode('street'));
byId('liteMode').addEventListener('click',()=>setMapMode('lite'));
byId('centerBtn').addEventListener('click',()=>{if(state.map&&state.plane){state.map.setView(state.plane.getLatLng(),Math.max(state.map.getZoom(),7),{animate:true});state.plane.openPopup();}else setNotice('No aircraft position to center on yet.','waiting');});
byId('fullBtn').addEventListener('click',()=>{const w=byId('mapWrap'),on=!w.classList.contains('fullscreen');w.classList.toggle('fullscreen',on);document.body.classList.toggle('map-full',on);byId('fullBtn').setAttribute('aria-pressed',String(on));byId('fullBtn').textContent=on?'Exit full':'Fullscreen';setTimeout(()=>{if(state.map)state.map.invalidateSize({animate:false});liteSoon();},60);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&byId('mapWrap').classList.contains('fullscreen'))byId('fullBtn').click();});
byId('fitBtn').addEventListener('click',()=>{state.follow=false;byId('follow').checked=false;fitRoute();});
byId('follow').addEventListener('change',e=>{state.follow=e.target.checked;if(state.follow&&state.plane&&state.map)state.map.panTo(state.plane.getLatLng(),{animate:true});});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(state.map)state.map.invalidateSize({animate:false,pan:false});refresh();}});
buildAltScale(45000);buildGauge();buildSig();tickClocks();setInterval(tickClocks,15000);drawProfile([]);
{const s=store('spd');if(s==='gs'||s==='tas')state.spdMode=s;}
setSpdTitles();
$$('.spd-seg').forEach(s=>s.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.spdMode=b.dataset.m;store('spd',state.spdMode);setSpdTitles();if(state.last&&state.fresh)renderSpeed(state.last);}));
{const t=store('tmp');if(t==='a'||t==='g')state.tmpMode=t;}
byId('tmpSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.tmpMode=b.dataset.m;store('tmp',state.tmpMode);renderTemp();});
renderTemp();
// ----- hide / show overlays -----
{const dock=byId('dock'),dt=byId('dockToggle'),tools=document.querySelector('.map-tools'),tt=byId('toolsToggle');
 const ad=h=>{dock.classList.toggle('hid',h);dt.textContent=h?'Show widgets':'Hide widgets';dt.setAttribute('aria-expanded',String(!h));dt.setAttribute('aria-label',h?'Show widgets':'Hide widgets');setOv('dock',h);};
 const at=h=>{tools.classList.toggle('min',h);tt.textContent=h?'Map tools':'Hide tools';tt.setAttribute('aria-expanded',String(!h));tt.setAttribute('aria-label',h?'Show map tools':'Hide map tools');setOv('tools',h);};
 dt.addEventListener('click',()=>ad(!dock.classList.contains('hid')));
 tt.addEventListener('click',()=>at(!tools.classList.contains('min')));
 ad(!!ov.dock);at(!!ov.tools);}
// ----- flyout panels -----
const drawers=$$('.drawer');
function openDrawer(id){
 drawers.forEach(d=>{const on=d.id===id;d.classList.toggle('open',on);d.setAttribute('aria-hidden',String(!on));});
 $$('#rail button').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.d===id)));
 byId('stage').classList.toggle('has-drawer',!!id);
 if(id){if(cfg)closeFinder();const x=byId(id).querySelector('[data-close]');if(x)setTimeout(()=>x.focus({preventScroll:true}),280);}
 else if(!cfg)openFinder();
}
function closeDrawers(){if(history.state&&history.state.dr){history.back();}else openDrawer(null);}
window.addEventListener('popstate',()=>{openDrawer(null);});
byId('rail').addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(!b)return;const id=b.dataset.d;
 if(byId(id).classList.contains('open')){closeDrawers();return;}
 if(!byId('stage').classList.contains('has-drawer')){try{history.pushState({dr:1},'');}catch(_){}}
 if(!cfg)byId('finder').hidden=true;
 openDrawer(id);});
// swipe left on a panel closes it (phones)
{let sx=0,sy=0,st=0;
 for(const d of drawers){
  d.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();},{passive:true});
  d.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(dx<-90&&Math.abs(dy)<50&&Date.now()-st<600&&!e.target.closest('#profileSvg'))closeDrawers();},{passive:true});
 }}
// keep the screen awake while a flight is on screen
{let lock=null;
 const want=async()=>{try{if(cfg&&'wakeLock' in navigator&&!document.hidden&&!lock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null;});}}catch(_){lock=null;}};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)want();});document.addEventListener('click',want,{once:true});}
$$('[data-close]').forEach(x=>x.addEventListener('click',closeDrawers));
byId('homeBtn').addEventListener('click',()=>{if(byId('stage').classList.contains('has-drawer'))closeDrawers();else if(cfg)closeFinder();});
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||byId('mapWrap').classList.contains('fullscreen'))return;if(!byId('finder').hidden&&cfg){closeFinder();return;}closeDrawers();});
// ----- tab toggles -----
$$('.seg.tabs[data-group]').forEach(seg=>seg.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const g=seg.dataset.group;
 seg.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 $$('.tabpane[data-group="'+g+'"]').forEach(p=>{p.hidden=p.id!==b.dataset.t;});}));
byId('metarSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 byId('metarSeg').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));byId('metarGrid').dataset.show=b.dataset.i;});
setInterval(()=>{if(!document.hidden)loadMetar();},600000);
const preferLite=window.matchMedia('(pointer: coarse)').matches||window.innerWidth<700;
setMapMode(preferLite?'lite':'street');
renderRecents();renderMetarTabs();

// ---------- start: URL (?id=&mode= or ?flight=, optional &from=&to=), else the last flight from the past day ----------
{
 const q=new URLSearchParams(location.search);
 const pid=(q.get('id')||'').trim(),pflight=(q.get('flight')||'').trim(),pmode=(q.get('mode')||'').toLowerCase();
 let sel=null;
 if(pid){const p=parseQuery(pid,MODE_LABEL[pmode]?pmode:'auto');if(!p.error)sel=p;}
 else if(pflight){const p=parseQuery(pflight,'auto');if(!p.error)sel=p;}
 const pf=(q.get('from')||'').trim().toUpperCase(),pt=(q.get('to')||'').trim().toUpperCase();
 const ok=c=>/^([A-Z]{3}|[A-Z][A-Z0-9]{3})$/.test(c);
 const manual=(pf&&ok(pf))||(pt&&ok(pt))?{from:ok(pf)?pf:'',to:ok(pt)?pt:''}:null;
 if(!sel&&!pid&&!pflight){const last=store('last');if(last&&MODE_LABEL[last.mode]&&typeof last.id==='string'&&Date.now()-(last.at||0)<24*3600*1000)sel=last;}
 if(sel)select(sel,{manual:manual});
 else{
   byId('stage').classList.add('idle');updateHeader();setStatus('waiting','No flight selected');
   if(pid||pflight){const h=byId('finder').querySelector('[data-hint]');h.textContent='Could not read "'+(pid||pflight).slice(0,16)+'" from the link. Try a flight number like UA123.';h.classList.add('err');}
   openFinder();
 }
}
setInterval(()=>{if(!document.hidden)refresh();},REFRESH_MS);
})();
