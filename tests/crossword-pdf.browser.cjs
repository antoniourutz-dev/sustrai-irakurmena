/* Run with Playwright installed: node tests/crossword-pdf.browser.cjs
 * Synthetic current-day boards only; no Supabase requests or real answer bank in Git.
 * BROWSER_CHANNEL=msedge selects an installed Edge instead of bundled Chromium.
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const authoring=require('../jokoak/gurutzegramak/authoring-generator.cjs');
const repo=path.resolve(__dirname,'..');
const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
const records=[['ikasi',['EKOGRAFIA','HITZORDU','INFEKZIO','SENDAGAI','ONGIZATE','ARTERIA','ORBAIN','TXERTO','SUKAR','ZAURI','EZTUL','NEKE']],
 ['erronka',['GLUKOSA','DIABETES','TRIAJE','BARAURIK','HEMATOMA','ZORABIO','FERRITINA','KONORTE','HEMORRAGIA','LARRIALDI','POTASIO','ZAINKETA']]]
 .map(([mode,words],index)=>({id:date+'-C1-'+mode,play_date:date,mode,level:'C1',status:'pilot',theme_eu:'Froga sintetikoko taula',
  ...authoring.generate(words.map((word,i)=>({id:'TEST-'+index+'-'+i,word,source:'TEST',
    clue:'Pista sintetikoko definizioa '+i,explanation:'Azalpen sintetikoa.'})),121231+index*2021,10)}));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff':'font/woff','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 let file=path.resolve(repo,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(repo+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  for(const width of [1440,320]){
   const page=await browser.newPage({viewport:{width,height:1000},acceptDownloads:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://**/*',route=>route.abort());
   await page.route('**/auth.js?*',route=>route.fulfill({contentType:'text/javascript',body:'window.SustraiCloud={ready:Promise.resolve(),storage:localStorage};'}));
   await page.addInitScript(({date,records})=>localStorage.setItem('sustrai-crossword-daily-cache-'+date+'-v1',JSON.stringify(records)),{date,records});
   await page.goto('http://127.0.0.1:'+server.address().port+'/jokoak/gurutzegramak/');
   for(const mode of ['ikasi','erronka']){
    await page.locator('[data-mode="'+mode+'"]').click();
    // A real solved word, a wrong draft and hints must never leak into the blank PDF.
    const record=records.find(p=>p.mode===mode),word=record.entries[0];
    await page.locator('[data-word="'+word.id+'"]').click();
    await page.locator('#cxWordInput').fill(word.word);await page.locator('[data-action="check"]').click();
    await page.locator('[data-action="next"]').click();
    await page.locator('#cxWordInput').fill('XXXX');await page.locator('[data-action="hint"]').click();
    const before=await page.evaluate(()=>JSON.stringify(localStorage));
    await page.addScriptTag({url:'/jokoak/gurutzegramak/vendor/html2canvas-1.4.1.min.js'});
    await page.evaluate(()=>{
     const original=window.html2canvas;
     window.html2canvas=async(el,options)=>{
      window.pdfEvidence={letters:[...el.querySelectorAll('.cx-cell-letter')].map(x=>x.textContent),
       clues:[...el.querySelectorAll('.cx-clue-copy')].map(x=>x.textContent),
       numbers:[...el.querySelectorAll('.cx-cell-number')].map(x=>x.textContent),
       classes:[...el.querySelectorAll('.cx-cell')].map(x=>x.className),
       columns:getComputedStyle(el.querySelector('.cx-layout')).gridTemplateColumns};
      return original(el,options);
     };
    });
    for(const teacher of [false,true]){
     const pending=page.waitForEvent('download');
     await page.locator('[data-action="pdf-'+(teacher?'teacher':'student')+'"]').click();
     const download=await pending;
     const evidence=await page.evaluate(()=>window.pdfEvidence);
     assert.ok(evidence.letters.every(v=>teacher?v.length===1:v===''));
     assert.deepEqual([...evidence.clues].sort(),record.entries.map(w=>w.clue).sort());
     assert.ok(evidence.columns.split(' ').length===2,'Desktop clue composition even from mobile');
     assert.ok(!evidence.classes.some(c=>/is-active|is-focus|is-wrong/.test(c)));
     const pdf=fs.readFileSync(await download.path()).toString('latin1');
     const box=pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)/);
     assert.ok(box&&Math.abs(Number(box[1])-595.28)<.01&&Math.abs(Number(box[2])-841.89)<.01,'A4 size');
     assert.equal((pdf.match(/\/Type \/Page\b/g)||[]).length,1);
     assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
     await page.waitForFunction(()=>document.querySelectorAll('iframe').length===0);
    }
    // Failure is announced, the frame is cleaned up and the user can retry.
    await page.evaluate(()=>{window.html2canvas=()=>Promise.reject(Error('Froga: PDF errorea'));});
    await page.locator('[data-action="pdf-student"]').click();
    await page.waitForFunction(()=>document.querySelector('.cx-pdf-status').textContent.includes('Froga: PDF errorea'));
    assert.equal(await page.locator('iframe').count(),0);
    assert.equal(await page.locator('[data-action="pdf-student"]').isEnabled(),true);
    await page.addScriptTag({url:'/jokoak/gurutzegramak/vendor/html2canvas-1.4.1.min.js'});
    const retry=page.waitForEvent('download');await page.locator('[data-action="pdf-student"]').click();await retry;
    page.once('dialog',d=>d.accept());await page.locator('.cx-reset').click();
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('OK: both PDF variants and modes, desktop/320px, partial progress isolation, A4 single page, failure cleanup and retry.');
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
