'use strict';

const form = document.getElementById('practiceForm');
const modeFieldset = document.getElementById('modeFieldset');
const startButton = document.getElementById('startPractice');
const summary = document.getElementById('selectionSummary');
const stepItems = [...document.querySelectorAll('.start-steps li')];

const examNames = { ivap: 'IVAP', habe: 'HABE' };
const modeNames = { simulation: 'simulazioa', practice: 'praktika librea' };

function selectedValue(name) {
  return form.elements[name].value;
}

function updateEntry() {
  const examType = selectedValue('examType');
  const practiceMode = selectedValue('practiceMode');

  modeFieldset.disabled = !examType;
  stepItems[1].classList.toggle('active', Boolean(examType));
  stepItems[2].classList.toggle('active', Boolean(examType && practiceMode));
  startButton.disabled = !(examType && practiceMode);

  if (!examType) summary.textContent = 'Lehenik, aukeratu IVAP edo HABE.';
  else if (!practiceMode) summary.textContent = examNames[examType] + ' aukeratuta. Orain, hautatu praktika modua.';
  else summary.textContent = examNames[examType] + ' · ' + modeNames[practiceMode] + '. Dena prest dago.';
}

form.addEventListener('change', (event) => {
  if (event.target.name === 'examType') {
    form.querySelectorAll('[name="practiceMode"]').forEach((input) => { input.checked = false; });
  }
  updateEntry();
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const examType = selectedValue('examType');
  const practiceMode = selectedValue('practiceMode');
  if (!examType || !practiceMode) return;
  const path = examType === 'ivap' ? '/ivap/' : '/habe/';
  window.location.assign(path + '?mode=' + encodeURIComponent(practiceMode));
});

updateEntry();
