/* Export the live crossword DOM using its own styles and fonts. No game/storage writes. */
(() => {
  'use strict';
  const BASE='/jokoak/gurutzegramak/';
  let busy=false,dependencies;
  function loadScript(src,available){
    if(available())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=()=>available()?resolve():reject(Error('PDF liburutegia ez dago erabilgarri.'));
      script.onerror=()=>{script.remove();reject(Error('Ezin izan dira PDF tresnak kargatu. Saiatu berriro.'));};
      document.head.append(script);
    });
  }
  function ready(){
    if(!dependencies)dependencies=Promise.all([
      loadScript(BASE+'vendor/html2canvas-1.4.1.min.js',()=>!!window.html2canvas),
      loadScript(BASE+'vendor/jspdf-4.2.1.umd.min.js',()=>!!window.jspdf?.jsPDF)
    ]).catch(error=>{dependencies=null;throw error;});
    return dependencies;
  }
  // Clone the actual rendered component, never a parallel drawing of its grid or clues.
  function snapshot({root,teacher,cells,words}){
    const layout=root.querySelector('.cx-layout').cloneNode(true);
    layout.querySelectorAll('.cx-reset,.cx-answer-card,.cx-legend,.cx-final,.cx-complete').forEach(el=>el.remove());
    layout.querySelector('.cx-board-note').textContent='Osatu hitz gurutzatuak, definizioen laguntzaz.';
    layout.querySelector('.cx-side-head p:last-child').textContent='Definizioak irakurri eta hitzak taulan kokatu.';
    for(const el of layout.querySelectorAll('[data-cell]')){
      const cell=cells.get(el.dataset.cell);
      el.className='cx-cell'+(teacher?' is-solved':'');
      el.querySelector('.cx-cell-letter').textContent=teacher?cell.letter:'';
      // Do not retain typed letters or solved-state accessibility labels in student output.
      el.removeAttribute('aria-label');
      el.removeAttribute('data-cell');
      el.tabIndex=-1;
    }
    const byId=new Map(words.map(w=>[w.id,w]));
    for(const el of layout.querySelectorAll('[data-word]')){
      const w=byId.get(el.dataset.word);
      el.className='cx-clue';
      el.removeAttribute('aria-pressed');
      el.removeAttribute('data-word');
      el.tabIndex=-1;
      el.querySelector('.cx-clue-state,.cx-clue-length')?.remove();
      const length=document.createElement('span');
      length.className='cx-clue-length';length.textContent=w.word.length;
      el.append(length);
    }
    const heading=root.querySelector('.cx-status-intro').cloneNode(true);
    heading.querySelector('.cx-game-count')?.remove();
    heading.querySelector('p')?.remove();
    const label=document.createElement('p');
    label.className='cx-overline';
    label.textContent='HitzBira · SUSTRAI · '+(teacher?'Irakaslearen PDFa':'Ikaslearen PDFa');
    heading.prepend(label);
    return {layout,heading};
  }
  async function download(options){
    if(busy)return;
    busy=true;
    const {root,puzzle,teacher}=options;
    const setStatus=message=>{const el=root.querySelector('.cx-pdf-status');if(el)el.textContent=message;};
    const buttons=[...root.querySelectorAll('[data-action^="pdf-"]')];
    buttons.forEach(b=>{b.disabled=true;});
    setStatus('PDFa prestatzen…');
    let frame;
    try{
      // Freeze the chosen board before any await: gameplay/date changes cannot mix puzzles.
      const copy=snapshot(options);
      await ready();
      frame=document.createElement('iframe');
      frame.title='PDFa prestatzen';frame.setAttribute('aria-hidden','true');
      frame.tabIndex=-1;
      // A stable desktop viewport preserves the two-column app composition on mobile too.
      const width=Math.max(1160,puzzle.grid_cols*45+540);
      frame.style.cssText='position:fixed;left:-100000px;top:0;border:0;width:'+width+'px;height:1800px;pointer-events:none';
      document.body.append(frame);
      const doc=frame.contentDocument;
      doc.documentElement.lang='eu';
      const styles=[...document.querySelectorAll('link[rel="stylesheet"]')];
      await Promise.all(styles.map(link=>new Promise((resolve,reject)=>{
        const clone=doc.createElement('link');clone.rel='stylesheet';clone.href=link.href;
        clone.onload=resolve;clone.onerror=()=>reject(Error('Ezin izan da PDFaren diseinua kargatu.'));
        doc.head.append(clone);
      })));
      doc.body.className='cx-page cx-pdf-body';
      const sheet=doc.createElement('main');sheet.className='cx-pdf-sheet';
      sheet.append(doc.importNode(copy.heading,true),doc.importNode(copy.layout,true));
      doc.body.append(sheet);
      await doc.fonts.ready;
      await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(()=>frame.contentWindow.requestAnimationFrame(resolve)));
      // Prevent hidden overflow (including an unexpectedly wide grid) from silently clipping.
      if(sheet.scrollWidth>sheet.clientWidth+1||[...sheet.querySelectorAll('.cx-grid-scroll,.cx-sidebar')]
        .some(el=>el.scrollWidth>el.clientWidth+1))throw Error('Taula ez da orrian sartzen. Ezin izan da PDF osoa sortu.');
      const canvas=await window.html2canvas(sheet,{scale:3,backgroundColor:'#ffffff',
        windowWidth:width,windowHeight:Math.max(1800,sheet.scrollHeight),scrollX:0,scrollY:0,logging:false});
      const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      const margin=10,scale=Math.min((210-2*margin)/canvas.width,(297-2*margin)/canvas.height);
      const w=canvas.width*scale,h=canvas.height*scale;
      pdf.setProperties({title:'HitzBira · '+puzzle.play_date+' · '+(teacher?'Irakaslearen PDFa':'Ikaslearen PDFa'),author:'SUSTRAI'});
      pdf.addImage(canvas,'PNG',(210-w)/2,margin,w,h,undefined,'FAST');
      await pdf.save('HitzBira-'+puzzle.play_date+'-'+puzzle.mode+'-'+(teacher?'irakaslea':'ikaslea')+'.pdf',{returnPromise:true});
      setStatus('PDFa deskargatu da.');
    }catch(error){
      console.error('Crossword PDF export:',error);
      setStatus(error?.message||'Ezin izan da PDFa sortu. Saiatu berriro.');
    }finally{
      frame?.remove();busy=false;
      buttons.forEach(b=>{b.disabled=false;});
    }
  }
  window.CrosswordPDF=Object.freeze({download});
})();
