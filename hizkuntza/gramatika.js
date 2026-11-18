/* Gramatika-fitxa: fitxa irakurtzean urratsa markatu eta ariketetara lotu */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search), u = q.get('u') || 'b1-5';
  var back = document.getElementById('back');
  if (q.get('u')) { back.href = '/ibilbidea/unitatea/?u=' + encodeURIComponent(u); back.lastChild.textContent = 'Unitatea'; }
  document.getElementById('practice').href = '/hizkuntza/ariketak/?u=' + encodeURIComponent(u);
  if (HB.stepsDone(u).indexOf('gramatika') === -1) { HB.completeStep(u, 'gramatika'); HB.addXP(5); }
})();
