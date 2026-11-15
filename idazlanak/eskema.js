/* SUSTRAI · Eskema-tailerra (B2/C1/C2rako zabal daiteke).
   Ikaslearen aurretiko erabakiak biltzen ditu: ez sortu idazlanik haren ordez. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MAX_IDEAS=8;
const EMPTY_IDEA=()=>({idea:'',reason:'',chosen:false});
let task=null, mode='training', stage=0, data=null;
const STAGES=['MISIOA','MEZUA','IBILBIDEA','BERRIKUSI'];
function isLetter(){return ['gutuna','gutun_irekia','eskaera','kexa'].includes(task?.genre)}
function fieldsForGenre(){
 if(isLetter())return [
 {key:'opening',label:'Hasiera',description:'Norentzat eta zertarako ari zara idazten?'},
 {key:'context',label:'Egoera edo gertatutakoa',description:'Hartzaileak zer jakin behar du testua ulertzeko?'},
 {key:'reasons',label:'Arrazoiak eta justifikazioa',description:'Zerk justifikatzen du zure eskaera edo jarrera?'},
 {key:'proposal',label:'Eskaera edo proposamena',description:'Zer erantzun edo ekintza zehatz eskatzen duzu?'},
 {key:'close',label:'Amaiera',description:'Nola itxiko duzu mezuari eutsiz?'}
 ];
 return [
 {key:'opening',label:'Sarrera',description:'Zer arazo edo galdera jarriko duzu mahai gainean?'},
 {key:'argument1',label:'Lehen garapen-ideia',description:'Zer argudio azalduko duzu lehenik?'},
 {key:'argument2',label:'Bigarren garapen-ideia',description:'Zer gehitzen dio bigarrenak aurrekoari?'},
 {key:'nuance',label:'Ñabardura edo proposamena',description:'Zein muga, bestelako ikuspegi edo irtenbide aipatuko duzu?'},
 {key:'close',label:'Ondorioa',description:'Zer ideia nagusirekin utzi nahi duzu irakurlea?'}
 ];
}
function empty(){return {version:1,audience:'',goal:'',thesis:'',ideas:[EMPTY_IDEA(),EMPTY_IDEA(),EMPTY_IDEA()],route:{},coverage:{},checks:{},helpUsed:0,updatedAt:Date.now()}}
function key(){return 'sustrai-outline-v1:'+task.slug+':'+mode}
function restore(){
 try {
  const raw=window.SustraiCloud.storage.getItem(key());if(!raw)return empty();
  const p=JSON.parse(raw);
  if(!p||p.version!==1||!Array.isArray(p.ideas))return empty();
  const valid=empty();
  for(const id of ['audience','goal','thesis'])if(typeof p[id]==='string')valid[id]=p[id].slice(0,2000);
  valid.ideas=p.ideas.slice(0,MAX_IDEAS).map(x=>({idea:typeof x?.idea==='string'?x.idea.slice(0,1400):'',reason:typeof x?.reason==='string'?x.reason.slice(0,1400):'',chosen:x?.chosen===true}));
  if(!valid.ideas.length)valid.ideas=[EMPTY_IDEA()];
  if(p.route&&typeof p.route==='object')for(const f of fieldsForGenre())if(typeof p.route[f.key]==='string')valid.route[f.key]=p.route[f.key].slice(0,2500);
  if(p.coverage&&typeof p.coverage==='object')for(const [k,v] of Object.entries(p.coverage))if(/^\d+$/.test(k)&&v===true)valid.coverage[k]=true;
  if(p.checks&&typeof p.checks==='object')for(const [k,v] of Object.entries(p.checks))if(['target','logic','evidence','cohesion','originality'].includes(k)&&v===true)valid.checks[k]=true;
  valid.helpUsed=Number.isInteger(p.helpUsed)?Math.max(0,Math.min(p.helpUsed,20)):0;
  return valid;
 }catch{return empty()}
}
function save(){
 if(!task||!data)return;
 try{data.updatedAt=Date.now();window.SustraiCloud.storage.setItem(key(),JSON.stringify(data));$('outlineSaved').textContent=window.SustraiCloud.user()?'Hodeira bidaltzen…':'Zure gailuan gordeta';}
 catch{$('outlineSaved').textContent='Ezin izan da gorde; kopiatu eskema.'}
}
function measure(){
 const filled=[data.audience,data.goal,data.thesis].filter(x=>x.trim()).length;
 const selectedIdeas=data.ideas.filter(x=>x.chosen&&x.idea.trim()).length;
 const argued=data.ideas.filter(x=>x.chosen&&x.idea.trim()&&x.reason.trim()).length;
 const routeFilled=fieldsForGenre().filter(x=>(data.route[x.key]||'').trim()).length;
 const checks=Object.values(data.checks).filter(Boolean).length;
 return {filled,selectedIdeas,argued,routeFilled,checks};
}
function meter(){
 if(!task||!data)return;
 const m=measure();
 $('outlineProgress').textContent=[m.filled+'/3 misio-erabaki',m.selectedIdeas+' ideia hautatu',m.routeFilled+' atal antolatu'].join(' · ');
 $('outlineHelpCount').textContent=data.helpUsed?data.helpUsed+' pista ireki dituzu':'Oraindik ez duzu pistarik ireki';
 $('outlineGoWrite').disabled=!data.goal.trim()&&!data.thesis.trim()&&!data.ideas.some(x=>x.idea.trim())&&!m.routeFilled;
}
function renderMission(){
 $('outlineGenre').textContent=isLetter()?'Gutuna edo eskaera: hartzailea eta xedea lehenetsi':'Iritzi-testua: tesia eta hartzailea lehenetsi';
 $('outlineMissionAudience').value=data.audience;
 $('outlineMissionGoal').value=data.goal;
 $('outlineMissionThesis').value=data.thesis;
 $('outlineGoalLabel').textContent=isLetter()?'Zer eskatu edo jakinarazi nahi diozu hartzaileari?':'Zer iritzi defendatu nahi duzu?';
 $('outlinePurposeLabel').textContent=isLetter()?'Zergatik idazten diozu?':'Zertarako idatziko duzu?';
 $('outlineOfficialReader').textContent=task.audience_eu||'Hartzailea zehazteko, irakurri jatorrizko enuntziatua.';
}
function createIdeaElement(item,index){
 const card=document.createElement('article');card.className='outline-idea-card';
 card.innerHTML='<div class="outline-idea-heading"><strong>'+String(index+1).padStart(2,'0')+'. ideia</strong><label class="outline-chosen"><input type="checkbox" data-idea-index="'+index+'" data-field="chosen" '+(item.chosen?'checked':'')+'> Garatzeko hautatu</label></div>'
 +'<label for="outlineIdea'+index+'">Zer ideia duzu?</label>'
 +'<textarea rows="2" maxlength="1400" id="outlineIdea'+index+'" data-idea-index="'+index+'" data-field="idea" placeholder="Idatzi zeure ideia hitz gutxitan…">'+escapeHTML(item.idea)+'</textarea>'
 +'<label for="outlineReason'+index+'">Zer arrazoik, datuk edo adibidek indartzen du?</label>'
 +'<textarea rows="2" maxlength="1400" id="outlineReason'+index+'" data-idea-index="'+index+'" data-field="reason" placeholder="Zure justifikazioa, beste daturik asmatu gabe…">'+escapeHTML(item.reason)+'</textarea>'
 +'<button type="button" class="outline-remove" data-remove-idea="'+index+'" '+(data.ideas.length===1?'disabled':'')+'>Ideia kendu</button>';
 return card;
}
function renderIdeas(){
 const list=$('outlineIdeaList');list.replaceChildren();
 data.ideas.forEach((x,i)=>list.append(createIdeaElement(x,i)));
 $('outlineAddIdea').disabled=data.ideas.length>=MAX_IDEAS;
 $('outlineIdeaInfo').textContent='Idatzi ideia posibleak eta aukeratu zeintzuk garatuko dituzun. Ez da derrigorrezkoa guztiak erabiltzea.';
}
function renderRoute(){
 const route=$('outlineRouteFields');route.replaceChildren();
 const chosen=data.ideas.filter(x=>x.chosen&&x.idea.trim()).map(x=>x.idea.trim());
 $('outlineChosenSummary').textContent=chosen.length?'Hautatutako ideiak: '+chosen.map((x,i)=>(i+1)+'. '+x).join(' · '):'Oraindik ez duzu ideiarik hautatu. Aurreko urratsean hauta ditzakezu.';
 for(const f of fieldsForGenre()){
  const box=document.createElement('div');box.className='outline-route-field';
  const l=document.createElement('label');l.setAttribute('for','outlineRoute_'+f.key);l.textContent=f.label;
  const p=document.createElement('p');p.className='outline-route-description';p.textContent=f.description;
  const a=document.createElement('textarea');a.id='outlineRoute_'+f.key;a.dataset.routeKey=f.key;a.rows=2;a.maxLength=2500;a.value=data.route[f.key]||'';
  a.placeholder='Zer esango duzu atal honetan? Idatzi eskemaren ideia, ez paragrafo osoa.';
  box.append(l,p,a);route.append(box);
 }
}
const REVIEW_CHECKS=[
 {key:'target',label:'Hartzailea, generoa eta tonua kontuan hartu ditut'},
 {key:'logic',label:'Ideien hurrenkera ulertzeko modukoa da'},
 {key:'evidence',label:'Ideia nagusiek justifikazioa edo adibide bat dute'},
 {key:'cohesion',label:'Atal bakoitzak ekarpen argi bat egiten du'},
 {key:'originality',label:'Nire hitzekin osatu dut, eredu osoa kopiatu gabe'}
];
function previewText(){
 const lines=['SUSTRAI · NIRE AURRETIKO ESKEMA','Ataza: '+task.title_eu,'Modua: '+(mode==='simulation'?'simulazioa':'entrenamendua'),''];
 const add=(name,value)=>{if(String(value||'').trim())lines.push(name+': '+String(value).trim())};
 add('Hartzailea',data.audience);add('Xedea',data.goal);add('Mezu nagusia',data.thesis);
 lines.push('','IDEIAK');
 const ideas=data.ideas.filter(x=>x.chosen&&x.idea.trim());
 if(ideas.length)ideas.forEach((x,i)=>{lines.push((i+1)+'. '+x.idea.trim());if(x.reason.trim())lines.push('   Oinarria/adibidea: '+x.reason.trim())});
 else lines.push('(Oraindik hautatu gabe)');
 lines.push('','IBILBIDEA');
 for(const f of fieldsForGenre())add(f.label,data.route[f.key]);
 return lines.join('\n').trim();
}
function renderReview(){
 const official=$('outlineCoverage'),guidance=Array.isArray(task.exam_guidance)?task.exam_guidance.filter(x=>typeof x==='string'&&x.trim()):[];
 official.replaceChildren();
 $('outlineCoverageWrapper').hidden=!guidance.length;
 guidance.forEach((text,i)=>{
  const label=document.createElement('label');label.className='outline-check';
  const input=document.createElement('input');input.type='checkbox';input.dataset.coverageIndex=String(i);input.checked=data.coverage[i]===true;
  const span=document.createElement('span');span.textContent=text;
  label.append(input,span);official.append(label);
 });
 const self=$('outlineReviewChecks');self.replaceChildren();
 for(const item of REVIEW_CHECKS){
  const label=document.createElement('label');label.className='outline-check';
  const input=document.createElement('input');input.type='checkbox';input.dataset.reviewKey=item.key;input.checked=data.checks[item.key]===true;
  const span=document.createElement('span');span.textContent=item.label;label.append(input,span);self.append(label);
 }
 $('outlinePreview').textContent=previewText();
 renderFeedback();
}
function renderFeedback(){
 const m=measure(),items=[];
 if(!data.audience.trim()||!data.goal.trim())items.push('Zehaztu nori eta zertarako idazten diozun.');
 if(!data.thesis.trim())items.push(isLetter()?'Zehaztu eskaera edo mezu nagusia.':'Zehaztu defendatuko duzun jarrera.');
 if(m.selectedIdeas<2)items.push('Aukeratu garatuko dituzun bi ideia, gutxienez, posible bada.');
 if(m.argued<2)items.push('Saiatu hautatutako ideiak arrazoi edo adibideekin lotzen.');
 if(m.routeFilled<3)items.push('Antolatu zure mezuaren ibilbidea; ez duzu atal guztiak paragrafo bihurtu behar.');
 $('outlineFeedback').replaceChildren();
 if(items.length){
  const ul=document.createElement('ul');
  items.slice(0,4).forEach(message=>{const li=document.createElement('li');li.textContent=message;ul.append(li)});
  $('outlineFeedback').append(ul);
 }else $('outlineFeedback').textContent='Eskeman oinarrizko osagaiak daude. Berrikusi ideien arteko lotura eta hasi idazten, zure hitzekin.';
 $('outlineReviewStatus').textContent='Norberak egiaztatzeko tresna da; ez du azterketako notarik ematen.';
}
function renderStage(){
 if(!task)return;
 for(let i=0;i<4;i++){
  const pane=$('outlineStage'+i),tab=$('outlineTab'+i);
  pane.hidden=i!==stage;tab.classList.toggle('current',i===stage);tab.setAttribute('aria-selected',String(i===stage));tab.tabIndex=i===stage?0:-1;
 }
 $('outlineStepName').textContent=(stage+1)+' / 4 · '+STAGES[stage];
 $('outlinePrev').disabled=stage===0;
 $('outlineNext').hidden=stage===3;
 $('outlineNext').textContent=stage===2?'Berrikusi eskema':'Hurrengo urratsa';
 if(stage===0)renderMission();
 if(stage===1)renderIdeas();
 if(stage===2)renderRoute();
 if(stage===3)renderReview();
 meter();
}
function goStage(next,focusTab=false){
 if(!task||next<0||next>3)return;
 stage=next;renderStage();
 if(focusTab)$('outlineTab'+stage).focus();
}
function setTask(item,nextMode){
 if(!item||!item.slug)return;
 if(task&&data)save();
 task=item;mode=nextMode==='simulation'?'simulation':'training';
 data=restore();stage=0;
 $('outlineWorkshop').dataset.mode=mode;
 $('outlineTaskTitle').textContent=item.title_eu;
 $('outlineHelpMode').textContent=mode==='simulation'?'Simulazioa: pistarik ez':'Pistak zuk nahi duzunean';
 for(const d of document.querySelectorAll('.outline-hint'))d.open=false;
 renderStage();
}
function setMode(nextMode){
 if(!task)return;
 save();mode=nextMode==='simulation'?'simulation':'training';
 data=restore();stage=0;
 $('outlineWorkshop').dataset.mode=mode;
 $('outlineHelpMode').textContent=mode==='simulation'?'Simulazioa: pistarik ez':'Pistak zuk nahi duzunean';
 for(const d of document.querySelectorAll('.outline-hint'))d.open=false;
 renderStage();
}
function bind(){
 for(let i=0;i<4;i++){
  $('outlineTab'+i).addEventListener('click',()=>goStage(i));
  $('outlineTab'+i).addEventListener('keydown',event=>{
   if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
   event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?3:event.key==='ArrowRight'?(i+1)%4:(i+3)%4;goStage(next,true);
  });
 }
 for(const [id,field] of [['outlineMissionAudience','audience'],['outlineMissionGoal','goal'],['outlineMissionThesis','thesis']]){
  $(id).addEventListener('input',event=>{if(!data)return;data[field]=event.target.value;save();meter()});
 }
 $('outlineIdeaList').addEventListener('input',event=>{
  const target=event.target,index=Number(target.dataset.ideaIndex),field=target.dataset.field;
  if(!data||!Number.isInteger(index)||index<0||index>=data.ideas.length||!['idea','reason'].includes(field))return;
  data.ideas[index][field]=target.value;save();meter();
 });
 $('outlineIdeaList').addEventListener('change',event=>{
  const el=event.target,i=Number(el.dataset.ideaIndex);
  if(!data||el.dataset.field!=='chosen'||!data.ideas[i])return;
  data.ideas[i].chosen=el.checked;save();meter();
 });
 $('outlineIdeaList').addEventListener('click',event=>{
  const el=event.target.closest('[data-remove-idea]');
  if(!el||!data||data.ideas.length<2)return;
  const i=Number(el.dataset.removeIdea);
  if(i>=0&&i<data.ideas.length){data.ideas.splice(i,1);save();renderIdeas();meter()}
 });
 $('outlineAddIdea').addEventListener('click',()=>{
  if(!data||data.ideas.length>=MAX_IDEAS)return;
  data.ideas.push(EMPTY_IDEA());save();renderIdeas();meter();$('outlineIdea'+(data.ideas.length-1)).focus();
 });
 $('outlineRouteFields').addEventListener('input',event=>{
  const k=event.target.dataset.routeKey;if(!data||!fieldsForGenre().some(x=>x.key===k))return;
  data.route[k]=event.target.value;save();meter();
 });
 $('outlineCoverage').addEventListener('change',event=>{
  const i=event.target.dataset.coverageIndex;if(!data||i===undefined)return;
  data.coverage[i]=event.target.checked;save();
 });
 $('outlineReviewChecks').addEventListener('change',event=>{
  const k=event.target.dataset.reviewKey;if(!data||!REVIEW_CHECKS.some(x=>x.key===k))return;
  data.checks[k]=event.target.checked;save();meter();
 });
 for(const el of document.querySelectorAll('.outline-hint')){
  el.addEventListener('toggle',()=>{
   if(!data||!el.open||mode==='simulation')return;
   data.helpUsed+=1;save();meter();
  });
 }
 $('outlinePrev').addEventListener('click',()=>goStage(stage-1));
 $('outlineNext').addEventListener('click',()=>goStage(stage+1));
 $('outlineCopy').addEventListener('click',async()=>{
  if(!data||!task)return;
  try{await navigator.clipboard.writeText(previewText());$('outlineSaved').textContent='Eskema kopiatu da.'}
  catch{$('outlineSaved').textContent='Kopiatu ezin izan da; hautatu eskema eskuz.'}
 });
 $('outlineGoWrite').addEventListener('click',()=>{$('draft').focus();$('draft').scrollIntoView({behavior:'smooth',block:'center'})});
 $('outlineReset').addEventListener('click',()=>{
  if(!task||!confirm('Eskema hau ezabatu nahi duzu? Idazlana ez da ezabatuko.'))return;
  data=empty();save();renderStage();
 });
}
if($('outlineWorkshop'))bind();
window.SustraiEskema={setTask,setMode};
})();