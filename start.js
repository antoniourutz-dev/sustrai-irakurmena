'use strict';

const readingForm = document.getElementById('practiceForm');
const modeFieldset = document.getElementById('modeFieldset');
const startReadingButton = document.getElementById('startPractice');
const readingSummary = document.getElementById('selectionSummary');
const writingForm = document.getElementById('writingForm');
const startWritingButton = document.getElementById('startWriting');
const writingSummary = document.getElementById('writingSummary');

const examNames = { ivap: 'IVAP', habe: 'HABE' };
const readingModeNames = { simulation: 'simulazioa', practice: 'praktika' };
const writingModeNames = { training: 'entrenamendua', simulation: 'simulazioa' };

function selectedValue(form, name) {
  return form.elements[name].value;
}

function updateReadingEntry() {
  const examType = selectedValue(readingForm, 'examType');
  const practiceMode = selectedValue(readingForm, 'practiceMode');

  modeFieldset.disabled = !examType;
  startReadingButton.disabled = !(examType && practiceMode);

  if (!examType) readingSummary.textContent = 'Aukeratu erakundea eta lan-modua.';
  else if (!practiceMode) readingSummary.textContent = examNames[examType] + ' aukeratuta. Hautatu lan-modua.';
  else readingSummary.textContent = examNames[examType] + ' · ' + readingModeNames[practiceMode] + '. Dena prest.';
}

function updateWritingEntry() {
  const writingMode = selectedValue(writingForm, 'writingMode');
  startWritingButton.disabled = !writingMode;
  writingSummary.textContent = writingMode
    ? writingModeNames[writingMode] + ' aukeratuta. Dena prest.'
    : 'Aukeratu entrenamendua edo simulazioa.';
}

readingForm.addEventListener('change', (event) => {
  if (event.target.name === 'examType') {
    readingForm.querySelectorAll('[name="practiceMode"]').forEach((input) => { input.checked = false; });
  }
  updateReadingEntry();
});

readingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const examType = selectedValue(readingForm, 'examType');
  const practiceMode = selectedValue(readingForm, 'practiceMode');
  if (!examType || !practiceMode) return;
  const path = examType === 'ivap' ? '/ivap/' : '/habe/';
  window.location.assign(path + '?mode=' + encodeURIComponent(practiceMode));
});

writingForm.addEventListener('change', updateWritingEntry);
writingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const writingMode = selectedValue(writingForm, 'writingMode');
  if (!writingMode) return;
  window.location.assign('/idazlanak/?mode=' + encodeURIComponent(writingMode));
});

updateReadingEntry();
updateWritingEntry();
