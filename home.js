/* Homepage account entry. Learning progress stays in Nire espazioa. */
'use strict';
(async () => {
  const cloud = window.SustraiCloud;
  const register = document.getElementById('homeRegister');
  const link = document.getElementById('homeSpaceLink');
  if (!cloud) return;
  if (register) register.addEventListener('click', () => cloud.openLogin('signup'));
  try { await cloud.ready; } catch { return; }

  const active = Boolean(cloud.user() && cloud.profile()?.active);
  if (register) register.hidden = active;
  if (active && link) {
    link.classList.add('home-account-cta');
    link.classList.remove('home-account-link');
  }
})();
