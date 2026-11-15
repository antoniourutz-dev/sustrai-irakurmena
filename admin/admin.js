/* SUSTRAI: administration client. Authorization enforced by Supabase RLS and admin RPCs. */
'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const s={client:null,users:[],contents:[],rules:[],grants:[],selected:null,kind:'reading'};
 const status=message=>{$('status').textContent=message};
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
 const empty=(target,message)=>{target.replaceChildren(el('p',message,'subtle'))};
 const displayKey=(key)=>{
   if(key.includes('writer')||key.includes('writing'))return 'Idazlana / zirriborroa';
   if(key.includes('oral')||key.includes('outline'))return 'Ahozko eskema / oharra';
   if(key.includes('highlight')||key.includes('marks'))return 'Markak / azpimarrak';
   if(key.includes('attempts'))return 'Azterketaren aurreko saiakerak';
   if(key.includes('answers'))return 'Erantzunak';
   return 'Beste saio-datu batzuk';
 };
 async function fetchList(table,fields){
   const {data,error}=await s.client.from(table).select(fields).limit(1500);
   if(error)throw error;return data||[];
 }
 async function load(){
   status('Ikasleak eta edukiak kargatzen…');
   const [students,exams,writings,orals,rules,grants]=await Promise.all([
     s.client.rpc('sr_admin_students'),
     fetchList('sr_exams','id,slug,title,publication_status'),
     fetchList('sr_writing_prompts','id,slug,title_eu,exam_reference,publication_status'),
     fetchList('sr_speaking_prompts','id,slug,title_eu,exam_reference,publication_status'),
     fetchList('sr_app_content_rules','kind,resource_id,guest_visible,member_visible'),
     fetchList('sr_app_grants','user_id,kind,resource_id,allowed')
   ]);
   if(students.error)throw students.error;
   if(!Array.isArray(students.data))throw new Error('Administratzaile-baimenik ez.');
   s.users=students.data;
   s.contents=[
     ...exams.filter(e=>e.publication_status==='published').map(e=>({kind:'reading',id:e.id,label:e.title||e.slug,info:e.slug})),
     ...writings.filter(e=>e.publication_status==='published').map(e=>({kind:'writing',id:e.id,label:e.title_eu||e.slug,info:e.exam_reference||e.slug})),
     ...orals.filter(e=>e.publication_status==='published').map(e=>({kind:'speaking',id:e.id,label:e.title_eu||e.slug,info:e.exam_reference||e.slug}))
   ];
   s.rules=rules;s.grants=grants;
   if(s.selected&&!s.users.some(u=>u.id===s.selected))s.selected=null;
   render();
   if(s.selected)await loadStudent(s.selected);
   status('Kargatuta · '+s.users.length+' ikasle · '+s.contents.length+' eduki');
 }
 function renderStats(){
   const total=s.users.length,active=s.users.filter(u=>u.active).length,
     work=s.users.reduce((a,u)=>a+Number(u.savedItems||0),0),
     attempts=s.users.reduce((a,u)=>a+Number(u.readingAttempts||0),0);
   const data=[['Ikasleak',total],['Kontu aktiboak',active],['Gordetako elementuak',work],['Irakurmen-saiakerak',attempts]];
   $('stats').replaceChildren(...data.map(([label,value])=>{
     const box=el('div',undefined,'stat');box.append(el('strong',value),el('span',label));return box;
   }));
 }
 function renderStudents(){
   const search=$('studentSearch').value.toLocaleLowerCase('eu');
   const list=$('students');list.replaceChildren();
   const rows=s.users.filter(u=>(String(u.email)+' '+String(u.name)).toLocaleLowerCase('eu').includes(search));
   if(!rows.length)return empty(list,'Ez dago ikaslerik iragazki honekin.');
   for(const u of rows){
     const btn=el('button',undefined,'student'+(s.selected===u.id?' active':''));
     btn.type='button';btn.append(el('strong',u.name||u.email),el('small',u.email));
     btn.append(el('small',(u.active?'Aktibo':'Desaktibatuta')+' · '+u.savedItems+' elementu · '+u.readingAttempts+' proba'));
     btn.onclick=()=>selectStudent(u.id);list.append(btn);
   }
 }
 async function selectStudent(id){s.selected=id;renderStudents();renderContent();await loadStudent(id)}
 function renderWorks(rows){
   const root=$('works');root.replaceChildren();
   if(!rows.length)return empty(root,'Ez dago oraindik gordetako lanik.');
   for(const row of rows){
     const details=el('details',undefined,'work-row');
     details.append(el('summary',displayKey(row.storage_key)+' · '+row.storage_key),el('small',new Date(row.updated_at).toLocaleString('eu')));
     const pre=el('pre');
     try{
       const parsed=JSON.parse(row.value_text);
       pre.textContent=JSON.stringify(parsed,null,2);
     }catch{pre.textContent=row.value_text}
     details.append(pre);root.append(details);
   }
 }
 function renderResults(rows){
   const root=$('results');root.replaceChildren();
   if(!rows.length)return empty(root,'Ez dago erregistratutako irakurmen-emaitzarik.');
   for(const row of rows){
     const div=el('div',undefined,'result-row');
     const left=el('div');left.append(el('strong',String(row.score)+' / '+String(row.max_score)+' puntu'),
       el('small',new Date(row.created_at).toLocaleString('eu')));
     div.append(left,el('span',row.correct+' / '+row.total+' zuzen'));
     root.append(div);
   }
 }
 async function loadStudent(id){
   const user=s.users.find(u=>u.id===id);if(!user)return;
   $('studentTitle').textContent=user.name||user.email;
   $('studentSummary').textContent=user.email+' · '+(user.active?'Kontu aktiboa':'Kontua desaktibatuta')+
    ' · '+user.savedItems+' lan-elementu · '+user.readingAttempts+' irakurmen-saiakera';
   $('userActive').hidden=false;$('userActive').textContent=user.active?'Desaktibatu kontua':'Aktibatu kontua';
   empty($('works'),'Kargatzen…');empty($('results'),'Kargatzen…');
   try{
     const [a,b]=await Promise.all([
       s.client.from('sr_app_state').select('storage_key,value_text,updated_at').eq('user_id',id).order('updated_at',{ascending:false}).limit(500),
       s.client.from('sr_app_reading_results').select('score,max_score,correct,total,created_at').eq('user_id',id).order('created_at',{ascending:false}).limit(100)
     ]);
     if(a.error)throw a.error;if(b.error)throw b.error;
     if(s.selected!==id)return;renderWorks(a.data||[]);renderResults(b.data||[]);
   }catch(err){status('Ikaslearen datuak ezin izan dira irakurri: '+(err.message||'errorea'))}
 }
 function selection(label,values,chosen){
   const select=document.createElement('select');select.setAttribute('aria-label',label);
   for(const [value,title] of values){const o=el('option',title);o.value=value;select.append(o)}
   select.value=chosen;return select;
 }
 function renderContent(){
   const root=$('content');root.replaceChildren();
   const search=$('contentSearch').value.toLocaleLowerCase('eu').trim(),kind=$('contentType').value;
   const rows=s.contents.filter(x=>x.kind===kind&&(!search||(x.label+' '+x.info).toLocaleLowerCase('eu').includes(search)));
   if(!rows.length)return empty(root,'Ez dago edukirik iragazki honekin.');
   for(const item of rows){
     const rule=s.rules.find(x=>x.kind===item.kind&&x.resource_id===item.id);
     const grant=s.selected?s.grants.find(x=>x.user_id===s.selected&&x.kind===item.kind&&x.resource_id===item.id):null;
     const div=el('div',undefined,'content-row');
     const name=el('div');name.append(el('strong',item.label),el('small',item.info));div.append(name);
     const guest=selection('Gonbidatuen baimena',[['yes','Ikusgai'],['no','Ezkutuan']],rule?.guest_visible===false?'no':'yes');
     const member=selection('Kontu guztien baimena',[['yes','Ikusgai'],['no','Ezkutuan']],rule?.member_visible===false?'no':'yes');
     const special=selection('Hautatutako ikaslearen salbuespena',[['default','Orokorra'],['allow','Baimendu'],['deny','Ukatu']],grant?grant.allowed?'allow':'deny':'default');
     if(!s.selected)special.disabled=true;
     const wrap=(label,select)=>{const x=el('label',label);x.append(select);return x};
     div.append(wrap('Gonbidatuak',guest),wrap('Ikasle guztiak',member),
       wrap(s.selected?'Ikasle hautatua':'Hautatu ikaslea',special));
     const save=el('button','Gorde');save.type='button';
     save.onclick=async()=>{
       save.disabled=true;save.textContent='Gordetzen…';
       try{await savePermission(item,guest.value,member.value,special.value);save.textContent='Gordeta';status('Baimenak eguneratu dira.');}
       catch(err){save.textContent='Errorea';status('Ezin izan da gorde: '+(err.message||'errorea'))}
       finally{save.disabled=false}
     };
     div.append(save);root.append(div);
   }
 }
 async function savePermission(item,guest,member,special){
   const visibleGuest=guest==='yes',visibleMember=member==='yes';
   if(visibleGuest&&visibleMember){
     const {error}=await s.client.from('sr_app_content_rules').delete().eq('kind',item.kind).eq('resource_id',item.id);
     if(error)throw error;
   } else {
     const {error}=await s.client.from('sr_app_content_rules').upsert({
       kind:item.kind,resource_id:item.id,guest_visible:visibleGuest,member_visible:visibleMember,updated_at:new Date().toISOString()
     },{onConflict:'kind,resource_id'});
     if(error)throw error;
   }
   if(s.selected){
     if(special==='default'){
       const {error}=await s.client.from('sr_app_grants').delete().eq('user_id',s.selected).eq('kind',item.kind).eq('resource_id',item.id);
       if(error)throw error;
     }else{
       const {error}=await s.client.from('sr_app_grants').upsert({
         user_id:s.selected,kind:item.kind,resource_id:item.id,allowed:special==='allow',updated_at:new Date().toISOString()
       },{onConflict:'user_id,kind,resource_id'});
       if(error)throw error;
     }
   }
   const [r,g]=await Promise.all([
    fetchList('sr_app_content_rules','kind,resource_id,guest_visible,member_visible'),
    fetchList('sr_app_grants','user_id,kind,resource_id,allowed')
   ]);
   s.rules=r;s.grants=g;
 }
 async function toggleActive(){
   const u=s.users.find(x=>x.id===s.selected);if(!u)return;
   const target=!u.active;if(!confirm((target?'Aktibatu':'Desaktibatu')+' kontua: '+u.email+'?'))return;
   const {error}=await s.client.from('sr_app_profiles').update({active:target}).eq('user_id',u.id);
   if(error){status(error.message);return}
   u.active=target;renderStudents();renderStats();loadStudent(u.id);status('Kontuaren egoera eguneratua.');
 }
 function render(){renderStats();renderStudents();renderContent()}
 async function start(){
   await window.SustraiCloud.ready;
   s.client=window.SustraiCloud.client();
   $('adminApp').setAttribute('aria-busy','false');
   if(!s.client||!window.SustraiCloud.isAdmin()){
     $('restricted').hidden=false;$('loginAdmin').onclick=()=>window.SustraiCloud.openLogin();status('Administratzailearen kontua behar da.');return;
   }
   $('adminPanels').hidden=false;
   $('refresh').onclick=()=>load().catch(e=>status(e.message));
   $('studentSearch').oninput=renderStudents;
   $('contentSearch').oninput=renderContent;
   $('contentType').onchange=renderContent;
   $('userActive').onclick=toggleActive;
   await load();
 }
 start().catch(err=>{status(err.message||'Kargatze-errorea');$('restricted').hidden=false});
})();