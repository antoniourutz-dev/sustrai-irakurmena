/* Run: node --test tests/jokoak-mintzakats.test.cjs */
const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('../jokoak/mintzakats/core.js');
const rows=Array.from({length:141},(_,i)=>({id:i,question:'Galdera '+i,candidates:['A'+i,'B'+i,'C'+i,'D'+i],answer:i%4}));
test('Madrid timezone and 7-day block',()=>{
 assert.equal(m.blockInfo('2026-11-22').dayIndexInWeek,6);
 assert.equal(m.blockInfo('2026-11-22').weekMondayDateStr,'2026-11-16');
 assert.equal(m.moveDate('2026-11-22',1),'2026-11-23');
});
test('All seven days: 20 each, no overlaps, stable same-day order',()=>{
 const seen=new Set();
 for(let offset=0;offset<7;offset++){
  const date=m.moveDate('2026-11-16',offset);
  const a=m.dailyQuestions(rows,date),b=m.dailyQuestions(rows,date);
  assert.equal(a.questions.length,20);
  assert.deepEqual(a.questions.map(x=>x.id),b.questions.map(x=>x.id));
  for(const q of a.questions){assert(!seen.has(q.id));seen.add(q.id)}
 }
 assert.equal(seen.size,140);
});
test('Week changes reshuffle; it does not depend on original order',()=>{
 const day='2026-11-22';
 const a=m.dailyQuestions(rows,day),b=m.dailyQuestions([...rows].reverse(),day);
 assert.deepEqual(a.questions.map(x=>x.id),b.questions.map(x=>x.id));
 assert.notDeepEqual(a.questions.map(x=>x.id),m.dailyQuestions(rows,'2026-11-29').questions.map(x=>x.id));
});
test('Question validation and 140-item guard',()=>{
 assert(m.validQuestion(rows[0]));
 assert.equal(m.validQuestion({...rows[0],answer:4}),false);
 assert.equal(m.validQuestion({...rows[0],candidates:['a','a','b','c']}),false);
 assert.throws(()=>m.dailyQuestions(rows.slice(0,139),'2026-11-22'));
});
test('Scoring matches original Mintzakats speed formula',()=>{
 assert.deepEqual(m.perQuestionScore(false,1000),{basePoints:0,speedBonus:0,totalPoints:0});
 assert.equal(m.perQuestionScore(true,0).totalPoints,50);
 assert.equal(m.perQuestionScore(true,8000).totalPoints,44);
 assert.equal(m.perQuestionScore(true,100000).totalPoints,40);
 assert.deepEqual(m.scoreGame([{correct:true,points:50,speedBonus:10},{correct:false,points:0,speedBonus:0}]),
  {correct:1,totalPoints:50,speedBonus:10,total:2,wrong:1});
});
test('Streak only counts a consecutive completed day; no invented days',()=>{
 const d=['2026-11-19','2026-11-20','2026-11-21'].map(date=>({date,completed:true}));
 assert.equal(m.consecutiveDays(d,'2026-11-22'),3);
 assert.equal(m.consecutiveDays(d,'2026-11-23'),0);
 assert.equal(m.consecutiveDays([...d,{date:'2026-11-22',completed:true}],'2026-11-22'),4);
});
