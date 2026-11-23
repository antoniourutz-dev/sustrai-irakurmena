import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const script = read('gramatika/ibilbidea/reader.js');
const app = read('gramatika/ibilbidea/app.js');
const html = read('gramatika/ibilbidea/index.html');
const css = read('gramatika/ibilbidea/reader.css');
const sw = read('sw.js');

class MockElement {
  constructor(tag){this.tagName=tag;this.nodes=[];this._text='';this.className='';this.id='';this.attrs={};this.events={};this.open=false;}
  set textContent(value){this._text=String(value);this.nodes=[]}
  get textContent(){return this._text+this.nodes.map(n=>n.textContent||'').join('')}
  append(...nodes){this.nodes.push(...nodes)}
  replaceChildren(...nodes){this._text='';this.nodes=[];this.append(...nodes)}
  setAttribute(key,value){this.attrs[key]=String(value)}
  addEventListener(event,fn){this.events[event]=fn}
  get childElementCount(){return this.nodes.filter(n=>n.tagName!=='#text').length}
}
const doc={
  createElement:tag=>new MockElement(tag),
  createTextNode:text=>new MockElement('#text')
};
doc.createTextNode=text=>{const node=new MockElement('#text');node.textContent=text;return node};
function init(){
  const window={};
  const context=createContext({window,document:doc,URL,console});
  new Script(script,{filename:'reader.js'}).runInContext(context);
  return window.SustraiGrammarReader;
}
const fixture={
  public_editorial_grammar_entry_sections:[{title_eu:'Funtsezko atal bat',body_eu:'- Lehenengo ideia\n- Bigarrena',metadata:{},section_type:'definition'}],
  public_editorial_grammar_entry_examples:[{example_type:'good',text_eu:'Adibide zuzena.',explanation_eu:'Zergatia.'}],
  public_editorial_grammar_forms:[{id:'form-1',display_eu:'Forma baten izena',function_eu:'Haren funtzioa'}],
  public_editorial_grammar_form_examples:[{form_id:'form-1',text_eu:'Forma honen adibidea'}],
  public_editorial_grammar_form_contrasts:[{title_eu:'A eta Bren arteko aldea',contrast_explanation_eu:'Alderaketa'}],
  public_editorial_grammar_summary_tables:[{title_eu:'Taula',columns_json:['A','B'],rows_json:[['Bat','Bi']]}],
  public_editorial_grammar_error_patterns:[{wrong_eu:'Berrikusteko',correct_eu:'Beste aukera',explanation_eu:'Azalpena'}]
};
function fakeClient(log,failed){
  return {from(view){
    log.push(view);
    const chain={
      select(){return chain},eq(){return chain},order(){return chain},
      limit(){return {then:fn=>Promise.resolve(failed&&view.includes('sections')
        ? {error:{message:'API unavailable'}} : {data:fixture[view]||[],error:null}).then(fn)}}
    };
    return chain;
  }};
}
function descendants(root){
  return [root,...root.nodes.flatMap(descendants)];
}

test('The inline reader and its UI load in the right order',()=>{
  assert.doesNotThrow(()=>new Script(script));
  assert.ok(html.indexOf('reader.js')>=0&&html.indexOf('reader.js')<html.indexOf('ibilbidea/app.js'));
  for(const id of ['pathSmallerText','pathLargerText','pathReaderFocus']){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/reader\.css\?v=/);
});

test('All seven published grammar resource types are fetched and rendered in one page',async()=>{
  const reader=init();
  const calls=[];
  const entry={
    id:'entry-one',code:'b2_unit',explanation_eu:'**Azalpen osoa**.\n\nBigarren paragrafoa.',
    use_when_eu:'Erabili hemen.',source_guideline:'Euskaltzaindia',
    metadata:{sources:[{url:'https://www.euskaltzaindia.eus',title:'Euskararen Gramatika',source_type:'DESKRIBAPENA'}]}
  };
  const data=await reader.load(entry,fakeClient(calls));
  assert.equal(new Set(calls).size,7);
  const host=doc.createElement('div');
  const headings=reader.render(host,entry,data);
  assert.ok(headings.length>=7);
  for(const phrase of ['Azalpen osoa','Funtsezko atal bat','Adibide zuzena','Forma baten izena','A eta Bren arteko aldea','Taula','Berrikusteko','Euskararen Gramatika']){
    assert.ok(host.textContent.includes(phrase),phrase);
  }
  assert.ok(descendants(host).some(n=>n.tagName==='strong'),'bold text supported');
  assert.ok(descendants(host).some(n=>n.tagName==='table'),'tables supported');
});

test('Cache reuses one data request, and clears failed requests for safe retry',async()=>{
  const reader=init();const calls=[];
  const entry={id:'entry-cache',code:'cache',metadata:{}};
  await reader.load(entry,fakeClient(calls));
  await reader.load(entry,fakeClient(calls));
  assert.equal(calls.length,7);
  await assert.rejects(reader.load({id:'failed'},fakeClient([],true)));
  const success=await reader.load({id:'failed'},fakeClient([]));
  assert.ok(Array.isArray(success.sections));
});

test('Remote content is handled as text, never executable HTML',async()=>{
  assert.doesNotMatch(script,/\.innerHTML\s*=/);
  const reader=init();
  const host=doc.createElement('div');
  reader.render(host,{id:'injection',explanation_eu:'<img src=x onerror=alert(1)>',metadata:{}},
    {sections:[],examples:[],forms:[],formExamples:[],contrasts:[],tables:[],errors:[]});
  assert.ok(host.textContent.includes('<img src=x onerror=alert(1)>'));
  assert.ok(!descendants(host).some(n=>n.tagName==='img'));
});

