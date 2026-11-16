/* Shared helpers for student space and admin follow-up. */
(() => {
  'use strict';

  const HIDDEN_KEYS = /^(sustrai-markerbar-pos|sustrai-current-exam|sustrai-client-attempt-|sustrai-reading-last|sustrai-oral-last)/;

  function euDate(value) {
    try { return new Date(value).toLocaleString('eu', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return String(value || ''); }
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
    parseWork, previewValue, isMeaningful, euDate, modeLabel, skillLabel, scorePct, examTitle, resultMode, HIDDEN_KEYS
  };
})();
