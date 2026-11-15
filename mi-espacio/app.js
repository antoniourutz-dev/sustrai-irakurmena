'use strict';
(() => {
 const $=id=>document.getElementById(id),status=x=>$('myStatus').textContent=x;
 let client=null,profile=null,works=[],results=[];
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
 const label=key=>key.includes('writer')||key.includes('writing')?'Idazlana':key.includes('oral')||key.includes('outline')?'Ahozko eskema':key.includes('marks')||key.includes('highlight')?'Azpimarrak':key.includes('attempts')?'Aurreko emaitzak':key.includes('answers')?'Erantzunak':'Saio-datuak';
 const showEmpty=(where,text)=>where.replaceChildren(el('p',text,'empty'));
 async function fetchData(){
  status('Datuak kargatzen…');await window.SustraiCloud.flush();
  const [a,b]=await Promise.all([
   client.from('sr_app_state').select('storage_key,value_text,updated_at').eq('user_id',profile.id).order('updated_at',{ascending:false}).limit(1500),
   client.from('sr_app_reading_results').select('id,score,max_score,correct,total,created_at').eq('user_id',profile.id).order('created_at',{ascending:false}).limit(500)
  ]);
  if(a.error)throw a.error;if(b.error)throw b.error;
  works=a.data||[];results=b.data||[];
  render();status(works.length+' lan-elementu · '+results.length+' irakurmen-emaitza');
 }
 function render(){
  const w=$('myWorks'),r=$('myResults');w.replaceChildren();r.replaceChildren();
  if(!works.length)showEmpty(w,'Oraindik ez duzu hodeian gordetako lanik.');
  for(const row of works){
    const details=el('details',undefined,'work-row');details.append(el('summary',label(row.storage_key)+' · '+row.storage_key),
      el('small',new Date(row.updated_at).toLocaleString('eu')));
    const pre=el('pre');try{pre.textContent=JSON.stringify(JSON.parse(row.value_text),null,2)}catch{pre.textContent=row.value_text}
    details.append(pre);
    const deleteBtn=el('button','Ezabatu','soft');
    deleteBtn.type='button';deleteBtn.onclick=async()=>{
      if(!confirm('Gordetako elementu hau behin betiko ezabatu?'))return;
      window.SustraiCloud.storage.removeItem(row.storage_key);
      await window.SustraiCloud.flush();await fetchData();
    };details.append(deleteBtn);w.append(details);
  }
  if(!results.length)showEmpty(r,'Oraindik ez duzu irakurmen-emaitzarik erregistratu.');
  for(const row of results){
    const div=el('div',undefined,'result-row'),left=el('div');
    left.append(el('strong',row.score+' / '+row.max_score+' puntu'),el('small',new Date(row.created_at).toLocaleString('eu')));
    div.append(left,el('span',row.correct+' / '+row.total+' zuzen'));r.append(div);
  }
 }
 function exportData(){
  const payload={exported_at:new Date().toISOString(),account_email:profile.email,works,reading_results:results};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='sustrai-nire-datuak.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function start(){
  await window.SustraiCloud.ready;profile=window.SustraiCloud.profile();client=window.SustraiCloud.client();
  if(!profile?.active){$('guest').hidden=false;$('login').onclick=()=>window.SustraiCloud.openLogin();status('Gonbidatu modua');return}
  $('signedIn').hidden=false;$('identity').textContent=profile.email;
  $('refresh').onclick=()=>fetchData().catch(e=>status(e.message));
  $('import').onclick=async()=>{await window.SustraiCloud.importGuestData();await fetchData()};
  $('export').onclick=exportData;
  await fetchData();
 }
 start().catch(err=>status(err?.message||'Datuak ezin izan dira kargatu.'));
})();