/* Node 20+: node --test tests/jokoak-teusk.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../jokoak/teusk/core.js');
test('TEUSKren lau sorta eta 0 IDa', () => {
  assert.deepEqual(core.bounds(0), null);
  assert.deepEqual(core.bounds(1), {min:0,max:1000});
  assert.deepEqual(core.bounds(2), {min:1001,max:2000});
  assert.deepEqual(core.bounds(3), {min:2001,max:3000});
  assert.deepEqual(core.bounds(4), {min:3001,max:null});
  assert.throws(() => core.bounds(5));
});
test('Erantzun-gakoak eta distraktoreak balioztatzen dira', () => {
  const good={id:0, question:'Zein?', candidates:['Bai','Ez'],answer:0};
  assert.equal(core.isQuestion(good),true);
  assert.equal(core.isQuestion({...good,answer:2}),false);
  assert.equal(core.isQuestion({...good,candidates:['Bai','Bai']}),false);
  assert.equal(core.isQuestion({...good,question:'  '}),false);
});
test('Jokoaren emaitza aukeratutako galderetan oinarritzen da', () => {
  assert.deepEqual(core.score([{answer:0},{answer:2}],[0,1]),{correct:1,total:2,wrong:1});
});
test('Ausazko ordenak ez du jatorrizko zerrenda aldatzen', () => {
  const original=[1,2,3,4];
  const reordered=core.shuffle(original,()=>0);
  assert.deepEqual(original,[1,2,3,4]);
  assert.equal(new Set(reordered).size,4);
  assert.notDeepEqual(original,reordered);
});
