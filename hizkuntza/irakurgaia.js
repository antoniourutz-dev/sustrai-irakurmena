/* Irakurgaia: zona lasaia; amaitzean urratsa markatu */
(function () {
  'use strict';
  var esc = HB.esc, id = new URLSearchParams(location.search).get('u') || 'b1-5';
  var back = document.getElementById('back'); back.href = '/hizkuntza/';
  HB.unit(id).then(function (u) {
    if (!u || !u.reading) return;
    document.getElementById('pageTitle').textContent = u.reading.title;
    document.title = u.reading.title + ' · HitzBira';
    document.getElementById('text').innerHTML = u.reading.paragraphs.map(function (p) { return '<p style="margin:0 0 18px;font-size:20px;line-height:1.85">' + esc(p) + '</p>'; }).join('');
    var btn = document.getElementById('doneBtn');
    if (HB.stepsDone(id).indexOf('irakurgaia') > -1) btn.textContent = 'Itzuli Hizkuntzara';
    btn.addEventListener('click', function () {
      if (HB.stepsDone(id).indexOf('irakurgaia') === -1) { HB.completeStep(id, 'irakurgaia'); HB.addXP(10); }
      location.href = back.href;
    });
  });
})();
