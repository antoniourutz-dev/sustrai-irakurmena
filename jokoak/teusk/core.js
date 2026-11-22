/* TEUSK core · SUSTRAI integration. Derived from antoniourutz-dev/teusk (same owner). */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.TeuskCore = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';
  function bounds(level) {
    if (level === 0) return null;
    if (![1, 2, 3, 4].includes(level)) throw new RangeError('Sorta ezezaguna');
    return { min: level === 1 ? 0 : (level - 1) * 1000 + 1, max: level === 4 ? null : level * 1000 };
  }
  function isQuestion(value) {
    return !!value && Number.isSafeInteger(value.id) &&
      typeof value.question === 'string' && !!value.question.trim() &&
      Array.isArray(value.candidates) && value.candidates.length >= 2 &&
      value.candidates.every(c => typeof c === 'string' && !!c.trim()) &&
      new Set(value.candidates.map(s => s.trim())).size === value.candidates.length &&
      Number.isInteger(value.answer) && value.answer >= 0 && value.answer < value.candidates.length;
  }
  function shuffle(values, random = Math.random) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function score(questions, selected) {
    const total = questions.length;
    const correct = questions.reduce((acc, q, i) => acc + (selected[i] === q.answer ? 1 : 0), 0);
    return { correct, total, wrong: total - correct };
  }
  return Object.freeze({ bounds, isQuestion, shuffle, score });
});
