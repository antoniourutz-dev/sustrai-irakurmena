/* node --test tests/jokoak-zinok.test.cjs */
const {test}=require('node:test');const assert=require('node:assert/strict');
const z=require('../jokoak/zinok/core.js');
const rows=Array.from({length:20},(_,i)=>({id:'id'+i,source_id:'1-'+i,hitza:'hitz'+i,sinonimoak:['pare'+i],level:1,part:1,active:true}));
test('ZINOKren galderak errepikapen eta aukera bikoizturik gabe',()=>{
 const orig=JSON.stringify(rows);
 const questions=z.quiz(rows,10,()=>.37);
 assert.equal(questions.length,10);
 assert.equal(new Set(questions.map(q=>q.word)).size,10);
 questions.forEach(q=>{assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options[q.correctIndex],q.correctAnswer);});
 assert.equal(JSON.stringify(rows),orig);
});
test('Gakoa eta beste sinonimo batzuk ez dira distraktoreak',()=>{
 const [q]=z.quiz([
  {id:'1',hitza:'Bultzatu',sinonimoak:['Sustatu','Akuilatu'],active:true},
  {id:'2',hitza:'Sustatu',sinonimoak:['Bultzatu'],active:true},
  ...Array.from({length:8},(_,i)=>({id:String(i+3),hitza:'beste'+i,sinonimoak:['pare'+i],active:true}))
 ],1,()=>0.1);
 assert(!q.options.some(x=>x===q.word));
});
test('Irakurketa eta datu-iragazkia',()=>{
 assert.equal(z.isEntry({hitza:'  ',sinonimoak:['x']}),false);
 assert.equal(z.isEntry({hitza:'x',sinonimoak:['x']}),false);
 assert.equal(z.isEntry({hitza:'x',sinonimoak:['y'],active:false}),false);
});
test('Puzzleak balioztatu eta multzokatu',()=>{
 const p={id:'1',esaldia:'Hitz berria bultzatu dugu.',targets:[{klabea:'bultzatu',zuzena:'sustatu',distraktoreak:['utzi','gorde','saldu']}]};
 assert.equal(z.isPuzzle(p),true);
 assert.equal(z.isPuzzle({...p,targets:[{...p.targets[0],klabea:'ez dago'}]}),false);
 assert.equal(z.puzzleGroups(Array.from({length:7},(_,i)=>({...p,id:String(i+1)}))).length,2);
});
test('Puntuazioa ez da nota ofiziala',()=>assert.deepEqual(z.score([{correct:true},{correct:false}]),{correct:1,total:2,wrong:1}));
