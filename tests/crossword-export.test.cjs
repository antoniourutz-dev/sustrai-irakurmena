/* Verifies production DOCX (native Word) exports, brand, topic names, and answer isolation. */
const test=require('node:test');
const assert=require('node:assert/strict');
const zlib=require('node:zlib');
const fs=require('node:fs');
const vm=require('node:vm');
const vendor=require.resolve('../jokoak/gurutzegramak/vendor/docx-9.6.1.js');
const docx=vm.runInThisContext('(function(){'+fs.readFileSync(vendor,'utf8')+';return docx;})()', {filename:vendor});
const engine=require('../admin/gurutzegramak/crossword-engine.js');
const exportModule=require('../admin/gurutzegramak/hitzbira-export.js');

function xmlEntries(buffer){
  const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert.ok(eocd>=0,'DOCX ZIP end-of-directory not found');
  let offset=buffer.readUInt32LE(eocd+16),count=buffer.readUInt16LE(eocd+10);
  const parts={};
  for(let i=0;i<count;i++){
    assert.equal(buffer.readUInt32LE(offset),0x02014b50);
    const method=buffer.readUInt16LE(offset+10);
    const compressed=buffer.readUInt32LE(offset+20);
    const nameLen=buffer.readUInt16LE(offset+28);
    const extraLen=buffer.readUInt16LE(offset+30);
    const commentLen=buffer.readUInt16LE(offset+32);
    const local=buffer.readUInt32LE(offset+42);
    const name=buffer.subarray(offset+46,offset+46+nameLen).toString();
    const dataOffset=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
    if(name.endsWith('.xml')){
      const bytes=buffer.subarray(dataOffset,dataOffset+compressed);
      parts[name]=(method===8?zlib.inflateRawSync(bytes):bytes).toString('utf8');
    }
    offset+=46+nameLen+extraLen+commentLen;
  }
  return parts;
}
function puzzleOptions(teacher,count=10){
  const words=['bihotz','odol','birika','arnas','arteria','zain','hezur','azal','ehun',
    'zauri','sabel','nerbio','sukarra','garun','infekzio','gorputz','sudur','orratz',
    'sendatu','arnasketa','odoljario','ebakuntza','hezurdura','giltzurrun','zelula',
    'arteriola','osasun','gaixotasun'].map((lemma_eu,i)=>({
      code:'FIXTURE-'+i,lemma_eu,definition_eu:'Kontzeptu honen azalpen didaktiko orokorra '+i+'.'
    }));
  const puzzle=engine.generate(words,count,{size:21,seed:'hitzbira-document-test-'+count,title:'Osasun-hiztegia'});
  puzzle.play_date='2026-11-23';
  const cells=engine.validate(puzzle);
  for(const w of puzzle.entries)cells.get(w.r+','+w.c).number=w.number;
  return {puzzle,cells,words:puzzle.entries,teacher,
    topics:['Bihotza eta zirkulazioa','Arnasketa eta larrialdiak']};
}
test('stable HitzBira filenames and multiple educational topics',()=>{
  const opts=puzzleOptions(false),ctx=exportModule.context(opts);
  assert.equal(ctx.subject,'Bihotza eta zirkulazioa · Arnasketa eta larrialdiak');
  assert.ok(ctx.file.startsWith('HitzBira-Gurutzegrama-'));
  assert.ok(!/sustrai/i.test(JSON.stringify(ctx)));
  assert.equal(ctx.type,'IKASLEAREN FITXA');
  assert.equal(exportModule.context({...opts,teacher:true}).type,'IRAKASLEAREN GIDA');
});
test('student and teacher native Word documents contain HitzBira and only teacher solutions',async()=>{
  const base=puzzleOptions(false);
  const fonts=['sans','display'].map(kind=>({
    name:kind==='sans'?'HitzBiraSans':'HitzBiraDisplay',
    data:Uint8Array.from(Buffer.from(fs.readFileSync(
      require('node:path').join(__dirname,'../fonts/hitzbira-word-'+kind+'.ttf.b64'),'utf8').trim(),'base64'))
  }));
  const studentBuffer=await docx.Packer.toBuffer(exportModule.buildWord(base,docx,fonts));
  const teacherBuffer=await docx.Packer.toBuffer(exportModule.buildWord({...base,teacher:true},docx,fonts));
  if(process.env.HB_EXPORT_FIXTURES==='1'){
    const path=require('node:path').join(__dirname,'export-fixtures');
    fs.mkdirSync(path,{recursive:true});
    fs.writeFileSync(require('node:path').join(path,'HitzBira-gurutzegrama-ikaslea.docx'),studentBuffer);
    fs.writeFileSync(require('node:path').join(path,'HitzBira-gurutzegrama-irakaslea.docx'),teacherBuffer);
  }
  const stu=xmlEntries(studentBuffer);
  const tchr=xmlEntries(teacherBuffer);
  for(const parts of [stu,tchr]){
    assert.match(parts['word/header1.xml'],/HitzBira/);
    assert.match(parts['word/header1.xml'],/EUSKARA IKASTEKO PLATAFORMA/);
    assert.match(parts['word/document.xml'],/Bihotza eta zirkulazioa/);
    assert.match(parts['word/document.xml'],/Arnasketa eta larrialdiak/);
    assert.match(parts['word/footer1.xml'],/HitzBira/);
    assert.ok(!Object.values(parts).some(x=>/SUSTRAI/i.test(x)),'No old brand in Word XML');
  }
  // Export must not retain the old redundant subtitle, instruction or middle legend.
  for(const parts of [stu,tchr]){
    assert.ok(!/GURUTZEGRAMA · OSASUN-HIZTEGIA|HORIZONTALAK  →|Osatu gurutzegrama|Osasun-hiztegia/.test(parts['word/document.xml']));
    assert.ok(!parts['word/document.xml'].includes('PISTAK'));
    assert.match(parts['word/document.xml'],/Horizontalak/);
    assert.match(parts['word/document.xml'],/Bertikalak/);
    assert.match(parts['word/document.xml'],/<w:tbl>/);
  }
  const solved=base.words[0].word;
  assert.ok(!stu['word/document.xml'].includes('·  '+solved));
  assert.ok(tchr['word/document.xml'].includes('·  '+solved));
});

test('15-word student and teacher Word worksheets keep every clue and answer',async()=>{
  for(const teacher of [false,true]){
    const sample=puzzleOptions(teacher,15);
    const bytes=await docx.Packer.toBuffer(exportModule.buildWord(sample,docx,[]));
    const parts=xmlEntries(bytes);
    const xml=parts['word/document.xml'];
    assert.match(xml,/Horizontalak/);
    assert.match(xml,/Bertikalak/);
    for(const word of sample.words){
      // Source clues are copied faithfully; no selected term is silently dropped.
      assert.ok(xml.includes(word.clue),'Missing clue '+word.id);
      if(teacher)assert.ok(xml.includes('·  '+word.word),'Missing teacher solution '+word.id);
    }
    if(process.env.HB_EXPORT_FIXTURES==='1'){
      const path=require('node:path').join(__dirname,'export-fixtures');
      fs.mkdirSync(path,{recursive:true});
      fs.writeFileSync(require('node:path').join(path,
        'HitzBira-15-hitz-'+(teacher?'irakaslea':'ikaslea')+'.docx'),bytes);
    }
  }
});