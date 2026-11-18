/* Hasiera: «Gaurko saioa» txartela, Hizkuntzako hurrengo urrats errealarekin */
(function () {
  'use strict';
  if (!window.HB) return;
  var $ = function (x) { return document.getElementById(x); };
  HB.content('b1').then(function (c) {
    var u = c.units.filter(function (x) { return x.ready; })[0];
    if (!u) return;
    var done = HB.stepsDone(u.id);
    var next = u.steps.filter(function (s) { return done.indexOf(s.id) === -1; })[0];
    var n = u.steps.length - u.steps.filter(function (s) { return done.indexOf(s.id) === -1; }).length;
    if (next) {
      $('homeFocus').href = next.href;
      $('homeFocusChip').textContent = (n ? 'Jarraitu · ' : 'Gaurko saioa · ') + n + ' / ' + u.steps.length;
      $('homeFocusTitle').textContent = next.title;
      $('homeFocusMeta').textContent = u.n + '. unitatea · ' + u.title + ' · ' + next.meta;
      $('homeFocusGo').textContent = n ? 'Jarraitu' : 'Hasi';
    } else {
      $('homeFocus').href = '/hizkuntza/bikoteak/?u=' + u.id;
      $('homeFocusChip').textContent = 'Unitatea osatuta · errepasoa';
      $('homeFocusTitle').textContent = 'Bikoteak: sinonimoak';
      $('homeFocusMeta').textContent = 'Jokatu berriro eta mantendu bolada';
      $('homeFocusGo').textContent = 'Jokatu';
    }
  }).catch(function () { /* txartelak bere testu lehenetsiarekin jarraitzen du */ });
})();
