/* node --test tests/jokoak-zinok-ui.test.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const raw=fs.readFileSync(path.join(__dirname,'../jokoak/zinok/app.js'),'utf8');
function boot(){
 const events={},store=new Map(),hero={hidden:false};
 const root={
  html:'',keyboardFocus:0,
  get innerHTML(){return this.html},
  set innerHTML(v){this.html=v},
  addEventListener(type,callback){events[type]=callback},
  contains(){return true},
  querySelector(){return {focus:options=>{if(options?.preventScroll)root.keyboardFocus++}}}
 };
 const doc={
  getElementById:id=>id==='zinokApp'?root:null,
  querySelector:s=>s.includes('.areas-hero')?hero:null
 };
 const questions=Array.from({length:10},(_,i)=>({
   id:'q'+i,word:'Hitza'+i,options:['okerra'+i,'zuzena'+i,'beste'+i,'aukera'+i],
   correctIndex:1,correctAnswer:'zuzena'+i,knownAlternatives:['zuzena'+i]
 }));
 const core={
  LEVELS:['B1','B2','C1','C2','EX','MA'],
  quiz:()=>questions,
  search:()=>[],
  score:rows=>({correct:rows.filter(x=>x.correct).length,total:rows.length,wrong:rows.filter(x=>!x.correct).length})
 };
 let scrolls=0;
 const win={
  ZinokCore:core,ZinokSynonyms:[],
  SustraiCloud:{storage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
   flush:()=>Promise.resolve()},
  crypto:{randomUUID:()=>'test-uuid'},
  scrollTo(){scrolls++}
 };
 vm.runInNewContext(raw,{window:win,document:doc,console});
 const click=(action,data={},detail=1)=>events.click({
  detail,target:{closest:()=>({dataset:{action,...data}})}
 });
 return {root,hero,store,click,scrolls:()=>scrolls};
}
test('Jokatzean goiburua ezkutatzen da eta erantzuna eman orduko aurreratzen da',()=>{
 const v=boot();
 assert.equal(v.hero.hidden,false);
 v.click('quiz',{level:'B1'});
 assert.equal(v.hero.hidden,true);
 assert.equal(v.scrolls(),1);
 assert.match(v.root.html,/Galdera 1 \/ 10/);
 v.click('answer',{index:'0'},1);
 assert.match(v.root.html,/Galdera 2 \/ 10/);
 assert.equal(v.root.keyboardFocus,0);
 assert.doesNotMatch(v.root.html,/zinok-feedback|Jokoaren gakoa|Hurrengo galdera/);
});
test('Teklatuarekin hurrengo aukeran dago fokua, scrollik gabe',()=>{
 const v=boot();
 v.click('quiz',{level:'B1'});
 v.click('answer',{index:'0'},0);
 assert.equal(v.root.keyboardFocus,1);
 assert.equal(v.scrolls(),1);
});
test('Amaierako emaitzek hutsegiteen berrikuspena erakusten dute bakarrik irekitzean',()=>{
 const v=boot();
 v.click('quiz',{level:'B1'});
 for(let i=0;i<10;i++)v.click('answer',{index:'0'});
 assert.match(v.root.html,/SAIOA AMAITUTA/);
 assert.match(v.root.html,/10 hutsegiteak/);
 assert.match(v.root.html,/<details class="zinok-review-disclosure">/);
 assert.match(v.root.html,/Erantzun-gakoa/);
 assert.equal(v.hero.hidden,true);
 const history=JSON.parse(v.store.get('sustrai-jokoak-zinok-v1'));
 assert.equal(history.length,1);
 assert.equal(history[0].total,10);
 assert.equal(history[0].correct,0);
 v.click('home');
 assert.equal(v.hero.hidden,false);
});
test('ZINOK orriak ez dauka beheko abisu luzea',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../jokoak/zinok/index.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../jokoak/zinok/zinok.css'),'utf8');
 assert.doesNotMatch(html,/areas-support/);
 assert.match(css,/\.areas-hero\[hidden\]/);
});
