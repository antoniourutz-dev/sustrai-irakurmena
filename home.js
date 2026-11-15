/* SUSTRAI home: wires the account call-to-action and adapts it for signed-in users. */
'use strict';
(async () => {
  const register = document.getElementById('homeRegister');
  const cloud = window.SustraiCloud;
  if (!register || !cloud) return;
  register.addEventListener('click', () => cloud.openLogin('signup'));
  try { await cloud.ready; } catch { return; }
  const profile = cloud.profile();
  if (!cloud.user() || !profile?.active) return;
  const title = document.getElementById('accountTitle');
  const lead = document.getElementById('accountLead');
  const link = document.getElementById('homeSpaceLink');
  if (title) title.textContent = 'Kaixo' + (profile.name ? ', ' + profile.name : '') + '!';
  if (lead) lead.textContent = 'Jarraitu utzitako tokian: zure zirriborroak, eskemak eta emaitzak Nire espazioan dituzu.';
  register.hidden = true;
  if (link) { link.classList.add('home-account-cta'); link.classList.remove('home-account-link'); link.textContent = 'Nire espaziora joan'; }
})();
