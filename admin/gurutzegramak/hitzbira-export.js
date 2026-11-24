/* HitzBira crossword handouts. Self-contained A4 PDF and editable DOCX; no student answers in student files. */
(function (scope, factory) {
  const api=factory();
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(scope)scope.HitzBiraStudioExport=api;
})(typeof window!=='undefined'?window:undefined,function(){
  'use strict';
  const AQUA='00A6C8',INK='193B4C',MUTED='596B77',PALE='EFF8FA',GREEN='176A52';
  const BASE='/jokoak/gurutzegramak/vendor/';
  const safe=v=>String(v??'');
  const escapeHtml=v=>safe(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=v=>safe(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,58)||'gurutzegrama';
  let busy=false,libPdf,libWord;
  function context(options){
    const p=options.puzzle||{},teacher=!!options.teacher;
    const topics=Array.isArray(options.topics)?options.topics.map(safe).filter(Boolean):[];
    const subject=topics.join(' · ')||safe(p.theme_eu||'Osasun-hiztegia');
    const title=safe(p.theme_eu||'Gurutzegrama');
    const date=/^\d{4}-\d{2}-\d{2}$/.test(p.play_date||'')?p.play_date:'';
    const type=teacher?'IRAKASLEAREN GIDA':'IKASLEAREN FITXA';
    const file='HitzBira-Gurutzegrama-'+(date?date+'-':'')+slug(subject)+'-'+(teacher?'irakaslea':'ikaslea');
    const code='HB-GUR-'+(date?date.replace(/-/g,''):'FITXA');
    return {subject,title,date,type,file,code,teacher,count:(options.words||[]).length};
  }
  function waitScript(path,test){
    if(test())return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const el=document.createElement('script');el.src=path;
      el.onload=()=>test()?resolve():reject(Error('Ezin izan da dokumentuaren liburutegia abiarazi.'));
      el.onerror=()=>{el.remove();reject(Error('Ezin izan da esportazio-liburutegia kargatu.'));};
      document.head.append(el);
    });
  }
  async function pdfReady(){
    if(!libPdf)libPdf=Promise.all([
      waitScript(BASE+'html2canvas-1.4.1.min.js',()=>!!window.html2canvas),
      waitScript(BASE+'jspdf-4.2.1.umd.min.js',()=>!!window.jspdf?.jsPDF)
    ]).catch(err=>{libPdf=null;throw err;});
    return libPdf;
  }
  async function wordReady(){
    if(!libWord)libWord=waitScript(BASE+'docx-9.6.1.js',()=>!!window.docx)
      .catch(err=>{libWord=null;throw err;});
    return libWord;
  }
  function buildWord(options,d,fonts=[]){
    const meta=context(options),p=options.puzzle;
    const {Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,
      TableLayoutType,AlignmentType,VerticalAlign,HeightRule,LineRuleType,Header,Footer,PageNumber}=d;
    const no={style:BorderStyle.NIL,size:0,color:'FFFFFF'};
    const border={style:BorderStyle.SINGLE,size:5,color:'C8DFE6'};
    const four=b=>({top:b,bottom:b,left:b,right:b});
    const none={...four(no),insideHorizontal:no,insideVertical:no};
    const run=(v,props={})=>new TextRun({text:safe(v),font:'Arial',size:19,color:INK,...props});
    const paragraph=(children,props={})=>new Paragraph({children:Array.isArray(children)?children:[run(children)],
      spacing:{before:0,after:130},...props});
    const centered=(v,size,bold=false,color=INK)=>paragraph([run(v,{size,bold,color})],{
      alignment:AlignmentType.CENTER,spacing:{before:0,after:130}});
    const cw=10540,brandLeft=7900,brandRight=cw-brandLeft;
    const headerCell=(w,children,fill)=>new TableCell({
      width:{size:w,type:WidthType.DXA},borders:four(no),shading:fill?{fill}:undefined,
      margins:{top:75,bottom:70,left:170,right:170},verticalAlign:VerticalAlign.CENTER,children
    });
    const header=new Header({children:[new Table({width:{size:cw,type:WidthType.DXA},
      columnWidths:[brandLeft,brandRight],layout:TableLayoutType.FIXED,borders:none,
      rows:[new TableRow({children:[
        headerCell(brandLeft,[paragraph([run('HitzBira',{font:'Arial',size:32,bold:true,color:'FFFFFF'})],
          {spacing:{after:5}}),
          paragraph([run('EUSKARA IKASTEKO PLATAFORMA',{size:10,bold:true,color:'FFFFFF'})],
            {spacing:{after:0}})],AQUA),
        headerCell(brandRight,[paragraph([run(meta.type,{size:17,bold:true,color:'FFFFFF'})],
          {alignment:AlignmentType.RIGHT,spacing:{after:0}})],AQUA)
      ]}),
      new TableRow({children:[
        headerCell(brandLeft,[paragraph([run(meta.code,{size:10,color:MUTED})],{spacing:{after:0}})]),
        headerCell(brandRight,[paragraph([run('',{size:10})],
          {alignment:AlignmentType.RIGHT,spacing:{after:0}})])
      ]})]})]});
    const footer=new Footer({children:[paragraph([
      run('HitzBira',{size:12,color:MUTED}),run('  ·  ',{size:12,color:MUTED}),
      new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:12,color:MUTED})
    ],{alignment:AlignmentType.RIGHT,spacing:{after:0}})]});
    // Reference model: a wide board above full-width horizontal and vertical clues.
    // Each square remains a real editable Word table cell.
    const clueChars=(options.words||[]).reduce((n,w)=>n+safe(w.clue).length,0);
    const boardHeightLimit=Math.max(6900,9600-Math.max(0,(options.words||[]).length-10)*200-
      Math.max(0,clueChars-680)*2);
    const size=Math.min(515,Math.floor((cw-160)/p.grid_cols),
      Math.floor(boardHeightLimit/p.grid_rows));
    if(size<285)throw Error('Gurutzegramaren lauki-sarea handiegia da Wordeko A4rako.');
    const numLine=Math.max(95,Math.min(133,Math.floor(size*0.28)));
    const glyphLine=Math.max(120,Math.min(220,Math.floor(size*0.48)));
    const numberLine=n=>new Paragraph({children:[run(n?String(n):'',
      {size:12,bold:true,color:MUTED})],
      spacing:{before:0,after:0,line:numLine,lineRule:LineRuleType.EXACT}});
    const letterLine=ch=>new Paragraph({children:[run(ch,{
      font:'Arial',size:Math.min(22,Math.max(15,Math.floor(size/20))),bold:true,
      color:GREEN})],alignment:AlignmentType.CENTER,
      spacing:{before:0,after:0,line:glyphLine,lineRule:LineRuleType.EXACT}});
    const rows=Array.from({length:p.grid_rows},(_,r)=>new TableRow({
      cantSplit:true,height:{value:size,rule:HeightRule.EXACT},
      children:Array.from({length:p.grid_cols},(_,c)=>{
        const value=options.cells.get(r+','+c),active=!!value;
        return new TableCell({
          width:{size,type:WidthType.DXA},borders:four(active?border:no),
          margins:{top:0,bottom:0,left:19,right:19},
          shading:{fill:active&&meta.teacher?'E8F6F0':'FFFFFF'},
          verticalAlign:VerticalAlign.TOP,
          children:[numberLine(value?.number||''),
            letterLine(active&&meta.teacher?value.letter:'')]
        });
      })
    }));
    const board=new Table({width:{size:size*p.grid_cols,type:WidthType.DXA},
      columnWidths:Array(p.grid_cols).fill(size),
      alignment:AlignmentType.CENTER,layout:TableLayoutType.FIXED,
      borders:none,rows});
    const body=[
      paragraph([run(meta.subject,{size:30,bold:true,color:INK})],{
        alignment:AlignmentType.CENTER,
        spacing:{before:0,after:120},keepNext:true}),
      board
    ];
    for(const [direction,heading] of [['H','Horizontalak'],['V','Bertikalak']]){
      body.push(paragraph([run(heading,{size:19,bold:true,color:AQUA})],{
        spacing:{before:direction==='H'?85:120,after:45},keepNext:true}));
      const entries=(options.words||[]).filter(w=>w.dir===direction)
        .sort((x,y)=>x.number-y.number);
      for(const w of entries){
        body.push(paragraph([
          run(w.number+'. ',{size:17,bold:true,color:AQUA}),
          run(w.clue,{size:17,color:INK}),
          run(' ('+w.word.length+')',{size:15,color:MUTED}),
          ...(meta.teacher?[run(' · '+w.word,{size:16,bold:true,color:GREEN})]:[])
        ],{spacing:{before:0,after:50,line:207},keepLines:true}));
      }
    }

    return new d.Document({
      creator:'HitzBira',title:'HitzBira · '+meta.subject,subject:meta.subject,
      description:meta.type,fonts:[],
      styles:{default:{document:{run:{font:'Arial',size:17,color:INK},
        paragraph:{spacing:{after:100}}}}},
      sections:[{properties:{page:{size:{width:11906,height:16838},
        margin:{top:1200,bottom:560,left:685,right:685,header:250,footer:340}}},
        headers:{default:header},footers:{default:footer},children:body}]
    });
  }
  function pdfStyles(){
    return [
      '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#193B4C;font-family:Arial,Helvetica,sans-serif}',
      '.hb-sheet{width:794px;height:1123px;position:relative;overflow:hidden;background:#fff;padding:0 40px 52px}',
      '.hb-bar{height:64px;margin:0 -40px;display:flex;justify-content:space-between;align-items:center;padding:10px 40px;background:#00A6C8;color:white}',
      '.hb-brand{font-size:29px;font-weight:900;line-height:1}.hb-brand small{display:block;font-size:9px;letter-spacing:.05em;margin-top:4px;font-weight:700}',
      '.hb-header-kind{font-weight:800;font-size:14px;letter-spacing:.02em}',
      '.hb-meta{display:flex;justify-content:space-between;font-size:10px;color:#60727d;padding-top:7px}',
      '.hb-content{padding-top:15px}',
      '.hb-subject{text-align:center;font-size:25px;line-height:1.18;font-weight:800;color:#193B4C;margin:0 0 21px;overflow-wrap:anywhere}',
      '.hb-work-layout{display:grid;grid-template-columns:minmax(0,53%) minmax(0,1fr);gap:18px;align-items:start}',
      '.hb-board-side{min-width:0}',
      '.hb-board{display:grid;gap:0;width:max-content;max-width:100%;margin:0 auto}',
      '.hb-cell{position:relative;border:1px solid #aac7d0;background:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#176A52}',
      '.hb-cell.is-empty{border:1px solid transparent;background:white}',
      '.hb-cell.is-solved{background:#e8f6f0}.hb-cell small{position:absolute;top:1px;left:2px;font-size:7px;line-height:1;color:#4b6978}',
      '.hb-clues-side{min-width:0;overflow:hidden}',
      '.hb-clues-side h3,.hb-clue-column h3{font-size:14px;line-height:1.25;color:#0097b5;margin:0 0 9px;font-weight:800;padding-bottom:6px;border-bottom:2px solid #d9edf2}',
      '.hb-clues-side section+section{margin-top:15px}',
      '.hb-clue{font-size:12px;line-height:1.34;color:#193B4C;margin:0 0 10px;overflow-wrap:anywhere}',
      '.hb-clue-no{font-weight:800;color:#0096b5}.hb-clue-length{color:#667b87;font-size:10px}',
      '.hb-answer{color:#176A52;font-size:11px;font-weight:800}',
      '.hb-dense .hb-clue{font-size:11.3px;margin-bottom:7px;line-height:1.29}',
      '.hb-dense .hb-clues-side h3{font-size:13px;margin-bottom:6px}',
      '.hb-dense .hb-clues-side section+section{margin-top:9px}',
      '.hb-dense .hb-answer{font-size:10px}',
      '.hb-footer{position:absolute;bottom:22px;right:40px;color:#72838c;font-size:11px}',
      '.hb-clues-title{font-size:22px;font-weight:800;color:#00A6C8;margin:0 0 20px}',
      '.hb-clues-zone{height:835px;display:grid;grid-template-columns:1fr 1fr;gap:32px;overflow:hidden}',
      '.hb-clue-column{min-width:0;max-height:835px;overflow:hidden}',
      '.hb-clue-column h3{margin-bottom:13px}'
    ].join('\n');
  }
  function pdfShell(doc,meta,pageNumber){
    const sheet=doc.createElement('section');sheet.className='hb-sheet'+(meta.count>=12?' hb-dense':'');
    sheet.innerHTML='<div class="hb-bar"><div class="hb-brand">HitzBira'+
      '<small>EUSKARA IKASTEKO PLATAFORMA</small></div>'+
      '<div class="hb-header-kind">'+escapeHtml(meta.type)+'</div></div>'+
      '<div class="hb-meta"><span>'+escapeHtml(meta.code)+'</span></div>'+
      '<main class="hb-content"></main><footer class="hb-footer">HitzBira&nbsp; · &nbsp;'+
      pageNumber+'</footer>';
    doc.body.append(sheet);
    return sheet;
  }
  function pdfBoard(doc,options,meta){
    const p=options.puzzle,sheet=pdfShell(doc,meta,1);
    const main=sheet.querySelector('.hb-content');
    main.innerHTML='<h1 class="hb-subject">'+escapeHtml(meta.subject)+'</h1>'+
      '<div class="hb-work-layout"><div class="hb-board-side"></div>'+
      '<aside class="hb-clues-side"></aside></div>';
    const holder=main.querySelector('.hb-board-side');
    const size=Math.max(13,Math.min(30,
      Math.floor((holder.clientWidth-4)/p.grid_cols),
      Math.floor(815/p.grid_rows)));
    const grid=doc.createElement('div');grid.className='hb-board';
    grid.style.gridTemplateColumns='repeat('+p.grid_cols+','+size+'px)';
    grid.style.gridAutoRows=size+'px';
    for(let r=0;r<p.grid_rows;r++)for(let c=0;c<p.grid_cols;c++){
      const cell=options.cells.get(r+','+c);
      const box=doc.createElement('div');
      box.className='hb-cell'+(!cell?' is-empty':meta.teacher?' is-solved':'');
      if(cell){
        if(cell.number){const n=doc.createElement('small');n.textContent=cell.number;box.append(n);}
        if(meta.teacher)box.append(doc.createTextNode(cell.letter));
      }
      grid.append(box);
    }
    holder.append(grid);
    const side=main.querySelector('.hb-clues-side');
    side.style.height=Math.max(170,Math.floor(
      sheet.getBoundingClientRect().bottom-side.getBoundingClientRect().top-66))+'px';
    const horizontal=(options.words||[]).filter(w=>w.dir==='H').sort((a,b)=>a.number-b.number);
    const vertical=(options.words||[]).filter(w=>w.dir==='V').sort((a,b)=>a.number-b.number);
    const a=fillClueSection(doc,side,'Horizontalak',horizontal,0,meta);
    const b=fillClueSection(doc,side,'Bertikalak',vertical,0,meta);
    if(grid.scrollWidth>holder.clientWidth+1||sheet.scrollHeight>sheet.clientHeight+1)
      throw Error('Taula ez da A4 orrian sartzen.');
    return {sheet,a,b};
  }
  function clueElement(doc,w,meta){
    const el=doc.createElement('p');el.className='hb-clue';
    el.innerHTML='<span class="hb-clue-no">'+w.number+'. </span>'+
      escapeHtml(w.clue)+' <span class="hb-clue-length">('+w.word.length+')</span>'+
      (meta.teacher?' <span class="hb-answer">· '+escapeHtml(w.word)+'</span>':'');
    return el;
  }
  function fillClueSection(doc,side,title,words,start,meta){
    if(start>=words.length)return start;
    const section=doc.createElement('section');
    const heading=doc.createElement('h3');heading.textContent=title;
    section.append(heading);
    side.append(section);
    let pos=start;
    for(;pos<words.length;pos++){
      const item=clueElement(doc,words[pos],meta);
      section.append(item);
      if(side.scrollHeight>side.clientHeight+1){item.remove();break;}
    }
    if(pos===start)section.remove();
    return pos;
  }
  function pdfClues(doc,options,meta,startA=0,startB=0){
    const horizontal=(options.words||[]).filter(w=>w.dir==='H').sort((a,b)=>a.number-b.number);
    const vertical=(options.words||[]).filter(w=>w.dir==='V').sort((a,b)=>a.number-b.number);
    let a=startA,b=startB,pageNo=2;
    const sheets=[];
    while(a<horizontal.length||b<vertical.length){
      const sheet=pdfShell(doc,meta,pageNo++);
      const main=sheet.querySelector('.hb-content');
      main.innerHTML='<h2 class="hb-clues-title">Pistak</h2>'+
        '<div class="hb-clues-zone"><section class="hb-clue-column">'+
        '<h3>Horizontalak</h3></section><section class="hb-clue-column">'+
        '<h3>Bertikalak</h3></section></div>';
      const cols=main.querySelectorAll('.hb-clue-column'),startPosA=a,startPosB=b;
      for(;a<horizontal.length;a++){
        const item=clueElement(doc,horizontal[a],meta);cols[0].append(item);
        if(cols[0].scrollHeight>cols[0].clientHeight+1){item.remove();break;}
      }
      for(;b<vertical.length;b++){
        const item=clueElement(doc,vertical[b],meta);cols[1].append(item);
        if(cols[1].scrollHeight>cols[1].clientHeight+1){item.remove();break;}
      }
      if(a===startPosA&&b===startPosB){
        sheet.remove();throw Error('Pista luzeegia da PDF orrialdean sartzeko.');
      }
      sheets.push(sheet);
    }
    return sheets;
  }
  async function downloadPdf(options,meta){
    await pdfReady();
    const iframe=document.createElement('iframe');
    iframe.title='HitzBira PDFa prestatzen';iframe.setAttribute('aria-hidden','true');iframe.tabIndex=-1;
    iframe.style.cssText='position:fixed;left:-100000px;top:0;border:0;width:794px;height:1123px;pointer-events:none';
    document.body.append(iframe);
    try{
      const doc=iframe.contentDocument;doc.documentElement.lang='eu';
      const style=doc.createElement('style');style.textContent=pdfStyles();doc.head.append(style);
      const first=pdfBoard(doc,options,meta);
      const pages=[first.sheet,...pdfClues(doc,options,meta,first.a,first.b)];
      await doc.fonts.ready;
      const pdf=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
      pdf.setProperties({title:'HitzBira · '+meta.subject,author:'HitzBira',subject:meta.type});
      for(let i=0;i<pages.length;i++){
        // Render each sheet at the top of the isolated document; otherwise html2canvas
        // can crop pages that happen to be below the iframe's first viewport.
        doc.body.replaceChildren(pages[i]);
        await new Promise(resolve=>iframe.contentWindow.requestAnimationFrame(
          ()=>iframe.contentWindow.requestAnimationFrame(resolve)));
        if(i)pdf.addPage();
        const canvas=await window.html2canvas(pages[i],{scale:2,backgroundColor:'#FFFFFF',
          width:794,height:1123,windowWidth:794,windowHeight:1123,scrollX:0,scrollY:0,logging:false});
        pdf.addImage(canvas,'PNG',0,0,210,297,undefined,'FAST');
      }
      await pdf.save(meta.file+'.pdf',{returnPromise:true});
    }finally{iframe.remove();}
  }
  async function downloadWord(options,meta){
    const d=await wordReady().then(()=>window.docx);
    const blob=await d.Packer.toBlob(buildWord(options,d,[]));
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=meta.file+'.docx';
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  async function download(action,options){
    if(busy)return;
    if(!options||!options.puzzle||!options.cells||!options.words)throw Error('Gurutzegramaren datuak falta dira.');
    const meta=context({...options,teacher:action.endsWith('teacher')});
    const prepared={...options,teacher:meta.teacher};
    const type=action.startsWith('pdf-')?'pdf':'word';
    const root=options.root,buttons=[...root.querySelectorAll('[data-action^="'+type+'-"]')];
    const statusNode=root.querySelector(type==='pdf'?'.cx-pdf-status':'.cx-word-status');
    const status=message=>{if(statusNode)statusNode.textContent=message;};
    busy=true;buttons.forEach(b=>b.disabled=true);status('HitzBira dokumentua prestatzen…');
    try{
      if(type==='pdf')await downloadPdf(prepared,meta);
      else await downloadWord(prepared,meta);
      status('HitzBira dokumentua deskargatu da.');
    }catch(error){
      console.error('HitzBira handout export:',error);
      status(error?.message||'Ezin izan da dokumentua sortu.');
    }finally{busy=false;buttons.forEach(b=>b.disabled=false);}
  }
  return Object.freeze({context,buildWord,download});
});
