/* SUSTRAI · one human name for every exam session, everywhere (catalog, workshops, Nire espazioa).
   The published data mixes formats («04/05/2019», «2022-05-07», «IVAP 2014/1 · A eredua»,
   «habe · 2010 · I. deialdia»); the exam id is regular, so the name is built from it:
     IVAP 2019-05-04          → «2019ko maiatzeko deialdia»
     IVAP 2023-10-28-modelo   → «2023ko urriko deialdia · moldatutako eredua»
     IVAP 2014-1              → «2014ko 1. deialdia»
     HABE habe-2022-II / 2022-II → «2022ko 2. deialdia»
   SustraiExamName.name(organism, id, fallback) and .year(id). */
(() => {
  'use strict';
  const MONTH = ['urtarrileko', 'otsaileko', 'martxoko', 'apirileko', 'maiatzeko', 'ekaineko',
    'uztaileko', 'abuztuko', 'iraileko', 'urriko', 'azaroko', 'abenduko'];
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };

  // Basque year suffix follows how the number is read: …1 (bat), …5 (bost), …10 (hamar),
  // …15 (hamabost) and their +20 forms end in a consonant and take «-eko»; the rest take «-ko».
  function yearKo(year) {
    const n = Number(year) % 100;
    return year + ([1, 5, 10, 15].includes(n % 20) ? 'eko' : 'ko');
  }

  function name(organism, id, fallback) {
    const raw = String(id || '').replace(/^(habe|ivap)-/i, '');
    let m;
    if ((m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:-(.+))?$/))) {
      const month = MONTH[Number(m[2]) - 1];
      const base = month ? yearKo(m[1]) + ' ' + month + ' deialdia' : yearKo(m[1]) + ' deialdia';
      return m[4] ? base + ' · moldatutako eredua' : base;
    }
    if ((m = raw.match(/^(\d{4})-(\d)$/))) return yearKo(m[1]) + ' ' + m[2] + '. deialdia';
    if ((m = raw.match(/^(\d{4})-(I{1,3}|IV)$/))) return yearKo(m[1]) + ' ' + ROMAN[m[2]] + '. deialdia';
    return String(fallback || id || 'Proba');
  }

  function year(id) {
    const m = String(id || '').match(/(\d{4})/);
    return m ? m[1] : '';
  }

  window.SustraiExamName = { name, year, yearKo };
})();
