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
        headerCell(brandRight,[paragraph([run('GURUTZEGRAMA',{size:19,bold:true,color:'FFFFFF'})],
          {alignment:AlignmentType.RIGHT,spacing:{after:0}})],AQUA)
      ]}),
      new TableRow({children:[
        headerCell(brandLeft,[paragraph([run(meta.code,{size:10,color:MUTED})],{spacing:{after:0}})]),
        headerCell(brandRight,[paragraph([run(meta.type,{size:10,bold:true,color:AQUA})],
          {alignment:AlignmentType.RIGHT,spacing:{after:0}})])
      ]})]})]});
    const footer=new Footer({children:[paragraph([
      run('HitzBira',{size:12,color:MUTED}),run('  ·  ',{size:12,color:MUTED}),
      new TextRun({children:[PageNumber.CURRENT],font:'Arial',size:12,color:MUTED})
    ],{alignment:AlignmentType.RIGHT,spacing:{after:0}})]});
    const size=Math.max(330,Math.min(445,Math.floor((cw-800)/p.grid_cols),
      Math.floor(9000/p.grid_rows)));
    const numberLine=(n)=>paragraph([run(n?String(n):'',{size:10,bold:true,color:MUTED})],{
      spacing:{before:0,after:0,line:120,lineRule:LineRuleType.EXACT}});
    const letterLine=(ch)=>paragraph([run(ch,{font:'Arial',size:18,bold:true,color:GREEN})],{
      alignment:AlignmentType.CENTER,spacing:{before:0,after:0,line:205,lineRule:LineRuleType.EXACT}});
    const rows=Array.from({length:p.grid_rows},(_,r)=>new TableRow({
      cantSplit:true,height:{value:size,rule:HeightRule.ATLEAST},
      children:Array.from({length:p.grid_cols},(_,c)=>{
        const value=options.cells.get(r+','+c),active=!!value;
        return new TableCell({width:{size,type:WidthType.DXA},borders:four(active?border:no),
          margins:{top:0,bottom:0,left:16,right:16},
          shading:{fill:active&&meta.teacher?'E8F6F0':'FFFFFF'},
          verticalAlign:VerticalAlign.CENTER,
          children:[numberLine(value?.number||''),letterLine(active&&meta.teacher?value.letter:'')]
        });
      })
    }));
    const board=new Table({width:{size:size*p.grid_cols,type:WidthType.DXA},
      columnWidths:Array(p.grid_cols).fill(size),alignment:AlignmentType.CENTER,
      layout:TableLayoutType.FIXED,borders:none,rows});
    const body=[
      centered('GURUTZEGRAMA · OSASUN-HIZTEGIA',15,true,AQUA),
      centered(meta.subject,27,true,INK),
      centered(meta.title===meta.subject?'Gurutzegrama':meta.title,17,false,MUTED),
      centered(meta.count+' hitz  ·  '+(meta.teacher?'Erantzunak barne':'Osatu taula definizioen laguntzaz'),15,false,MUTED),
      paragraph([run('Osatu gurutzegrama, eta erabili jarraian ageri diren pistak.',
        {size:16,color:INK})],{
        shading:{fill:PALE},indent:{left:180,right:180},
        spacing:{before:130,after:230},alignment:AlignmentType.CENTER}),
      board,
      paragraph([run('HORIZONTALAK  →     BERTIKALAK  ↓',{size:12,bold:true,color:MUTED})],{
        alignment:AlignmentType.CENTER,spacing:{before:230,after:0}}),
      paragraph([run('PISTAK',{font:'Arial',size:28,bold:true,color:AQUA})],{
        spacing:{before:280,after:120},keepNext:true}),
      paragraph([run(meta.subject,{size:16,bold:true,color:INK})],{
        spacing:{before:0,after:260},keepNext:true})
    ];
    const clueColumns=[];
    for(const [direction,heading] of [['H','HORIZONTALAK'],['V','BERTIKALAK']]){
      const column=[paragraph([run(heading,{size:19,bold:true,color:AQUA})],{
        spacing:{before:90,after:170},keepNext:true})];
      const arr=(options.words||[]).filter(x=>x.dir===direction)
        .sort((a,b)=>a.number-b.number);
      if(!arr.length)column.push(paragraph([run('—',{size:16,color:MUTED})]));
      for(const w of arr){
        column.push(paragraph([
          run(String(w.number)+'.  ',{size:17,bold:true,color:AQUA}),
          run(w.clue,{size:17,color:INK}),
          run('  ('+w.word.length+')',{size:14,color:MUTED})
        ],{spacing:{before:0,after:meta.teacher?30:130},keepLines:true}));
        if(meta.teacher)column.push(paragraph([
          run('ERANTZUNA:  ',{size:12,bold:true,color:GREEN}),
          run(w.word,{size:16,bold:true,color:GREEN})
        ],{indent:{left:160},spacing:{after:150},keepLines:true}));
      }
      clueColumns.push(column);
    }
    const sideWidth=Math.floor(cw/2);
    body.push(new Table({width:{size:cw,type:WidthType.DXA},
      columnWidths:[sideWidth,cw-sideWidth],layout:TableLayoutType.FIXED,borders:none,
      rows:[new TableRow({children:[
        new TableCell({width:{size:sideWidth,type:WidthType.DXA},borders:four(no),
          margins:{top:0,bottom:0,left:0,right:225},children:clueColumns[0]}),
        new TableCell({width:{size:cw-sideWidth,type:WidthType.DXA},borders:four(no),
          margins:{top:0,bottom:0,left:225,right:0},children:clueColumns[1]})
      ]})]}));
    if(meta.teacher)body.push(paragraph([run('Irakaslearen erabilerarako: pistak eta erantzunak berrikusi banatu aurretik.',
      {size:12,color:MUTED})],{spacing:{before:220,after:0}}));
    return new d.Document({
      creator:'HitzBira',title:'HitzBira · '+meta.subject,subject:meta.subject,
      description:meta.type,fonts:[],
      styles:{default:{document:{run:{font:'Arial',size:17,color:INK},
        paragraph:{spacing:{after:100}}}}},
      sections:[{properties:{page:{size:{width:11906,height:16838},
        margin:{top:1750,bottom:950,left:685,right:685,header:340,footer:470}}},
        headers:{default:header},footers:{default:footer},children:body}]
    });
  }
  function pdfStyles(){
    return [
      '*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#193B4C;font-family:Arial,Helvetica,sans-serif}',
      '.hb-sheet{width:794px;height:1123px;position:relative;background:#fff;overflow:hidden;padding:0 45px 52px}',
      '.hb-bar{height:75px;margin:0 -45px;display:flex;justify-content:space-between;align-items:center;padding:12px 45px;background:#00A6C8;color:white}',
      '.hb-brand{font-size:29px;font-weight:900;line-height:1}.hb-brand small{display:block;font-size:9px;letter-spacing:.07em;margin-top:5px;font-weight:700}',
      '.hb-header-kind{font-weight:800;font-size:16px;letter-spacing:.04em}',
      '.hb-meta{display:flex;justify-content:space-between;font-size:11px;color:#60727d;padding-top:9px}',
      '.hb-meta strong{color:#0099b8}.hb-content{padding-top:32px}',
      '.hb-eyebrow{font-size:14px;text-transform:uppercase;text-align:center;letter-spacing:.085em;font-weight:800;color:#00A6C8;margin:0 0 13px}',
      '.hb-subject{text-align:center;font-size:26px;line-height:1.17;font-weight:800;letter-spacing:-.02em;margin:0 0 12px;overflow-wrap:anywhere}',
      '.hb-subtitle{text-align:center;color:#637380;font-size:14px;margin:0 0 12px}',
      '.hb-details{text-align:center;color:#526a75;font-size:12px;margin:0 0 20px}',
      '.hb-instruction{background:#eff8fa;text-align:center;border-left:4px solid #00A6C8;font-size:13px;line-height:1.5;padding:12px 14px;margin:0 0 26px}',
      '.hb-board{display:grid;gap:0;width:max-content;max-width:100%;margin:0 auto}',
      '.hb-cell{position:relative;border:1px solid #afcbd3;background:white;display:flex;align-items:center;justify-content:center;font-weight:800;color:#176A52}',
      '.hb-cell.is-empty{border:1px solid transparent;background:white}',
      '.hb-cell.is-solved{background:#e8f6f0}.hb-cell small{position:absolute;top:1px;left:2px;font-size:8px;line-height:1;color:#4b6978}',
      '.hb-board-note{text-align:center;font-size:12px;margin:19px 0;color:#6a7d85}',
      '.hb-footer{position:absolute;bottom:26px;right:45px;color:#72838c;font-size:12px}',
      '.hb-first-heading{font-size:17px;color:#00A6C8;margin:4px 0 10px;font-weight:800}',
      '.hb-clues-title{font-size:23px;font-weight:800;color:#00A6C8;margin:0 0 7px}.hb-clues-subject{font-size:14px;font-weight:700;margin:0 0 23px}',
      '.hb-clues-zone{height:805px;display:grid;grid-template-columns:1fr 1fr;gap:34px;overflow:hidden}',
      '.hb-clue-column{min-width:0;max-height:805px;overflow:hidden}',
      '.hb-clue-column h3{font-size:15px;color:#00A6C8;margin:0 0 17px;padding-bottom:9px;border-bottom:2px solid #d9edf2}',
      '.hb-clue{font-size:13px;line-height:1.45;color:#193B4C;margin:0 0 16px;overflow-wrap:anywhere}',
      '.hb-clue-no{font-weight:800;color:#0096b5}.hb-clue-length{color:#667b87;font-size:11px}',
      '.hb-answer{font-size:11px;color:#176A52;font-weight:800;margin-top:6px}',
      '.hb-clues-footnote{position:absolute;bottom:52px;left:45px;color:#74848d;font-size:10px}'
    ].join('\n');
  }
  function pdfShell(doc,meta,pageNumber){
    const sheet=doc.createElement('section');sheet.className='hb-sheet';
    sheet.innerHTML='<div class="hb-bar"><div class="hb-brand">HitzBira'+
      '<small>EUSKARA IKASTEKO PLATAFORMA</small></div>'+
      '<div class="hb-header-kind">GURUTZEGRAMA</div></div>'+
      '<div class="hb-meta"><span>'+escapeHtml(meta.code)+'</span><strong>'+
        escapeHtml(meta.type)+'</strong></div>'+
      '<main class="hb-content"></main><footer class="hb-footer">HitzBira&nbsp; · &nbsp;'+
      pageNumber+'</footer>';
    doc.body.append(sheet);
    return sheet;
  }
  function pdfBoard(doc,options,meta){
    const p=options.puzzle,sheet=pdfShell(doc,meta,1);
    const main=sheet.querySelector('.hb-content');
    const gridSize=Math.max(19,Math.min(29,
      Math.floor(650/p.grid_cols),Math.floor(570/p.grid_rows)));
    const grid=doc.createElement('div');grid.className='hb-board';
    grid.style.gridTemplateColumns='repeat('+p.grid_cols+','+gridSize+'px)';
    grid.style.gridAutoRows=gridSize+'px';
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
    main.innerHTML='<p class="hb-eyebrow">GURUTZEGRAMA · OSASUN-HIZTEGIA</p>'+
      '<h1 class="hb-subject">'+escapeHtml(meta.subject)+'</h1>'+
      '<p class="hb-subtitle">'+escapeHtml(meta.title===meta.subject?'Gurutzegrama':meta.title)+'</p>'+
      '<p class="hb-details">'+meta.count+' hitz · '+(meta.teacher?'Erantzunak barne':'Ikaslearen ariketa')+'</p>'+
      '<p class="hb-instruction">Osatu taulako hitzak, pistak erabiliz.</p>';
    main.append(grid);
    const note=doc.createElement('p');note.className='hb-board-note';
    note.textContent='→ Horizontalak     ↓ Bertikalak';
    main.append(note);
    if(sheet.scrollHeight>sheet.clientHeight+1)
      throw Error('Gurutzegrama handiegia da orrialdean sartzeko.');
    const horizontal=(options.words||[]).filter(w=>w.dir==='H').sort((a,b)=>a.number-b.number);
    const vertical=(options.words||[]).filter(w=>w.dir==='V').sort((a,b)=>a.number-b.number);
    let a=0,b=0;
    const available=Math.floor(sheet.getBoundingClientRect().bottom-main.getBoundingClientRect().bottom-94);
    if(available>=200){
      const heading=doc.createElement('h2');heading.className='hb-first-heading';
      heading.textContent='PISTAK';
      const zone=doc.createElement('div');zone.className='hb-clues-zone';
      const height=available-40;
      zone.style.height=height+'px';
      zone.innerHTML='<section class="hb-clue-column"><h3>→ HORIZONTALAK</h3></section>'+
        '<section class="hb-clue-column"><h3>↓ BERTIKALAK</h3></section>';
      main.append(heading,zone);
      const cols=zone.querySelectorAll('.hb-clue-column');
      for(const col of cols)col.style.maxHeight=height+'px';
      a=fillClueColumn(doc,cols[0],horizontal,0,meta);
      b=fillClueColumn(doc,cols[1],vertical,0,meta);
      if(!a&&!b){heading.remove();zone.remove();}
      if(sheet.scrollHeight>sheet.clientHeight+1)
        throw Error('Ezin izan dira pistak lehen orrialdean kokatu.');
    }
    return {sheet,a,b};
  }
  function clueElement(doc,w,meta){
    const box=doc.createElement('div');box.className='hb-clue';
    box.innerHTML='<span class="hb-clue-no">'+w.number+'. </span>'+
      escapeHtml(w.clue)+' <span class="hb-clue-length">('+w.word.length+')</span>'+
      (meta.teacher?'<div class="hb-answer">ERANTZUNA: '+escapeHtml(w.word)+'</div>':'');
    return box;
  }
  function fillClueColumn(doc,column,words,pos,meta){
    while(pos<words.length){
      const item=clueElement(doc,words[pos],meta);column.append(item);
      if(column.scrollHeight>column.clientHeight+1){item.remove();break;}
      pos++;
    }
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
      main.innerHTML='<h2 class="hb-clues-title">PISTAK</h2>'+
        '<p class="hb-clues-subject">'+escapeHtml(meta.subject)+'</p>'+
        '<div class="hb-clues-zone"><section class="hb-clue-column">'+
        '<h3>→ HORIZONTALAK</h3></section><section class="hb-clue-column">'+
        '<h3>↓ BERTIKALAK</h3></section></div>';
      const cols=main.querySelectorAll('.hb-clue-column'),startA=a,startB=b;
      a=fillClueColumn(doc,cols[0],horizontal,a,meta);
      b=fillClueColumn(doc,cols[1],vertical,b,meta);
      if(a===startA&&b===startB){sheet.remove();throw Error('Pista luzeegia da PDFaren orrialdean sartzeko.');}
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
