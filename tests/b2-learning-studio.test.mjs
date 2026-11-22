import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = read('gramatika/ibilbidea/app.js');
const html = read('gramatika/ibilbidea/index.html');
const css = read('gramatika/ibilbidea/style.css');
const sw = read('sw.js');

test('B2 aplikazioaren JavaScriptak baliozko sintaxia du', () => {
  assert.doesNotThrow(() => new Script(app, {filename:'gramatika/ibilbidea/app.js'}));
});

test('Programak erabiltzen dituen DOM ID guztiak daude', () => {
  const ids=[...new Set([...app.matchAll(/\$\('([a-zA-Z][\w-]*)'\)/g)].map(x => x[1]))];
  const createdDynamically=new Set(['pathTransferText']);
  const absent=ids.filter(id=>!createdDynamically.has(id) && !html.includes('id="'+id+'"'));
  assert.deepEqual(absent, []);
});

test('Ikasgaiak eta galderak Supabasetik kargatzen dira', () => {
  assert.match(app,/smx_grammar_b2_lesson_designs/);
  assert.match(app,/smx_grammar_b2_practice_items/);
  assert.match(app,/public_editorial_grammar_entries/);
  assert.match(app,/state\.units=units\.map\(u=>\(\{\.\.\.u,pilot_active:designs/);
  assert.doesNotMatch(app,/designs\.length!==5|items\.length!==20/);
});

test('Ikaslearen ekoizpenak bertsio bidez eta RPC bidez gordetzen dira', () => {
  assert.match(app,/smx_b2_save_written_work/);
  assert.match(app,/smx_grammar_b2_work_versions/);
  assert.match(app,/Atzeratutako berrikuspena/);
  assert.match(app,/72\*60\*60\*1000/);
});

test('Irakaslearen orientazioa bereizita dago eta ikaslearen originala zainduta', () => {
  assert.match(app,/smx_grammar_b2_teacher_feedback/);
  assert.match(app,/renderStudentEvidence/);
  assert.doesNotMatch(app,/\.innerHTML\s*=/);
});

test('Erantzunen egoera ez da koloreaz soilik adierazten', () => {
  assert.match(css,/\.b2-option\.is-correct/);
  assert.match(css,/\.b2-option\.is-incorrect/);
  assert.match(app,/'Zuzena'/);
  assert.match(app,/'Berrikusteko'/);
});

test('Ikasleak hurrengo ekintza, irakurketa eta ikasketa-helburua aurkitzen ditu', () => {
  for(const id of ['pathGuidedCount','pathNextTitle','pathContinueButton','pathLessonGoal','pathLessonDuration','pathProgressTrack']) {
    assert.match(html, new RegExp('id="'+id+'"'));
  }
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test('PWAk gramatikako ibilbidearen offline bidea bereizten du', () => {
  assert.match(sw,/gramatika\/ibilbidea\/index\.html/);
  assert.match(sw,/url\.pathname\.startsWith\('\/gramatika\/ibilbidea\/'\)/);
  assert.match(html,/ibilbidea\/app\.js\?v=/);
  assert.match(html,/ibilbidea\/style\.css\?v=/);
});
