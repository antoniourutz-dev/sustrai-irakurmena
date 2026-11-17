/* SUSTRAI home: account call-to-action, and «Jarraitu» for returning students.
   A first visit sees the same page as before; anyone with work in progress (cloud or this
   device) gets up to three cards that take them straight back to it. */
'use strict';
(async () => {
  const cloud = window.SustraiCloud;
  const register = document.getElementById('homeRegister');
  if (!cloud) return;
  if (register) register.addEventListener('click', () => cloud.openLogin('signup'));
  try { await cloud.ready; } catch { return; }

  const profile = cloud.profile();
  if (cloud.user() && profile?.active) {
    const title = document.getElementById('accountTitle');
    const lead = document.getElementById('accountLead');
    const link = document.getElementById('homeSpaceLink');
    if (title) title.textContent = 'Kaixo' + (profile.name ? ', ' + profile.name.trim().split(/\s+/)[0] : '') + '!';
    if (lead) lead.textContent = 'Zure zirriborroak, eskemak eta emaitzak Nire espazioan dituzu, gailu guztietatik.';
    if (register) register.hidden = true;
    if (link) { link.classList.add('home-account-cta'); link.classList.remove('home-account-link'); link.textContent = 'Nire espaziora joan'; }
  }

  const P = window.SustraiProgress, kit = window.SustraiAccountKit;
  const section = document.getElementById('homeContinue');
  const list = document.getElementById('homeContinueList');
  if (!P || !kit || !section || !list) return;
  let state;
  try { state = await P.load(); } catch { return; }
  const open = P.openTasks(state.tasks).slice(0, 3);
  if (!open.length) return;

  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = String(text); if (cls) n.className = cls; return n; };
  list.replaceChildren(...open.map((task) => {
    const card = el('a', null, 'hc-card skill-' + task.skill);
    card.href = P.hrefOf(task);
    const top = el('span', null, 'hc-top');
    top.append(el('span', P.SKILL[task.skill], 'hc-skill'));
    if (task.mode === 'simulation') top.append(el('span', 'Simulazioa', 'hc-mode'));
    card.append(top, el('strong', task.title, 'hc-title'));
    const p = P.progressOf(task);
    if (p.value !== null) {
      const bar = el('span', null, 'hc-meter');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', p.text);
      const fill = el('span');
      fill.style.width = Math.round(p.value * 100) + '%';
      bar.append(fill);
      card.append(bar);
    }
    const foot = el('span', null, 'hc-foot');
    foot.append(el('span', p.text + (task.updated ? ' · ' + kit.euWhen(task.updated) : ''), 'hc-meta'), el('span', 'Jarraitu', 'hc-cta'));
    card.append(foot);
    return card;
  }));
  section.hidden = false;
})();
