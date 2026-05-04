(function () {
  'use strict';

  const CORE_STYLE_ID = 'twscripts-core-styles';
  const BASE_TOP = 80;
  const GAP = 10;
  const RIGHT = 10;

  function ensureCoreStyles() {
    if (document.getElementById(CORE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = CORE_STYLE_ID;
    style.textContent = `
/* Core: keep TWscripts UI from fighting with the game UI */
.twscripts-root { isolation: isolate; }
/* Core: we manage stacking by setting inline top; this prevents accidental overlap */
.twscripts-root[data-twscripts-stacked="1"] { right: ${RIGHT}px !important; }
`;
    document.head.appendChild(style);
  }

  function ensureTokens() {
    try {
      if (typeof injectStyles === 'function') injectStyles();
    } catch (_) {
      // If inject.js fails to load for any reason, don't break other scripts.
    }
  }

  function isStackablePanel(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (!el.classList.contains('twscripts-root')) return false;

    const cs = window.getComputedStyle(el);
    if (cs.position !== 'fixed') return false;

    // Only stack right-side panels (the project's convention).
    // If a script wants a different placement, we leave it alone.
    const right = cs.right;
    if (!right || right === 'auto') return false;

    // Avoid stacking transient toasts / overlays that may also use twscripts-root.
    // Heuristic: overlays usually cover the viewport or are centered; right-side panels are narrow.
    const rect = el.getBoundingClientRect();
    if (rect.width > 520) return false;

    return true;
  }

  function stackPanels() {
    const panels = Array.from(document.querySelectorAll('.twscripts-root')).filter(isStackablePanel);

    let top = BASE_TOP;
    for (const el of panels) {
      el.dataset.twscriptsStacked = '1';
      el.style.right = `${RIGHT}px`;
      el.style.top = `${top}px`;

      const rect = el.getBoundingClientRect();
      const h = Math.max(0, Math.round(rect.height));
      top += h + GAP;
    }
  }

  let raf = 0;
  function scheduleStack() {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      try {
        stackPanels();
      } catch (_) {
        // Never break the page due to layout management.
      }
    });
  }

  function init() {
    ensureTokens();
    ensureCoreStyles();
    scheduleStack();

    // Re-stack whenever scripts inject/remove panels.
    const mo = new MutationObserver(scheduleStack);
    mo.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.addEventListener('resize', scheduleStack, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

