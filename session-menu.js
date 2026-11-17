/* HitzBira · «Aukerak» menu of the reading workshop (IVAP/HABE).
   Keeps the session bar to the essentials (exam, time, Highlight, Finish); everything occasional
   — mode, optional timer, my attempts, clearing, starting again — lives here.
   The items keep their old ids, so app.js handlers work unchanged. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const toggle = $('moreToggle');
  const menu = $('moreMenu');
  if (!toggle || !menu) return;
  const items = () => [...menu.querySelectorAll('button')].filter((b) => b.offsetParent !== null && !b.disabled);

  function syncTimerLabel() {
    const start = $('start');
    const label = $('moreTimer')?.querySelector('span');
    if (!start || !label) return;
    const t = start.textContent.trim();
    label.textContent = t === 'Pausatu' ? 'Kronometroa pausatu' : t === 'Jarraitu' ? 'Kronometroa jarraitu' : 'Kronometroa hasi (aukerakoa)';
  }

  function open() {
    syncTimerLabel();
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', onKey, true);
    requestAnimationFrame(() => (menu.querySelector('.mode.active') || items()[0])?.focus());
  }
  function close(focusBack) {
    if (menu.hidden) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', onKey, true);
    if (focusBack) toggle.focus();
  }
  function outside(event) { if (!$('moreWrap').contains(event.target)) close(false); }
  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close(true); return; }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const list = items();
    const i = list.indexOf(document.activeElement);
    event.preventDefault();
    list[(i + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
  }

  toggle.addEventListener('click', () => (menu.hidden ? open() : close(true)));
  // Every item does its job and closes the menu (the mode switch included).
  menu.addEventListener('click', (event) => { if (event.target.closest('button')) close(false); });
  $('moreTimer')?.addEventListener('click', () => $('start')?.click());
  $('moreMarker')?.addEventListener('click', () => $('markerTool')?.click());
})();
