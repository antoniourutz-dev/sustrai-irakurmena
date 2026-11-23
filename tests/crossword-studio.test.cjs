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
