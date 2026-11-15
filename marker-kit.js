/* Shared highlighter kit for SUSTRAI workshops */
(function (global) {
  const COLORS = { yellow: '#ffe174', green: '#a9e8bd', pink: '#f7bed5', blue: '#b2dbff' };

  function $(id) { return document.getElementById(id); }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function createMarkerKit(options) {
    const storageKey = options.storageKey;
    const getScope = options.getScope || (() => 'default');
    let activeMarker = null;
    let brushStroke = null;
    let markerDragState = null;
    let visible = true;

    function key() {
      return storageKey + ':' + getScope();
    }

    function readMarks() {
      try {
        const raw = JSON.parse(window.SustraiCloud.storage.getItem(key()));
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    }

    function writeMarks(list) {
      try { window.SustraiCloud.storage.setItem(key(), JSON.stringify(list)); } catch {}
    }

    function markedHtml(content, area) {
      const text = String(content ?? '');
      if (!visible) return escapeHtml(text);
      const marks = readMarks().filter((m) => m.area === area).sort((a, b) => a.start - b.start);
      let index = 0;
      let out = '';
      for (const mark of marks) {
        if (mark.start < index || mark.end > text.length || mark.end <= mark.start) continue;
        out += escapeHtml(text.slice(index, mark.start));
        out += '<mark class="highlit" style="background:' + COLORS[mark.color] + '">' + escapeHtml(text.slice(mark.start, mark.end)) + '</mark>';
        index = mark.end;
      }
      return out + escapeHtml(text.slice(index));
    }

    function fillSelectable(el, text, area) {
      if (!el) return;
      el.innerHTML = '<span class="selectable" data-area="' + area + '">' + markedHtml(text, area) + '</span>';
    }

    function setActiveMarker(tool) {
      const next = activeMarker === tool ? null : tool;
      activeMarker = next;
      document.body.classList.toggle('marker-armed', !!activeMarker);
      if (activeMarker) document.body.dataset.markerTool = activeMarker;
      else delete document.body.dataset.markerTool;
      document.querySelectorAll('#markerbar .swatch').forEach((el) => {
        const on = el.dataset.color === activeMarker;
        el.classList.toggle('active', on);
        el.setAttribute('aria-pressed', String(on));
      });
      const eraseBtn = $('erase');
      if (eraseBtn) {
        const on = activeMarker === 'erase';
        eraseBtn.classList.toggle('active', on);
        eraseBtn.setAttribute('aria-pressed', String(on));
      }
      if (activeMarker) $('markerbar')?.classList.add('visible');
    }

    function caretFromPoint(x, y) {
      let node = null;
      let offset = 0;
      if (document.caretRangeFromPoint) {
        const range = document.caretRangeFromPoint(x, y);
        if (range) { node = range.startContainer; offset = range.startOffset; }
      } else if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(x, y);
        if (pos) { node = pos.offsetNode; offset = pos.offset; }
      }
      if (!node) return null;
      if (node.nodeType === Node.TEXT_NODE) return { node, offset };
      if (node.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        const first = walker.nextNode();
        if (first) return { node: first, offset: Math.min(offset, first.textContent.length) };
      }
      return null;
    }

    function previewBrushSelection(start, end) {
      try {
        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      } catch {}
      try {
        const range = document.createRange();
        range.setStart(end.node, end.offset);
        range.setEnd(start.node, start.offset);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      } catch {}
      return false;
    }

    function brushTargetFromEvent(event) {
      if (event.target.closest('#markerbar,.marker-drag,button,a,select,label,textarea,input,.choose,.mode,.task-list')) return null;
      return event.target.closest('.selectable[data-area]');
    }

    function captureSelection() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) return [];
      const range = selection.getRangeAt(0);
      const saved = [];
      document.querySelectorAll('.selectable[data-area]').forEach((el) => {
        if (!range.intersectsNode(el)) return;
        const whole = document.createRange();
        whole.selectNodeContents(el);
        const clipped = range.cloneRange();
        try {
          if (range.compareBoundaryPoints(Range.START_TO_START, whole) < 0) clipped.setStart(whole.startContainer, whole.startOffset);
          if (range.compareBoundaryPoints(Range.END_TO_END, whole) > 0) clipped.setEnd(whole.endContainer, whole.endOffset);
          const before = whole.cloneRange();
          before.setEnd(clipped.startContainer, clipped.startOffset);
          const start = before.toString().length;
          const len = clipped.toString().length;
          if (len) saved.push({ area: el.dataset.area, start, end: start + len });
        } catch {}
      });
      return saved;
    }

    function applyPaint(color, spans) {
      if (!spans.length) return;
      let list = readMarks();
      for (const span of spans) {
        list = list.filter((m) => m.area !== span.area || m.end <= span.start || m.start >= span.end);
        list.push({ ...span, color });
      }
      writeMarks(list);
      window.getSelection()?.removeAllRanges();
      options.onChange?.();
    }

    function applyErase(spans) {
      if (!spans.length) return;
      writeMarks(readMarks().filter((m) => !spans.some((s) => s.area === m.area && s.start < m.end && s.end > m.start)));
      window.getSelection()?.removeAllRanges();
      options.onChange?.();
    }

    function markRangeFromElement(mark) {
      const areaEl = mark.closest('.selectable[data-area]');
      if (!areaEl) return null;
      try {
        const before = document.createRange();
        before.selectNodeContents(areaEl);
        before.setEnd(mark, 0);
        const start = before.toString().length;
        const end = start + mark.textContent.length;
        if (end <= start) return null;
        return { area: areaEl.dataset.area, start, end };
      } catch {
        return null;
      }
    }

    function eraseMarkElement(mark) {
      const span = markRangeFromElement(mark);
      if (!span) return;
      applyErase([span]);
    }

    function finishBrushStroke() {
      if (!brushStroke || !activeMarker) { brushStroke = null; return; }
      const moved = brushStroke.moved;
      brushStroke = null;
      if (!moved) return;
      const spans = captureSelection();
      if (!spans.length) return;
      if (activeMarker === 'erase') applyErase(spans);
      else applyPaint(activeMarker, spans);
    }

    function restoreMarkerPosition() {
      const bar = $('markerbar');
      if (!bar) return;
      try {
        const raw = window.SustraiCloud.storage.getItem('sustrai-markerbar-pos');
        if (!raw) return;
        const pos = JSON.parse(raw);
        if (Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
          bar.style.left = Math.max(8, pos.left) + 'px';
          bar.style.top = Math.max(8, pos.top) + 'px';
        }
      } catch {}
    }

    function saveMarkerPosition() {
      const bar = $('markerbar');
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      try { window.SustraiCloud.storage.setItem('sustrai-markerbar-pos', JSON.stringify({ left: rect.left, top: rect.top })); } catch {}
    }

    function setupMarkerDrag() {
      const handle = $('markerDrag');
      const bar = $('markerbar');
      if (!handle || !bar) return;
      restoreMarkerPosition();
      handle.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        const rect = bar.getBoundingClientRect();
        markerDragState = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, pid: event.pointerId };
        handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener('pointermove', (event) => {
        if (!markerDragState || event.pointerId !== markerDragState.pid) return;
        const left = Math.min(window.innerWidth - 80, Math.max(8, event.clientX - markerDragState.dx));
        const top = Math.min(window.innerHeight - 48, Math.max(8, event.clientY - markerDragState.dy));
        bar.style.left = left + 'px';
        bar.style.top = top + 'px';
      });
      const end = (event) => {
        if (!markerDragState || event.pointerId !== markerDragState.pid) return;
        markerDragState = null;
        saveMarkerPosition();
      };
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
    }

    function setup() {
      const tool = $('markerTool');
      const bar = $('markerbar');
      if (!tool || !bar) return;
      tool.onclick = function () {
        const open = bar.classList.toggle('visible');
        this.setAttribute('aria-expanded', String(open));
      };
      $('closeMarker')?.addEventListener('click', () => {
        bar.classList.remove('visible');
        tool.setAttribute('aria-expanded', 'false');
        if (activeMarker) setActiveMarker(activeMarker);
      });
      document.querySelectorAll('#markerbar .swatch').forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => e.preventDefault());
        btn.onclick = () => setActiveMarker(btn.dataset.color);
      });
      $('erase')?.addEventListener('click', () => setActiveMarker('erase'));
      const visibility = $('markVisibility');
      if (visibility) {
        visibility.onclick = () => {
          visible = !visible;
          visibility.textContent = visible ? 'Ezkutatu' : 'Erakutsi';
          options.onChange?.();
        };
      }
      setupMarkerDrag();

      document.addEventListener('pointerdown', (event) => {
        if (!activeMarker || event.button !== 0 || brushStroke) return;
        if (event.target.closest('mark.highlit')) return;
        if (!brushTargetFromEvent(event)) return;
        const caret = caretFromPoint(event.clientX, event.clientY);
        if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return;
        brushStroke = { pid: event.pointerId, start: caret, end: caret, moved: false, x: event.clientX, y: event.clientY };
      }, true);

      document.addEventListener('pointermove', (event) => {
        if (!brushStroke || event.pointerId !== brushStroke.pid) return;
        if (Math.abs(event.clientX - brushStroke.x) > 3 || Math.abs(event.clientY - brushStroke.y) > 3) brushStroke.moved = true;
        const caret = caretFromPoint(event.clientX, event.clientY);
        if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return;
        brushStroke.end = caret;
        previewBrushSelection(brushStroke.start, caret);
      }, true);

      const endStroke = (event) => {
        if (!brushStroke || event.pointerId !== brushStroke.pid) return;
        finishBrushStroke();
      };
      document.addEventListener('pointerup', endStroke, true);
      document.addEventListener('pointercancel', endStroke, true);

      document.addEventListener('click', (event) => {
        if (!activeMarker) return;
        const mark = event.target.closest('mark.highlit');
        if (!mark || !mark.closest('.selectable[data-area]')) return;
        if (event.target.closest('#markerbar,button,a,select')) return;
        event.preventDefault();
        event.stopPropagation();
        eraseMarkElement(mark);
      }, true);

      document.addEventListener('dblclick', (event) => {
        if (!activeMarker || activeMarker === 'erase') return;
        if (event.target.closest('mark.highlit,button,a,select,#markerbar,textarea,input')) return;
        if (!event.target.closest('.selectable[data-area]')) return;
        event.preventDefault();
        const caret = caretFromPoint(event.clientX, event.clientY);
        if (!caret || caret.node.nodeType !== Node.TEXT_NODE) return;
        const text = caret.node.textContent;
        let start = caret.offset;
        let end = caret.offset;
        const word = (c) => /[\p{L}\p{N}'’\-]/u.test(c);
        while (start > 0 && word(text[start - 1])) start--;
        while (end < text.length && word(text[end])) end++;
        if (end <= start) return;
        try {
          const range = document.createRange();
          range.setStart(caret.node, start);
          range.setEnd(caret.node, end);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        } catch { return; }
        const spans = captureSelection();
        if (spans.length) applyPaint(activeMarker, spans);
      }, true);
    }

    return { setup, fillSelectable, markedHtml, setActiveMarker };
  }

  global.SustraiMarker = { createMarkerKit, COLORS, escapeHtml };
})(window);
