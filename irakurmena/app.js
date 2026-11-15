'use strict';
const API_URL = 'https://awdajwrzxceqazmaorxc.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ';
const HEADERS = { apikey: API_KEY, Authorization: 'Bearer ' + API_KEY };
const $ = (id) => document.getElementById(id);

let exams = [];
let selected = null;

function show(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(show._t);
  show._t = setTimeout(() => { el.hidden = true; }, 4000);
}

async function readExams(organism) {
  const response = await fetch(API_URL + '/rest/v1/rpc/sr_public_exam_snapshot', {
    method: 'POST',
    headers: await window.SustraiCloud.headers({ ...HEADERS, 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p_organism_code: organism }),
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('Ezin izan dira azterketak kargatu (' + response.status + ').');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Azterketa-datuak ez dira egokiak.');
  return rows.map((exam) => {
    const items = Array.isArray(exam.items) ? exam.items : [];
    const questions = items.reduce((sum, item) => {
      const range = item?.r;
      if (!Array.isArray(range) || range.length !== 2) return sum;
      return sum + (Number(range[1]) - Number(range[0]) + 1);
    }, 0);
    return {
      id: String(exam.id || ''),
      label: String(exam.label || exam.id || 'Proba'),
      organism,
      source: typeof exam.source === 'string' ? exam.source : '',
      questions,
      parts: items.map((item, index) => ({
        title: String(item?.title || (index + 1) + '. ariketa'),
        count: Array.isArray(item?.r) ? (Number(item.r[1]) - Number(item.r[0]) + 1) : 0
      }))
    };
  }).filter((exam) => exam.id && exam.questions > 0);
}

function filtered() {
  const org = $('orgFilter').value;
  const size = $('sizeFilter').value;
  const term = $('search').value.toLocaleLowerCase('eu').trim();
  return exams.filter((exam) =>
    (org === 'all' || exam.organism === org) &&
    (size === 'all' || String(exam.questions) === size) &&
    (!term || [exam.label, exam.id, exam.organism].some((value) => String(value).toLocaleLowerCase('eu').includes(term)))
  );
}

function workshopPath(exam) {
  return (exam.organism === 'HABE' ? '/habe/' : '/ivap/') + '?exam=' + encodeURIComponent(exam.id);
}

function renderList() {
  const rows = filtered();
  $('catalogCount').textContent = rows.length + ' / ' + exams.length + ' proba';
  const list = $('examList');
  list.replaceChildren();
  if (!rows.length) {
    list.textContent = 'Ez dago probarik iragazki honekin.';
    return;
  }
  for (const exam of rows) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'task-card' + (selected?.id === exam.id && selected?.organism === exam.organism ? ' active' : '');
    const meta=document.createElement('span');meta.className='meta';meta.textContent=exam.organism+' · '+exam.id;
    const label=document.createElement('strong');label.textContent=exam.label;
    const kind=document.createElement('span');kind.className='kind';kind.textContent=exam.questions+' galdera · '+exam.parts.length+' ariketa';
    btn.append(meta,label,kind);
    btn.onclick = () => selectExam(exam);
    list.append(btn);
  }
}

function selectExam(exam) {
  selected = exam;
  renderList();
  $('examTitle').textContent = exam.label;
  $('examTags').replaceChildren(
    ...[exam.organism, exam.id, exam.questions + ' galdera', exam.parts.length + ' ariketa'].map((text) => {
      const span = document.createElement('span');
      span.textContent = text;
      return span;
    })
  );
  $('examLead').textContent = 'Proba hau irekita, barruan aukeratuko duzu praktika librea edo simulazioa.';
  $('examDetail').hidden = false;
  $('detailLabel').textContent = exam.label;
  $('detailMeta').textContent = exam.organism + ' · ' + exam.id + ' · ' + exam.questions + ' galdera';
  $('openExam').href = workshopPath(exam);
  const pdf = $('sourcePdf');
  try {
    const url = new URL(exam.source);
    const ok = url.protocol === 'https:';
    pdf.hidden = !ok;
    if (ok) pdf.href = url.toString();
  } catch {
    pdf.hidden = true;
  }
  const parts = $('detailParts');
  parts.replaceChildren(...exam.parts.map((part, index) => {
    const li = document.createElement('li');
    const name=document.createElement('strong');name.textContent=(index+1)+'. '+part.title;
    const count=document.createElement('span');count.textContent=part.count+' galdera';
    li.append(name,count);
    return li;
  }));
  try { sessionStorage.setItem('sustrai-reading-last', JSON.stringify({ organism: exam.organism, id: exam.id })); } catch {}
}

async function start() {
  await window.SustraiCloud.ready;
  $('orgFilter').onchange = renderList;
  $('sizeFilter').onchange = renderList;
  $('search').oninput = renderList;
  try {
    const [ivap, habe] = await Promise.all([readExams('IVAP'), readExams('HABE')]);
    exams = [...ivap, ...habe].sort((a, b) =>
      a.organism.localeCompare(b.organism) || b.id.localeCompare(a.id) || a.label.localeCompare(b.label, 'eu')
    );
    $('examList').setAttribute('aria-busy', 'false');
    if (!exams.length) throw new Error('Ez dago argitaratutako irakurmen-probarik.');
    renderList();
    let requested = null;
    try {
      const params = new URLSearchParams(location.search);
      const org = params.get('erakundea') || params.get('org');
      const id = params.get('exam') || params.get('proba');
      if (id) requested = exams.find((exam) => exam.id === id && (!org || exam.organism.toLowerCase() === org.toLowerCase())) || exams.find((exam) => exam.id === id);
    } catch {}
    if (!requested) {
      try {
        const raw = sessionStorage.getItem('sustrai-reading-last');
        if (raw) {
          const last = JSON.parse(raw);
          requested = exams.find((exam) => exam.id === last.id && exam.organism === last.organism);
        }
      } catch {}
    }
    if (requested) selectExam(requested);
    else selectExam(exams[0]);
  } catch (error) {
    $('examList').setAttribute('aria-busy', 'false');
    $('examList').textContent = error.message || 'Ezin izan da kargatu.';
    show('Irakurmen-probak ezin izan dira kargatu.');
    console.error(error);
  }
}

start();
