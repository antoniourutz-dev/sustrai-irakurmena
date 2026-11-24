/* HITZ-DROP · relation candidates sourced from the existing Lexikoa vocabulary.
   The presence of a result lemma in Supabase does not, by itself, certify the morphological analysis.
   Keep this pilot catalog separate from the general dictionary and do not auto-concatenate arbitrary affixes.
*/
(() => {
  'use strict';
  const raw = [
    // base, visible affix, resulting lemma, type, short Spanish gloss
    ['EGON','-KOR','EGONKOR','suffix','estable'],
    ['EGONKOR','-TASUN','EGONKORTASUN','suffix','estabilidad'],
    ['EGONKOR','-TU','EGONKORTU','suffix','estabilizar(se)'],
    ['SAKON','-DU','SAKONDU','suffix','profundizar'],
    ['SAKON','-TASUN','SAKONTASUN','suffix','profundidad'],
    ['ARGI','-TU','ARGITU','suffix','aclarar(se)'],
    ['ARGI','-TASUN','ARGITASUN','suffix','claridad'],
    ['GARBI','-TU','GARBITU','suffix','limpiar'],
    ['SENDO','-TU','SENDOTU','suffix','fortalecer(se)'],
    ['SENDO','-TASUN','SENDOTASUN','suffix','solidez'],
    ['ZABAL','-DU','ZABALDU','suffix','abrir / extender'],
    ['EGOKI','-TU','EGOKITU','suffix','adaptar(se)'],
    ['EGOKI','-TASUN','EGOKITASUN','suffix','idoneidad'],
    ['DES-','EGIN','DESEGIN','prefix','deshacer'],
    ['BERR-','IKUSI','BERRIKUSI','prefix','revisar'],
    ['BER-','PIZTU','BERPIZTU','prefix','revivir'],
    ['BERR-','ERABILI','BERRERABILI','prefix','reutilizar'],
    ['BERR-','ESKURATU','BERRESKURATU','prefix','recuperar'],
    ['BIR-','ZIKLATU','BIRZIKLATU','prefix','reciclar'],
    ['DES-','OREKA','DESOREKA','prefix','desequilibrio'],
    ['DES-','OREKATU','DESOREKATU','prefix','desequilibrar'],
    ['DES-','ABANTAILA','DESABANTAILA','prefix','desventaja'],
    ['DES-','ADOSTASUN','DESADOSTASUN','prefix','desacuerdo'],
    ['DES-','INFORMAZIO','DESINFORMAZIO','prefix','desinformación'],
    ['DES-','ITXURATU','DESITXURATU','prefix','deformar'],
    ['EZ-','OHIKO','EZOHIKO','prefix','inusual']
  ];
  const candidates = raw.map(([left,right,result,type,gloss]) => ({
    left, right, result, type, gloss, definitionEu: '', recordedInBank: false
  }));
  const normalize = value => String(value || '').trim().toLocaleUpperCase('eu');
  async function load(cloud) {
    const client = cloud && typeof cloud.client === 'function' ? cloud.client() : null;
    if (!client) return { entries: candidates.slice(), origin: 'pilot-fallback', matches: 0 };
    const results = [...new Set(candidates.map(x => x.result.toLocaleLowerCase('eu')))];
    try {
      const [lex,verbs] = await Promise.all([
        client.from('lexiko_sarrerak')
          .select('lema,glosa_es,definizio_didaktikoa_eu,berrikusi_behar_da')
          .in('lema',results).limit(150),
        client.from('sustrai_aditz_definizioak')
          .select('aditza,definizioa_eu,argitalpen_egoera')
          .in('aditza',results).limit(150)
      ]);
      if (lex.error && verbs.error) throw new Error('Lexikoa ezin izan da kontsultatu');
      const evidence = new Map();
      for (const row of (lex.data || [])) {
        const key=normalize(row.lema);
        const earlier=evidence.get(key);
        if (!earlier || (earlier.reviewFlag && !row.berrikusi_behar_da))
          evidence.set(key,{ definitionEu: row.definizio_didaktikoa_eu || '', gloss: row.glosa_es || '', reviewFlag: !!row.berrikusi_behar_da });
      }
      for (const row of (verbs.data || [])) {
        if (/^EZ ARGITARATU/i.test(String(row.argitalpen_egoera || ''))) continue;
        const key=normalize(row.aditza);
        if (!evidence.has(key))
          evidence.set(key,{ definitionEu: row.definizioa_eu || '', gloss: '', reviewFlag: true });
      }
      const entries=candidates.filter(x=>evidence.has(normalize(x.result))).map(x=>{
        const item=evidence.get(normalize(x.result));
        return { ...x, recordedInBank:true,
          definitionEu:String(item.definitionEu || '').slice(0,180),
          gloss:item.gloss || x.gloss,
          reviewFlag:item.reviewFlag };
      });
      if (entries.filter(x=>x.type==='prefix').length<4 || entries.filter(x=>x.type==='suffix').length<6)
        return { entries: candidates.slice(), origin:'pilot-fallback',matches:evidence.size };
      return { entries, origin:'supabase-results', matches:entries.length };
    } catch {
      return { entries:candidates.slice(), origin:'pilot-fallback', matches:0 };
    }
  }
  window.HitzDropCatalog = { candidates, load };
})();