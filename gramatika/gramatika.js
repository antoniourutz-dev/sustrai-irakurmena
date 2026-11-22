/* B2/C1 teoria-atalen nabigazioa; ez da zuzenketa edo ariketa-motorrik. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const match = (location.hash || '').match(/^#(b2|c1)-/i);
  const requested = match ? match[1].toUpperCase() : params.get('maila');
  const level = requested === 'C1' ? 'C1' : 'B2';
  document.querySelectorAll('[data-grammar-level]').forEach(section => {
    section.hidden = section.dataset.grammarLevel !== level;
  });
  document.querySelectorAll('.grammar-level-link').forEach(link => {
    if (link.dataset.level === level) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const levelTitle = document.getElementById('grammarChosenLevel');
  if (levelTitle) levelTitle.textContent = level;
})();
