# PDF dependencies

Self-hosted, pinned browser distributions, loaded only when exporting. No PDF service or
external CDN is contacted. Retain the adjacent MIT license files.

- html2canvas 1.4.1: https://github.com/niklasvh/html2canvas/tree/v1.4.1
  Download: https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
- jsPDF 4.2.1: https://github.com/parallax/jsPDF/releases/tag/v4.2.1
  Download: https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js

The app uses html2canvas's DOM renderer and jsPDF's PNG embedding/save APIs only.
It does not use jsPDF HTML, annotations, remote images or JavaScript embedding.

## Editable Word

- docx 9.6.1, browser IIFE distribution (unmodified) and MIT LICENSE copied from
  the bundled workspace dependency runtime. Upstream: https://github.com/dolanmiu/docx/tree/9.6.1
- Loaded only on Word export; documents contain native tables and text.
- The original application fonts are converted to static TrueType instances and embedded
  in DOCX under space-free family aliases. Source licenses remain in `fonts/OFL-*.txt`.
  Rebuild with `python scripts/build-crossword-word-fonts.py` (fonttools + brotli).
  Base64 transport keeps these two self-hosted font assets in text form; it is not a font subset.
