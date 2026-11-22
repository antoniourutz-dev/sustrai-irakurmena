/* node --test tests/jokoak-zinok.test.cjs */
const test=require('node:test'),assert=require('node:assert/strict');
const z=require('../jokoak/zinok/core.js');
const levels=['B1','B2','C1','C2','EX','MA'];
const groups=levels.flatMap((level,l)=>
 Array.from({length:15},(_,i)=>({uid:level+'-'+i,sourceId:i,
 level,words:['HITZA'+l+'_'+i,'ANTZEKOA'+l+'_'+i,'PAREKOA'+l+'_'+i]})));
test('Sei maila originalak daude, eta hurrenkera zuzena da',()=>{
 assert.deepEqual(z.LEVELS,levels);
});
test('Maila bakoitzak 10 galdera ematen ditu, errepikapenik gabe',()=>{
 for(const level of levels){
  const qs=z.quiz(groups,level,10,()=>.37);
  assert.equal(qs.length,10,level);
  assert.equal(new Set(qs.map(x=>x.id)).size,10);
  for(const q of qs){
   assert.equal(q.level,level);
   assert.equal(q.options.length,4);
   assert.equal(new Set(q.options).size,4);
   assert.equal(q.options[q.correctIndex],q.correctAnswer);
   assert(!q.options.some(x=>x===q.word));
  }
 }
});
test('Sinonimo bereko hitzak ez dira distraktore bezala agertzen',()=>{
 const one=groups.find(g=>g.level==='B1');
 const [q]=z.quiz(groups,'B1',1,()=>.999999);
 assert.equal(q.level,'B1');
 const matched=groups.find(g=>g.uid===q.id);
 assert(matched.words.includes(q.word));
 for(const option of q.options)if(option!==q.correctAnswer)assert(!matched.words.includes(option));
});
test('Bilatzaileak sei taldeak bereizten ditu',()=>{
 const result=z.search(groups,'ANTZEKOA',99);
 assert.equal(result.length,90);
 assert.equal(z.search(groups,'x').length,0);
});
test('Jatorrizko taldeen datuak ez dira aldatzen',()=>{
 const before=JSON.stringify(groups);
 z.quiz(groups,'MA',10,()=>.15);
 assert.equal(JSON.stringify(groups),before);
});
test('Lortutako emaitza didaktikoa da',()=>assert.deepEqual(z.score([{correct:true},{correct:false}]),{correct:1,total:2,wrong:1}));

test('ZINOK erantzun-markak laburrak dira, gehigarririk gabe',()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const app=fs.readFileSync(path.join(__dirname,'../jokoak/zinok/app.js'),'utf8');
 const page=fs.readFileSync(path.join(__dirname,'../jokoak/zinok/index.html'),'utf8');
 assert.equal(app.includes('(jokoaren arabera)'),false);
 assert.equal(app.includes('zinok-feedback'),false);
 assert.equal(app.includes("function next(keyboardActivation=false){"),true);
 assert.equal(app.includes('zinok-review-disclosure'),true);
 assert.equal(page.includes('zinok/app.js?v=20261122-zinok6'),true);
 assert.equal(page.includes('areas-support'),false);
});
