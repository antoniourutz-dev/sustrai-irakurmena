/* SUSTRAI highlighter toolbar: placement, dragging and touch behaviour shared by every workshop.
   Wide screens: a floating bar that can be dragged and never leaves the viewport.
   Phones: the stylesheet docks it, so no inline position is applied. */
(function (global) {
  const KEY = 'sustrai-markerbar-pos';
  const MARGIN = 8;
  const floating = global.matchMedia('(min-width:761px)');
  let lastPointer = 'mouse';
  document.addEventListener('pointerdown', (event) => { lastPointer = event.pointerType || 'mouse'; }, true);

  function storage() {
    return (global.SustraiCloud && global.SustraiCloud.storage) || global.localStorage;
  }

  function init(bar, handle) {
    if (!bar || bar.dataset.barReady) return;
    bar.dataset.barReady = '1';
    let wanted = null;
    let drag = null;
    try {
      const saved = JSON.parse(storage().getItem(KEY));
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) wanted = saved;
    } catch {}

    function place() {
      if (!floating.matches || !wanted) {
        bar.style.left = bar.style.top = bar.style.bottom = '';
        return;
      }
      const width = bar.offsetWidth;
      const height = bar.offsetHeight;
      if (!width || !height) return;
      const left = Math.min(Math.max(MARGIN, wanted.left), Math.max(MARGIN, global.innerWidth - width - MARGIN));
      const top = Math.min(Math.max(MARGIN, wanted.top), Math.max(MARGIN, global.innerHeight - height - MARGIN));
      bar.style.left = left + 'px';
      bar.style.top = top + 'px';
      bar.style.bottom = 'auto';
    }

    // Re-clamp whenever the bar appears or the window changes.
    if (global.ResizeObserver) new ResizeObserver(place).observe(bar);
    global.addEventListener('resize', place);
    if (floating.addEventListener) floating.addEventListener('change', place);
    place();

    if (!handle) return;
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || !floating.matches) return;
      event.preventDefault();
      const rect = bar.getBoundingClientRect();
      drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, pid: event.pointerId };
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pid) return;
      wanted = { left: event.clientX - drag.dx, top: event.clientY - drag.dy };
      place();
    });
    const end = (event) => {
      if (!drag || event.pointerId !== drag.pid) return;
      drag = null;
      const rect = bar.getBoundingClientRect();
      wanted = { left: rect.left, top: rect.top };
      try { storage().setItem(KEY, JSON.stringify(wanted)); } catch {}
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  // True while there is a text selection inside a markable area.
  function hasSelection() {
    const selection = global.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return false;
    const range = selection.getRangeAt(0);
    return [...document.querySelectorAll('.selectable[data-area]')].some((el) => range.intersectsNode(el));
  }

  // With a finger the page must keep scrolling, so there is no drag-to-paint: the student selects
  // text the native way and, if a tool is active, the selection is painted once it settles.
  function isTouch() { return lastPointer === 'touch'; }

  function touchAutoApply(getTool, apply) {
    let timer = 0;
    document.addEventListener('selectionchange', () => {
      clearTimeout(timer);
      if (!isTouch() || !getTool()) return;
      timer = setTimeout(() => {
        const tool = getTool();
        if (tool && isTouch() && hasSelection()) apply(tool);
      }, 900);
    });
  }

  global.SustraiMarkerBar = { init, hasSelection, isTouch, touchAutoApply };
})(window);
