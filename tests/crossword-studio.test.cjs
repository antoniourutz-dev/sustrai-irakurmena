/* Run with: node --test tests/crossword-studio.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../admin/gurutzegramak/crossword-engine.js');
const samples = [
 'bihotz','odol','birika','arnas','arteria','zain','hezur','azal','ehun',
 'zauri','sabel','nerbio','sukarra','garun','infekzio','gorputz',
 'sudur','orratz','sendatu','arnasketa','odoljario','ebakuntza','hezurdura',
 'giltzurrun','zelula','arteriola','osasun','gaixotasun'
].map((lemma_eu,i)=>({
 code:'TEST-'+i,lemma_eu,definition_eu:'Kontzeptu sanitario baten azalpen didaktiko orokorra, sarrera '+i+'.'
}));
test('normalization removes accents and separators for the crossword', () => {
 assert.equal(engine.normalize('Bihotz-birika'), 'BIHOTZBIRIKA');
 assert.equal(engine.normalize('é'), 'E');
});
test('candidate refuses unusable definitions and ambiguous spaces by default', () => {
 assert.equal(engine.candidate({code:'A',lemma_eu:'odol',definition_eu:'Odolaren definizioa.'}),null);
 assert.equal(engine.candidate({code:'B',lemma_eu:'osasun publikoa',definition_eu:'Kontzeptu medikoa'}),null);
 assert.ok(engine.candidate({code:'B',lemma_eu:'osasun publikoa',definition_eu:'Kontzeptu medikoa'},{phrases:true}));
});
test('generates valid connected boards of several sizes', () => {
 for(const count of [8,10,12]){
   const board=engine.generate(samples,count,{size:21,seed:'reproducible-'+count});
   assert.equal(board.entries.length,count);
   assert.ok(board.grid_rows<=21 && board.grid_cols<=21);
   const cells=engine.validate(board);
   assert.ok([...cells.values()].some(c=>c.ids.length===2),'at least one intersection');
   assert.equal(new Set(board.entries.map(e=>e.word)).size,count);
   for(const entry of board.entries)assert.ok(entry.number>0);
 }
});
test('does not pad a board with invalid or disconnected terms', () => {
 assert.throws(()=>engine.generate(samples.slice(0,2),10),/nahikoa hitz/);
});

const groups = require('../admin/gurutzegramak/studio-groups.js');
test('eight broad areas absorb small specialties', () => {
 assert.equal(groups.GROUPS.length,8);
 assert.ok(groups.GROUPS.find(g=>g.id==='atencion').roots.includes('pediatria'));
 assert.ok(groups.GROUPS.find(g=>g.id==='respiracion').roots.includes('urgencias'));
 assert.ok(groups.GROUPS.find(g=>g.id==='cuerpo').roots.includes('nefrologia'));
 assert.deepEqual(groups.deserialize('cardiologia'),['circulacion']);
});
test('multiselect is serialized within the existing topic-code limit', () => {
 const selection=['circulacion','respiracion','prevencion'];
 const serialized=groups.serialize(selection);
 assert.ok(serialized.length<=120);
 assert.deepEqual(groups.deserialize(serialized),selection);
 assert.equal(groups.serialize(groups.ids()),'all');
 assert.deepEqual(groups.deserialize('all'),groups.ids());
 assert.deepEqual(groups.deserialize('category:irakaskuntza'),groups.ids());
 assert.deepEqual(groups.deserialize('groups:'),[]);
});
test('selected specialties combine their terms without duplicate answers', () => {
 const entries=[
  {code:'A',lemma_eu:'bihotz',definition_eu:'Organo baten azalpen didaktiko orokorra.'},
  {code:'B',lemma_eu:'birika',definition_eu:'Organo baten azalpen didaktiko orokorra.'},
  {code:'C',lemma_eu:'bihotz',definition_eu:'Organo baten beste azalpen didaktikoa.'},
  {code:'D',lemma_eu:'zain',definition_eu:'Gorputzaren osagai baten azalpena.'}
 ];
 const assignments=[
  {entry_code:'A',specialty_code:'cardiologia.arritmias',review_state:'suggested'},
  {entry_code:'B',specialty_code:'neumologia',review_state:'suggested'},
  {entry_code:'C',specialty_code:'hematologia',review_state:'suggested'},
  {entry_code:'D',specialty_code:'farmacia',review_state:'suggested'}
 ];
 const circulation=groups.eligible(entries,assignments,['circulacion'],engine.candidate);
 assert.equal(circulation.length,1);
 const union=groups.eligible(entries,assignments,['circulacion','respiracion'],engine.candidate);
 assert.deepEqual(union.map(e=>e.code),['A','B']);
 assert.equal(groups.eligible(entries,assignments,[],engine.candidate).length,0);
 const all=groups.eligible(entries,assignments,groups.ids(),engine.candidate);
 assert.equal(all.length,3);
});
