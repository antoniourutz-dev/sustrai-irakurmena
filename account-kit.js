/* Shared helpers for student space and admin follow-up. */
(() => {
  'use strict';

  const HIDDEN_KEYS = /^(sustrai-markerbar-pos|sustrai-current-exam|sustrai-client-attempt-|sustrai-reading-last|sustrai-oral-last)/;

  // Basque dates written by hand: many browsers ship no 'eu' locale data and fall back to English.
  const EU_MONTHS = ['urtarrilaren', 'otsailaren', 'martxoaren', 'apirilaren', 'maiatzaren', 'ekainaren',
    'uztailaren', 'abuztuaren', 'irailaren', 'urriaren', 'azaroaren', 'abenduaren'];
  const two = (n) => String(n).padStart(2, '0');
  function euDay(d) {
    const day = d.getDate();
    // «azaroaren 17a», «azaroaren 1ean» reads naturally in a list; the article form is the most neutral.
    return EU_MONTHS[d.getMonth()] + ' ' + day + 'a';
  }
  function euDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value || '');
    return d.getFullYear() + 'ko ' + euDay(d) + ', ' + two(d.getHours()) + ':' + two(d.getMinutes());
  }
  // Short, relative form for lists: «gaur, 11:23», «atzo, 10:14», «azaroaren 17a», «2025eko azaroaren 17a».
  function euWhen(value, now = new Date()) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((day(now) - day(d)) / 864e5);
    const time = two(d.getHours()) + ':' + two(d.getMinutes());
    if (diff === 0) return 'gaur, ' + time;
    if (diff === 1) return 'atzo, ' + time;
    if (d.getFullYear() === now.getFullYear()) return euDay(d);
    return d.getFullYear() + 'ko ' + euDay(d);
  }

  /* Reading keys grew over several releases; this maps every known shape to one record:
     {org: 'IVAP'|'HABE', examId, slug, part, kind: 'answers'|'marks'|'attempts'|'timer', mode}.
     examId is the id the reading workshop uses in its URL (?exam=…). */
  function parseReadingKey(key) {
    const k = String(key || '');
    const ivap = (examId, part, kind, mode) => ({ org: 'IVAP', examId, slug: 'ivap-' + examId, part, kind, mode });
    const habe = (examId, part, kind, mode) => ({ org: 'HABE', examId, slug: examId, part, kind, mode });
    let m;
    if (k === 'sustrai-gini-verified') return ivap('2019-05-04', 0, 'answers', 'practice');
    if (k === 'sustrai-gene-v1') return ivap('2019-05-04', 1, 'answers', 'practice');
    if ((m = k.match(/^sustrai-2019-0-(\d+)$/))) return ivap('2019-05-04', +m[1], 'answers', 'practice');
    if ((m = k.match(/^sustrai-2019-1-(\d+)$/))) return ivap('2019-10-26', +m[1], 'answers', 'practice');
    if ((m = k.match(/^sustrai-ivap-sim-answers-v1-(.+)-(\d+)$/))) return ivap(m[1], +m[2], 'answers', 'simulation');
    if ((m = k.match(/^sustrai-answers-v[23]-(.+)-(\d+)$/))) return ivap(m[1], +m[2], 'answers', 'practice');
    if ((m = k.match(/^sustrai-highlights-v2-(.+)-(\d+)$/))) return ivap(m[1], +m[2], 'marks', '');
    if ((m = k.match(/^sustrai-attempts-v3-(.+)$/))) return ivap(m[1], null, 'attempts', '');
    if ((m = k.match(/^sustrai-ivap-sim-timer-v1-(.+)$/))) return ivap(m[1], null, 'timer', 'simulation');
    if ((m = k.match(/^sustrai-timer-v2-(.+)$/))) return ivap(m[1], null, 'timer', 'practice');
    if ((m = k.match(/^sustrai-habe-sim-answers-v1-(.+)-(\d+)$/))) return habe(m[1], +m[2], 'answers', 'simulation');
    if ((m = k.match(/^sustrai-habe-sim-timer-v1-(.+)$/))) return habe(m[1], null, 'timer', 'simulation');
    if ((m = k.match(/^sustrai-habe-(.+)-answers-(\d+)$/))) return habe(m[1], +m[2], 'answers', 'practice');
    if ((m = k.match(/^sustrai-habe-(.+)-marks-(\d+)$/))) return habe(m[1], +m[2], 'marks', '');
    if ((m = k.match(/^sustrai-habe-(.+)-attempts$/))) return habe(m[1], null, 'attempts', '');
    if ((m = k.match(/^sustrai-habe-(.+)-timer$/))) return habe(m[1], null, 'timer', 'practice');
    return null;
  }
  function readingHref(rec, mode) {
    const base = rec.org === 'HABE' ? '/habe/' : '/ivap/';
    return base + '?exam=' + encodeURIComponent(rec.examId) + '&mode=' + (mode === 'simulation' ? 'simulation' : 'practice');
  }

  function parseWork(key) {
    const raw = String(key || '');
    const base = {
      key: raw,
      skill: 'other',
      kind: 'session',
      slug: '',
      mode: '',
      label: 'Saio-datuak',
      href: null,
      hidden: HIDDEN_KEYS.test(raw)
    };

    let m;
    if ((m = raw.match(/^sustrai-writer-c1:([^:]+):(training|simulation)$/))) {
      return {
        ...base,
        skill: 'writing',
        kind: 'draft',
        slug: m[1],
        mode: m[2],
        label: 'Idazlanaren zirriborroa',
        href: '/idazlanak/?ataza=' + encodeURIComponent(m[1]) + '&mode=' + m[2]
      };
    }
    if ((m = raw.match(/^sustrai-outline-v1:([^:]+):(training|simulation)$/))) {
      return {
        ...base,
        skill: 'writing',
        kind: 'outline',
        slug: m[1],
        mode: m[2],
        label: 'Idazlanaren eskema',
        href: '/idazlanak/?ataza=' + encodeURIComponent(m[1]) + '&mode=' + m[2]
      };
    }
    if ((m = raw.match(/^sustrai-oral-c1:([^:]+):(training|simulation)$/))) {
      return {
        ...base,
        skill: 'speaking',
        kind: 'notes',
        slug: m[1],
        mode: m[2],
        label: 'Ahozko oharrak',
        href: '/ahozkoa/?ataza=' + encodeURIComponent(m[1]) + '&mode=' + m[2]
      };
    }
    if ((m = raw.match(/^sustrai-writer-saved:([^:]+)$/))) {
      return { ...base, skill: 'writing', kind: 'saved', slug: m[1], label: 'Gordetako idazlanak', href: '/idazlanak/?ataza=' + encodeURIComponent(m[1]) };
    }
    if ((m = raw.match(/^sustrai-oral-saved:([^:]+)$/))) {
      return { ...base, skill: 'speaking', kind: 'saved', slug: m[1], label: 'Gordetako eskemak', href: '/ahozkoa/?ataza=' + encodeURIComponent(m[1]) };
    }
    if ((m = raw.match(/^sustrai-glossary:(writing|speaking):([^:]+)$/))) {
      return {
        ...base, skill: m[1], kind: 'glossary', slug: m[2], label: 'Hiztegia eta kontzeptuak',
        href: (m[1] === 'writing' ? '/idazlanak/' : '/ahozkoa/') + '?ataza=' + encodeURIComponent(m[2])
      };
    }
    if (/highlight|marks/i.test(raw)) {
      return { ...base, skill: 'reading', kind: 'marks', label: 'Azpimarrak', href: '/irakurmena/' };
    }
    if (/answers/i.test(raw)) {
      return { ...base, skill: 'reading', kind: 'answers', label: 'Erantzunak', href: '/irakurmena/' };
    }
    if (/attempts/i.test(raw)) {
      return { ...base, skill: 'reading', kind: 'attempts', label: 'Aurreko saiakerak', href: '/irakurmena/' };
    }
    if (/timer/i.test(raw)) {
      return { ...base, skill: 'reading', kind: 'timer', label: 'Kronometroa', href: '/irakurmena/', hidden: true };
    }
    return base;
  }

  function modeLabel(mode) {
    return mode === 'simulation' ? 'Simulazioa' : mode === 'training' || mode === 'practice' ? 'Praktika' : '';
  }

  function skillLabel(skill) {
    return ({ reading: 'Irakurmena', writing: 'Idazmena', speaking: 'Ahozkoa', other: 'Besteak' })[skill] || 'Besteak';
  }

  function previewValue(meta, valueText) {
    if (valueText == null || valueText === '') return '';
    try {
      if (meta.kind === 'draft' || meta.kind === 'notes') {
        const text = String(valueText).replace(/\s+/g, ' ').trim();
        return text.slice(0, 180) + (text.length > 180 ? '…' : '');
      }
      if (meta.kind === 'saved') {
        const list = JSON.parse(valueText);
        return list.length + ' gordeta · ' + list.map((x) => x.name).filter(Boolean).join(', ').slice(0, 150);
      }
      if (meta.kind === 'glossary') {
        const list = JSON.parse(valueText);
        return list.length + ' sarrera · ' + list.map((x) => x.term).filter(Boolean).join(', ').slice(0, 150);
      }
      if (meta.kind === 'outline') {
        const data = JSON.parse(valueText);
        const bits = [];
        if (data.goal) bits.push(String(data.goal));
        if (data.thesis) bits.push(String(data.thesis));
        const ideaCount = Array.isArray(data.ideas) ? data.ideas.filter((x) => x && String(x.idea || '').trim()).length : 0;
        if (ideaCount) bits.push(ideaCount + ' ideia');
        const joined = bits.join(' · ') || JSON.stringify(data);
        return joined.replace(/\s+/g, ' ').trim().slice(0, 180);
      }
      const parsed = JSON.parse(valueText);
      if (typeof parsed === 'string') return parsed.slice(0, 180);
      return JSON.stringify(parsed).slice(0, 180);
    } catch {
      return String(valueText).replace(/\s+/g, ' ').trim().slice(0, 180);
    }
  }

  function isMeaningful(meta, valueText) {
    if (meta.hidden) return false;
    if (meta.kind === 'draft' || meta.kind === 'notes') return String(valueText || '').trim().length > 0;
    if (meta.kind === 'saved' || meta.kind === 'glossary') {
      try { const list = JSON.parse(valueText || '[]'); return Array.isArray(list) && list.length > 0; } catch { return false; }
    }
    if (meta.kind === 'outline') {
      try {
        const data = JSON.parse(valueText || '{}');
        return !!(
          String(data.audience || '').trim() ||
          String(data.goal || '').trim() ||
          String(data.thesis || '').trim() ||
          (Array.isArray(data.ideas) && data.ideas.some((x) => x && String(x.idea || '').trim()))
        );
      } catch { return String(valueText || '').trim().length > 8; }
    }
    return meta.kind === 'marks' || meta.kind === 'answers' || meta.kind === 'attempts';
  }

  function scorePct(score, max) {
    const s = Number(score), m = Number(max);
    if (!m) return null;
    return Math.round((s / m) * 100);
  }

  function examTitle(row) {
    const exam = row?.sr_exams || row?.exam || null;
    if (exam?.title) return exam.title;
    if (exam?.slug) return exam.slug;
    return 'Irakurmen-proba';
  }

  function resultMode(row) {
    const mode = row?.response_summary?.mode;
    return modeLabel(mode === 'simulation' ? 'simulation' : mode ? 'practice' : '');
  }

  window.SustraiAccountKit = {
    parseWork, previewValue, isMeaningful, euDate, euWhen, parseReadingKey, readingHref, modeLabel, skillLabel, scorePct, examTitle, resultMode, HIDDEN_KEYS
  };
})();
