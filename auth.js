/* SUSTRAI · Auth and per-user cloud storage. Guest storage remains local. */
(() => {
 'use strict';
 const API_URL = "https://awdajwrzxceqazmaorxc.supabase.co";
 const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ";
 const KEY_PREFIX = 'sustrai-';
 const state = {user:null,profile:null,client:null,cloud:new Map(),dirty:new Set(),deleted:new Set(),busy:false,notice:'',ready:false};
 const isWorkKey = key => typeof key==='string' && key.startsWith(KEY_PREFIX) && key.length<=180;
 let raw;
 try{raw=window.localStorage}catch{const m=new Map();raw={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]||null,get length(){return m.size}}}
 const notify = (msg) => {
   state.notice=msg;
   const target=document.getElementById('sustrai-account-status');
   if(target) target.textContent=msg||'';
 };
 const storage = {
  getItem(key) {
    if(!isWorkKey(key) || !state.user) {try{return raw.getItem(key)}catch{return null}}
    return state.cloud.has(key)?state.cloud.get(key):null;
  },
  setItem(key,value) {
    const v=String(value);
    if(!isWorkKey(key) || !state.user){try{raw.setItem(key,v)}catch{};return}
    if(v.length>250000){notify('Edukia handiegia da sinkronizatzeko.');return}
    state.cloud.set(key,v);state.deleted.delete(key);state.dirty.add(key);notify('Gordetzen…');schedule();
  },
  removeItem(key) {
    if(!isWorkKey(key) || !state.user){try{raw.removeItem(key)}catch{};return}
    state.cloud.delete(key);state.dirty.delete(key);state.deleted.add(key);schedule();
  }
 };
 let flushTimer=null;
 function schedule(){if(flushTimer!==null)return;flushTimer=setTimeout(()=>{flushTimer=null;flush()},700)}
 async function flush(){
   if(!state.client || !state.user || state.busy || (!state.dirty.size&&!state.deleted.size)) return;
   state.busy=true;
   const uid=state.user.id;
   const keys=[...state.dirty];state.dirty.clear();
   const removed=[...state.deleted];state.deleted.clear();
   let failed=false;
   try{
     if(keys.length){
       const rows=keys.filter(k=>state.cloud.has(k)).map(k=>({user_id:uid,storage_key:k,value_text:state.cloud.get(k),updated_at:new Date().toISOString()}));
       if(rows.length){
         const {error}=await state.client.from('sr_app_state').upsert(rows,{onConflict:'user_id,storage_key'});
         if(error)throw error;
       }
     }
     if(removed.length){
       const {error}=await state.client.from('sr_app_state').delete().eq('user_id',uid).in('storage_key',removed);
       if(error)throw error;
     }
     notify('Gordeta hodeian');
   }catch(err){
     failed=true;
     keys.forEach(k=>{if(state.cloud.has(k))state.dirty.add(k)});
     removed.forEach(k=>{if(!state.cloud.has(k))state.deleted.add(k)});
     notify('Ezin da gorde hodeian. Egiaztatu konexioa.');
     console.warn('SUSTRAI cloud sync error',err?.code||'connection');
   }finally{state.busy=false;if(!failed&&(state.dirty.size||state.deleted.size))schedule()}
 }
 async function reloadCloud(){
   const {data,error}=await state.client.from('sr_app_state').select('storage_key,value_text').eq('user_id',state.user.id).limit(2000);
   if(error)throw error;
   state.cloud.clear();
   for(const row of data||[])if(isWorkKey(row.storage_key))state.cloud.set(row.storage_key,row.value_text);
 }
 async function headers(base={}){
   if(!state.client||!state.user)return {...base};
   const {data}=await state.client.auth.getSession();
   return {...base,Authorization:'Bearer '+(data?.session?.access_token||API_KEY)};
 }
 async function init(){
   try {
     if(!window.supabase?.createClient){notify('Sarrera ez dago erabilgarri. Gonbidatu modua erabil daiteke.');return}
     state.client=window.supabase.createClient(API_URL,API_KEY,{auth:{storageKey:'sb-sustrai-c1-auth',autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
     const {data,error}=await state.client.auth.getSession();
     if(error)throw error;
     if(data?.session?.user){
       state.user=data.session.user;
       const joined=await state.client.rpc('sr_register_me');
       if(joined.error)throw joined.error;
       state.profile=joined.data;
       if(!state.profile?.active){notify('Kontua desaktibatuta dago.');return}
       await reloadCloud();
     }
     state.client.auth.onAuthStateChange((event) => {if(event==='PASSWORD_RECOVERY')openDialog('recover');if(event==='SIGNED_OUT'&&state.user)setTimeout(()=>location.reload(),0)});
   } catch(err){
     if(state.user)notify('Ezin izan dira zure datuak kargatu. Ez da ezer lokalean ordezkatu.');
     else notify('Gonbidatu modua martxan.');
     console.warn('SUSTRAI session initialization issue',err?.code||'connection');
   } finally {state.ready=true;renderAccount()}
 }
 async function importGuestData(){
   if(!state.user||!state.profile?.active)return;
   const keys=[];
   try{for(let i=0;i<raw.length;i++){const k=raw.key(i);if(isWorkKey(k) && !state.cloud.has(k))keys.push(k)}}catch{}
   if(!keys.length){notify('Ez dago inportatzeko datu berririk.');return}
   if(!confirm('Nabigatzaile honetako gonbidatu-datuak zure kontura kopiatu nahi dituzu? Ziurtatu datu horiek zureak direla.'))return;
   for(const k of keys){try{storage.setItem(k,raw.getItem(k))}catch{}}
   await flush();notify(keys.length+' datu-elementu inportatzeko prozesua osatu da.');
 }
 function dialogMarkup(){
   const div=document.createElement('div');div.id='sustrai-auth-modal';div.hidden=true;
   div.innerHTML=`
    <div class="sustrai-auth-backdrop"></div>
    <section class="sustrai-auth-card" role="dialog" aria-modal="true" aria-labelledby="sustrai-auth-title">
      <button type="button" id="sustrai-auth-close" class="sustrai-auth-close" aria-label="Itxi">×</button>
      <p class="sustrai-auth-eyebrow">SUSTRAI · IKASLEAREN KONTUA</p>
      <h2 id="sustrai-auth-title">Saioa hasi</h2>
      <p id="sustrai-auth-help">Gonbidatu gisa ere jarrai dezakezu. Kontuarekin zure lanak hodeian gordeko dira, eta irakasle/administratzaileak ikusi ahal izango ditu.</p>
      <form id="sustrai-auth-form">
        <label for="sustrai-auth-email">Helbide elektronikoa</label>
        <input id="sustrai-auth-email" name="email" type="email" autocomplete="email" required maxlength="254">
        <label for="sustrai-auth-pass">Pasahitza</label>
        <input id="sustrai-auth-pass" name="password" type="password" autocomplete="current-password" minlength="8" required>
        <button type="submit" id="sustrai-auth-submit">Sartu</button>
      </form>
      <p id="sustrai-auth-message" role="status" aria-live="polite"></p>
      <div class="sustrai-auth-links">
        <button type="button" data-auth-mode="login">Saioa hasi</button>
        <button type="button" data-auth-mode="signup">Kontua sortu</button>
        <button type="button" data-auth-mode="reset">Pasahitza berreskuratu</button>
      </div>
    </section>`;
   document.body.append(div);
   div.querySelector('#sustrai-auth-close').onclick=closeDialog;
   div.querySelector('.sustrai-auth-backdrop').onclick=closeDialog;
   div.querySelectorAll('[data-auth-mode]').forEach(b=>b.onclick=()=>setDialogMode(b.dataset.authMode));
   div.querySelector('#sustrai-auth-form').onsubmit=submitDialog;
   return div;
 }
 let dialogMode='login',focusBefore=null;
 function setDialogMode(mode){
   dialogMode=mode;const $=id=>document.getElementById(id);
   $('sustrai-auth-message').textContent='';
   $('sustrai-auth-title').textContent=({login:'Saioa hasi',signup:'Kontua sortu',reset:'Pasahitza berreskuratu',recover:'Pasahitz berria'})[mode];
   $('sustrai-auth-submit').textContent=({login:'Sartu',signup:'Erregistratu',reset:'Bidali berreskurapen-esteka',recover:'Gorde pasahitz berria'})[mode];
   const pass=$('sustrai-auth-pass');
   pass.required=mode!=='reset';pass.hidden=mode==='reset';
   const label=pass.previousElementSibling;if(label)label.hidden=mode==='reset';
   const email=$('sustrai-auth-email');email.required=mode!=='recover';
   email.parentElement.querySelector('label[for="sustrai-auth-email"]').hidden=mode==='recover';
   email.hidden=mode==='recover';
   pass.autocomplete=mode==='login'?'current-password':'new-password';
 }
 function openDialog(mode='login'){
   if(!document.getElementById('sustrai-auth-modal'))dialogMarkup();
   focusBefore=document.activeElement;
   setDialogMode(mode);
   const modal=document.getElementById('sustrai-auth-modal');
   modal.hidden=false;document.body.classList.add('sustrai-auth-open');
   modal.querySelector(mode==='recover'?'#sustrai-auth-pass':'#sustrai-auth-email')?.focus();
 }
 function closeDialog(){
   const modal=document.getElementById('sustrai-auth-modal');if(modal)modal.hidden=true;
   document.body.classList.remove('sustrai-auth-open');
   focusBefore?.focus?.();
 }
 async function submitDialog(event){
   event.preventDefault();const form=event.currentTarget,submit=form.querySelector('[type="submit"]');
   const email=form.elements.email.value.trim().toLowerCase(),password=form.elements.password.value;
   const out=document.getElementById('sustrai-auth-message');
   if(!state.client){out.textContent='Ezin da autentifikazio-zerbitzua ireki.';return}
   submit.disabled=true;out.textContent='';
   try{
     let result;
     if(dialogMode==='login')result=await state.client.auth.signInWithPassword({email,password});
     else if(dialogMode==='signup')result=await state.client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+'/'}});
     else if(dialogMode==='reset')result=await state.client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/'});
     else result=await state.client.auth.updateUser({password});
     if(result.error)throw result.error;
     if(dialogMode==='login'){location.reload();return}
     if(dialogMode==='recover'){out.textContent='Pasahitza aldatuta.';setTimeout(()=>location.assign('/'),500);return}
     out.textContent=dialogMode==='signup'
       ? 'Kontsultatu posta elektronikoa eta baieztatu kontua; ondoren, hasi saioa.'
       : 'Kontua badago, berreskurapen-esteka bidaliko da posta elektronikora.';
     form.elements.password.value='';
   }catch(err){out.textContent=err?.message||'Ezin izan da eskaera osatu.'}
   finally{submit.disabled=false}
 }
 function renderAccount(){
   const header=document.querySelector('.start-header, .topbar');
   if(!header)return;
   let el=document.getElementById('sustrai-account');
   if(!el){el=document.createElement('div');el.id='sustrai-account';el.className='sustrai-account';header.append(el)}
   el.replaceChildren();
   if(state.user && state.profile?.active){
     const title=document.createElement('span');title.className='sustrai-account-user';title.textContent=state.profile.name||state.profile.email||'Nire kontua';el.append(title);
     if(state.profile.admin){
       const admin=document.createElement('a');admin.href='/admin/';admin.textContent='Kudeaketa';admin.className='sustrai-account-button';el.append(admin);
     }
     const mySpace=document.createElement('a');mySpace.href='/mi-espacio/';mySpace.textContent='Nire espazioa';mySpace.className='sustrai-account-button';el.append(mySpace);
     const importBtn=document.createElement('button');importBtn.type='button';importBtn.className='sustrai-account-button';importBtn.textContent='Inportatu';importBtn.title='Gonbidatu gisa egindako lanak inportatu';importBtn.onclick=importGuestData;el.append(importBtn);
     const signOut=document.createElement('button');signOut.type='button';signOut.className='sustrai-account-button';signOut.textContent='Irten';signOut.onclick=async()=>{await flush();await state.client.auth.signOut();location.assign('/')};el.append(signOut);
   } else {
     const guest=document.createElement('span');guest.className='sustrai-guest-tag';guest.textContent='Gonbidatua';el.append(guest);
     const login=document.createElement('button');login.type='button';login.className='sustrai-account-button';login.textContent='Sartu / erregistratu';login.onclick=()=>openDialog();el.append(login);
   }
   const status=document.createElement('span');status.id='sustrai-account-status';status.className='sustrai-account-status';status.textContent=state.notice;status.setAttribute('role','status');el.append(status);
 }
 window.SustraiCloud={
   storage,headers,client:()=>state.client,profile:()=>state.profile,user:()=>state.user,
   isAdmin:()=>!!state.profile?.admin,flush,importGuestData,openLogin:openDialog,
   ready:null
 };
 window.SustraiCloud.ready=init();
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('sustrai-auth-modal')?.hidden)closeDialog()});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush()});
 window.addEventListener('pagehide',()=>flush());
})();
