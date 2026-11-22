/* MINTZAKATS · SUSTRAI pilot.
 * Distribution and score ported from antoniourutz-dev/mintzakats:
 * src/utils/weekCycle.ts, src/services/supabase.ts, src/utils/storage.ts.
 * No public leaderboard or writes to partidak / jokalari_egoera.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.MintzakatsCore=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
  'use strict';
  const WEEKDAY=Object.freeze(['Astelehena','Asteartea','Asteazkena','Osteguna','Ostirala','Larunbata','Igandea']);
  const TOTAL_PER_DAY=20;
  function madridDate(date=new Date()){
    // An explicit date string is useful for pure, reproducible tests.
    if(typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date))return date;
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',
      year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const get=k=>parts.find(p=>p.type===k)?.value||'';
    return get('year')+'-'+get('month')+'-'+get('day');
  }
  function moveDate(ymd,days){
    const dt=new Date(ymd+'T12:00:00Z');
    if(Number.isNaN(dt.valueOf()))throw new Error('Data baliogabea');
    dt.setUTCDate(dt.getUTCDate()+days);
    return dt.toISOString().slice(0,10);
  }
  function blockInfo(date=new Date()){
    const today=madridDate(date);
    const d=new Date(today+'T12:00:00Z');
    const index=(d.getUTCDay()+6)%7;
    const monday=moveDate(today,-index);
    const formatted=today.replace(/-/g,'/');
    return {today,weekMondayDateStr:monday,dayIndexInWeek:index,
      dayName:WEEKDAY[index],dayNumberInBlock:index+1,formattedDate:formatted};
  }
  function hashString(s){
    let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function seededRandom(seed){
    let x=seed>>>0;
    return ()=>{
      x=(x+0x6d2b79f5)>>>0;
      let t=Math.imul(x^(x>>>15),1|x);
      t=(t+Math.imul(t^(t>>>7),61|t))^t;
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function shuffle(array,rand){
    const items=[...array];
    for(let i=items.length-1;i>0;i--){
      const j=Math.floor(rand()*(i+1));
      [items[i],items[j]]=[items[j],items[i]];
    }
    return items;
  }
  function validQuestion(row){
    return row&&Number.isSafeInteger(row.id)&&typeof row.question==='string'&&!!row.question.trim()&&
      Array.isArray(row.candidates)&&row.candidates.length===4&&
      row.candidates.every(x=>typeof x==='string'&&!!x.trim())&&
      new Set(row.candidates.map(x=>x.trim())).size===4&&
      Number.isInteger(row.answer)&&row.answer>=0&&row.answer<=3;
  }
  function dailyQuestions(rows,date=new Date()){
    const info=blockInfo(date);
    const valid=rows.filter(validQuestion);
    // 7 × 20 distinct questions are possible only with >= 140 distinct question IDs.
    const ids=new Set(valid.map(q=>q.id));
    if(ids.size<140)throw new Error('Asteko 140 galderak osatzeko datu egiaztatu nahikorik ez dago.');
    const pool=[...new Map(valid.map(q=>[q.id,q])).values()].sort((a,b)=>a.id-b.id);
    const rand=seededRandom(hashString('mintzakats_full_scramble_block_'+info.weekMondayDateStr+'_salt_9381'));
    let weekly=shuffle(pool,rand);
    weekly=shuffle(weekly,rand);
    const slice=weekly.slice(info.dayIndexInWeek*TOTAL_PER_DAY,
      (info.dayIndexInWeek+1)*TOTAL_PER_DAY);
    const byDay=seededRandom(hashString('mintzakats_day_'+info.formattedDate+'_order'));
    return {questions:shuffle(slice,byDay),info};
  }
  function perQuestionScore(isCorrect,responseTimeMs){
    if(!isCorrect)return {basePoints:0,speedBonus:0,totalPoints:0};
    const seconds=Math.max(0,Number(responseTimeMs)||0)/1000;
    const total=Math.round(40+10*Math.exp(-seconds/8));
    return {basePoints:40,speedBonus:Math.max(0,total-40),totalPoints:total};
  }
  function scoreGame(answers){
    const s=answers.reduce((acc,a)=>{
      if(a?.correct)acc.correct++;
      acc.totalPoints+=Number(a?.points)||0;
      acc.speedBonus+=Number(a?.speedBonus)||0;
      return acc;
    },{correct:0,totalPoints:0,speedBonus:0});
    return {...s,total:answers.length,wrong:answers.length-s.correct};
  }
  function consecutiveDays(records,asOf=new Date()){
    const dates=new Set(records.filter(r=>r?.completed===true&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).map(r=>r.date));
    const today=madridDate(asOf);
    let d=dates.has(today)?today:moveDate(today,-1);
    let streak=0;
    while(dates.has(d)&&streak<9999){streak++;d=moveDate(d,-1);}
    return streak;
  }
  function personalBest(records){
    return records.filter(r=>r?.completed===true)
      .reduce((best,r)=>Math.max(best,Number(r?.score?.totalPoints)||0),0);
  }
  return Object.freeze({WEEKDAY,TOTAL_PER_DAY,madridDate,moveDate,blockInfo,dailyQuestions,
    validQuestion,perQuestionScore,scoreGame,consecutiveDays,personalBest});
});
