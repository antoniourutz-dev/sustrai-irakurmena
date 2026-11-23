# PDF dependencies

Self-hosted, pinned browser distributions, loaded only when exporting. No PDF service or
external CDN is contacted. Retain the adjacent MIT license files.

- html2canvas 1.4.1: https://github.com/niklasvh/html2canvas/tree/v1.4.1
  Download: https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
- jsPDF 4.2.1: https://github.com/parallax/jsPDF/releases/tag/v4.2.1
  Download: https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js

The app uses html2canvas's DOM renderer and jsPDF's PNG embedding/save APIs only.
It does not use jsPDF HTML, annotations, remote images or JavaScript embedding.