test('All 31 topics render their complete document without navigating to a separate bank page',()=>{
  assert.match(app,/renderWholeGrammarEntry\(e,host\)/);
  assert.match(app,/tabs\.hidden=true;\s*renderUnderstanding\(e,body\)/);
  assert.doesNotMatch(app,/Ireki gramatika-fitxa osoa|Ikusi fitxa osoa gramatika-bankuan/);
  assert.match(app,/Teoria osoa ikusi/);
});

test('Linguistic asterisks survive rich text formatting',()=>{
  const reader=init();const host=doc.createElement('div');
  const original='Ez erabili *zu ezik, *hau ezik edo *nahiez gero. **Kontuan hartu**.';
  reader.render(host,{id:'linguistic-markers',explanation_eu:original,metadata:{}},
    {sections:[],examples:[],forms:[],formExamples:[],contrasts:[],tables:[],errors:[]});
  for(const marker of ['*zu ezik','*hau ezik','*nahiez gero'])assert.ok(host.textContent.includes(marker),marker);
  assert.ok(descendants(host).some(n=>n.tagName==='strong'&&n.textContent==='Kontuan hartu'));
});

const emptyData=()=>({sections:[],examples:[],forms:[],formExamples:[],contrasts:[],tables:[],errors:[]});
const hasClass=(node,name)=>node.className.split(' ').includes(name);
test('Discovery opens with an existing suitable example, never an incorrect example',()=>{
  const reader=init();const host=doc.createElement('div');const data=emptyData();
  data.examples=[{example_type:'bad',text_eu:'*Berrikusteko esaldia.',explanation_eu:'Bankuko azalpena.'}];
  data.formExamples=[{example_type:'good',text_eu:'Beste esaldi bat.',explanation_eu:'Haren azalpena.'}];
  reader.render(host,{id:'discovery',metadata:{}},data);
  const scene=descendants(host).find(n=>hasClass(n,'gr-live-opening'));
  assert.ok(scene.textContent.includes('Beste esaldi bat.'));
  assert.ok(!scene.textContent.includes('*Berrikusteko esaldia.'));
  assert.ok(scene.textContent.includes('Haren azalpena.'));
  assert.ok(descendants(scene).some(n=>n.tagName==='details'&&!n.open));
  reader.render(host,{id:'no-good-example',metadata:{}},{...emptyData(),examples:data.examples});
  assert.ok(!descendants(host).some(n=>hasClass(n,'gr-live-opening')),'do not invent a fallback example');
});

test('Progressive forms retain all content and support expanding, closing and manual disclosure',()=>{
  const reader=init();const host=doc.createElement('div');const data=emptyData();
  data.forms=[{id:'a',display_eu:'A egitura',meaning_eu:'Lehen esanahia',finite_pattern_eu:'aditza + laguntzailea'},{id:'b',display_eu:'B egitura',meaning_eu:'Bigarren esanahia'}];
  reader.render(host,{id:'forms',metadata:{}},data);
  const all=descendants(host),cards=all.filter(n=>hasClass(n,'gr-form-disclosure'));
  const toggle=all.find(n=>hasClass(n,'gr-expand-forms'));
  assert.deepEqual(cards.map(c=>c.open),[true,false]);
  assert.ok(host.textContent.includes('Lehen esanahia')&&host.textContent.includes('Bigarren esanahia'));
  assert.ok(host.textContent.includes('aditza + laguntzailea'));
  toggle.events.click();assert.ok(cards.every(c=>c.open));
  cards[1].open=false;cards[1].events.toggle();assert.equal(toggle.attrs['aria-expanded'],'false');
  toggle.events.click();assert.ok(cards.every(c=>c.open));
  toggle.events.click();assert.ok(cards.every(c=>!c.open));
});

test('Self-check reports only the current reflection and reverses when unchecked',()=>{
  const reader=init();const host=doc.createElement('div');reader.render(host,{id:'reflect',metadata:{}},emptyData());
  const area=descendants(host).find(n=>hasClass(n,'gr-live-recall'));
  const inputs=descendants(area).filter(n=>n.tagName==='input');
  const status=descendants(area).find(n=>hasClass(n,'gr-selfcheck-status'));
  assert.equal(inputs.length,3);
  for(const input of inputs){input.checked=true;input.events.change()}
  assert.match(status.textContent,/^3 \/ 3/);
  inputs[0].checked=false;inputs[0].events.change();assert.match(status.textContent,/^2 \/ 3/);
  assert.ok(area.textContent.includes('ez da kalifikazioa eta ez da gordetzen'));
});

test('Reading controls, styles, PWA assets and focus-mode exit are present',()=>{
  assert.match(app,/setupReadingControls/);
  assert.match(app,/event\.key==='Escape'/);
  assert.match(app,/readerSize/);
  assert.match(css,/--gr-document-size/);
  assert.match(css,/is-grammar-reading/);
  assert.match(css,/@media\(max-width:620px\)/);
  for(const path of ['reader.js','reader.css']){
    assert.ok(sw.includes("'/gramatika/ibilbidea/"+path+"'"));
  }
  assert.match(sw,/const CACHE_VERSION = 'sustrai-pwa-v\d+-[\w-]+'/);
});

