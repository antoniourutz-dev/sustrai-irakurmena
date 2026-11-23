/* Native, editable DOCX: real table cells and paragraphs, never a screenshot. */
(() => {
  'use strict';
  function fileBase(puzzle){
    if(!puzzle.is_authoring)return 'HitzBira-'+puzzle.play_date+'-'+puzzle.mode;
    const slug=String(puzzle.theme_eu||'osasuna').normalize('NFD').replace(/\p{M}/gu,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'osasuna';
    return 'SUSTRAI-Gurutzegrama-'+puzzle.play_date+'-'+slug;
  }
  let library,busy=false;
  function ready(){
    if(window.docx)return Promise.resolve(window.docx);
    if(!library)library=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='/jokoak/gurutzegramak/vendor/docx-9.6.1.js';
      script.onload=()=>window.docx?resolve(window.docx):reject(Error('Word tresna ez dago erabilgarri.'));
      script.onerror=()=>{script.remove();reject(Error('Ezin izan da Word tresna kargatu. Saiatu berriro.'));};
      document.head.append(script);
    }).catch(error=>{library=null;throw error;});
    return library;
  }
  async function fonts(){
    return Promise.all(['sans','display'].map(async kind=>{
      const response=await fetch('/fonts/hitzbira-word-'+kind+'.ttf.b64');
      if(!response.ok)throw Error('Ezin izan dira Wordeko letra-tipoak kargatu. Saiatu berriro.');
      const bytes=Uint8Array.from(atob((await response.text()).trim()),ch=>ch.charCodeAt(0));
      return {name:kind==='sans'?'HitzBiraSans':'HitzBiraDisplay',data:bytes};
    }));
  }
  function build({puzzle,cells,words,teacher},d,embeddedFonts=[]){
    const {Document,Paragraph,TextRun,Table,TableRow,TableCell,WidthType,BorderStyle,
      TableLayoutType,AlignmentType,HeightRule,VerticalAlign,LineRuleType,HeadingLevel}=d;
    const colors={ink:'11132B',primary:'3F35C8',muted:'565B78',line:'D9DCEB',green:'075D45',fill:'DDF8EF'};
    const none={style:BorderStyle.NIL,size:0,color:'FFFFFF'};
    const edges=border=>({top:border,bottom:border,left:border,right:border});
    const noBorders={...edges(none),insideHorizontal:none,insideVertical:none};
    const run=(text,options={})=>new TextRun({text:String(text),font:'HitzBiraSans',size:16,color:colors.ink,...options});
    const para=(text,options={})=>new Paragraph({children:[run(text)],spacing:{before:0,after:100},...options});
    const small=(text,options={})=>new Paragraph({children:[run(text,{size:10,color:colors.muted,...options})],
      spacing:{before:0,after:0,line:120,lineRule:LineRuleType.EXACT}});
    const contentWidth=10772,leftWidth=6560,gutter=260,rightWidth=contentWidth-leftWidth-gutter;
    const cellSize=Math.min(340,Math.floor((leftWidth-140)/puzzle.grid_cols));
    const board=new Table({width:{size:cellSize*puzzle.grid_cols,type:WidthType.DXA},
      columnWidths:Array(puzzle.grid_cols).fill(cellSize),layout:TableLayoutType.FIXED,
      alignment:AlignmentType.CENTER,borders:noBorders,margins:{top:0,bottom:0,left:20,right:20},
      rows:Array.from({length:puzzle.grid_rows},(_,r)=>new TableRow({cantSplit:true,
        height:{value:cellSize,rule:HeightRule.ATLEAST},
        children:Array.from({length:puzzle.grid_cols},(_,c)=>{
          const cell=cells.get(r+','+c);
          const border=cell?{style:BorderStyle.SINGLE,size:5,color:teacher?'8FE3C8':colors.line}:none;
          return new TableCell({width:{size:cellSize,type:WidthType.DXA},borders:edges(border),
            margins:{top:0,bottom:0,left:20,right:20},verticalAlign:VerticalAlign.TOP,
            shading:{fill:cell&&teacher?colors.fill:'FFFFFF'},
            children:[small(cell?.number||''),new Paragraph({alignment:AlignmentType.CENTER,
              spacing:{before:0,after:0,line:200,lineRule:LineRuleType.EXACT},
              children:[run(cell&&teacher?cell.letter:'',{font:'HitzBiraDisplay',size:18,bold:true,color:teacher?colors.green:colors.ink})]})]});
        })}))});
    const clueParagraphs=[para('HITZEN GIDA',{children:[run('HITZEN GIDA',{bold:true,size:13,color:colors.primary})]}),
      para('Pistak',{children:[run('Pistak',{font:'HitzBiraDisplay',bold:true,size:25})]})];
    for(const [dir,title] of [['H','Horizontalak'],['V','Bertikalak']]){
      clueParagraphs.push(para(title,{heading:HeadingLevel.HEADING_2,
        children:[run(title,{bold:true,size:17,color:colors.primary})],spacing:{before:180,after:130},keepNext:true}));
      for(const w of [...words].filter(w=>w.dir===dir).sort((a,b)=>a.number-b.number))
        clueParagraphs.push(para('',{children:[run(w.number+'. ',{bold:true,color:colors.primary}),
          run(w.clue),run(' ('+w.word.length+')',{size:14,color:colors.muted}),
          ...(teacher?[run('  '+w.word,{size:15,bold:true,color:colors.green}),run(' · '+w.source,{size:11,color:colors.muted})]:[])],
          spacing:{before:0,after:140,line:230},keepLines:true}));
    }
    const containerCell=(width,children)=>new TableCell({width:{size:width,type:WidthType.DXA},
      margins:{top:120,bottom:120,left:100,right:100},borders:edges(none),children});
    const boardLabel=puzzle.is_authoring?'OSASUN GURUTZEGRAMA':'EGUNEKO TAULA '+puzzle.mode.toUpperCase();
    const layout=new Table({width:{size:contentWidth,type:WidthType.DXA},
      columnWidths:[leftWidth,gutter,rightWidth],layout:TableLayoutType.FIXED,borders:noBorders,
      rows:[new TableRow({children:[containerCell(leftWidth,[
        para(boardLabel,{children:[run(boardLabel,{size:13,bold:true,color:colors.primary})]}),
        para('Gurutzegrama',{children:[run('Gurutzegrama',{font:'HitzBiraDisplay',size:25,bold:true})]}),
        para('Osatu hitz gurutzatuak, definizioen laguntzaz.',{children:[run('Osatu hitz gurutzatuak, definizioen laguntzaz.',{size:15,color:colors.muted})],spacing:{after:180}}),
        board,small('')]),containerCell(gutter,[small('')]),containerCell(rightWidth,clueParagraphs)]})]});
    const date=new Intl.DateTimeFormat('eu-ES',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})
      .format(new Date(puzzle.play_date+'T12:00:00Z'));
    return new Document({creator:'SUSTRAI',title:'Gurutzegrama '+puzzle.play_date,fonts:embeddedFonts,
      description:teacher?'Irakaslearen Worda':'Ikaslearen Worda',
      styles:{default:{document:{run:{font:'HitzBiraSans',size:16,color:colors.ink},paragraph:{spacing:{after:100}}}}},
      sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:567,bottom:567,left:567,right:567}}},
        children:[para('HitzBira SUSTRAI '+(teacher?'Irakaslearen Worda':'Ikaslearen Worda'),{
          children:[run('HitzBira · SUSTRAI · '+(teacher?'Irakaslearen Worda':'Ikaslearen Worda'),{size:15,bold:true,color:colors.primary})]}),
          para(puzzle.theme_eu||'Gurutzegrama',{heading:HeadingLevel.TITLE,
            children:[run(puzzle.theme_eu||'Gurutzegrama',{font:'HitzBiraDisplay',size:28,bold:true})],spacing:{before:100,after:100}}),
          para(date+' · '+(puzzle.mode==='erronka'?'Erronka modua':'Ikasteko modua'),{spacing:{after:240}}),layout]}]});
  }
  async function download(options){
    if(busy)return;
    busy=true;
    // All values are already detached snapshots of the selected dated board.
    const {root,puzzle,teacher}=options;
    const buttons=[...root.querySelectorAll('[data-action^="word-"]')];
    const status=message=>{const el=root.querySelector('.cx-word-status');if(el)el.textContent=message;};
    buttons.forEach(b=>{b.disabled=true;});status('Worda prestatzen…');
    try{
      const [d,embeddedFonts]=await Promise.all([ready(),fonts()]);
      const blob=await d.Packer.toBlob(build(options,d,embeddedFonts));
      const url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=fileBase(puzzle)+'-'+(teacher?'irakaslea':'ikaslea')+'.docx';
      document.body.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      status('Word editagarria deskargatu da.');
    }catch(error){console.error('Crossword Word export:',error);status(error?.message||'Ezin izan da Worda sortu. Saiatu berriro.');}
    finally{busy=false;buttons.forEach(b=>{b.disabled=false;});}
  }
  window.CrosswordWord=Object.freeze({download,build});
})();
