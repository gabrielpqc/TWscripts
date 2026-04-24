/**
 * TWscripts UI — style injector
 * Call injectStyles() once per script. Safe to call multiple times.
 */

const FONTS_ID = 'twscripts-fonts';
const TOKENS_ID = 'twscripts-tokens';

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700' +
  '&family=IBM+Plex+Sans:wght@400;500;600' +
  '&family=JetBrains+Mono:wght@400;500&display=swap';

const CSS = `
.twscripts-root {
  --tw-bg-base:#090D18;--tw-bg-surface:#111827;--tw-bg-elevated:#1C2333;--tw-bg-hover:#243048;
  --tw-accent:#00C8FF;--tw-accent-dim:#0A8EBF;--tw-amber:#F59E0B;--tw-amber-dim:#92600A;
  --tw-text-primary:#E8EDF5;--tw-text-secondary:#8899BB;--tw-text-disabled:#4A5568;
  --tw-border:#2A3550;--tw-border-strong:#3D4F72;
  --tw-success:#22C55E;--tw-danger:#EF4444;--tw-danger-dim:#7F1D1D;
  --tw-font-heading:'Space Grotesk',system-ui,sans-serif;
  --tw-font-body:'IBM Plex Sans',system-ui,sans-serif;
  --tw-font-mono:'JetBrains Mono','Fira Code',monospace;
  --tw-radius-sm:3px;--tw-radius:6px;--tw-radius-lg:10px;
  --tw-space-1:4px;--tw-space-2:8px;--tw-space-3:12px;--tw-space-4:16px;--tw-space-6:24px;
  --tw-shadow:0 4px 12px rgba(0,0,0,.5);--tw-shadow-lg:0 8px 24px rgba(0,0,0,.6);
  --tw-glow-cyan:0 0 12px rgba(0,200,255,.25);
  font-family:var(--tw-font-body);font-size:14px;color:var(--tw-text-primary);line-height:1.5;
}
.twscripts-root *{box-sizing:border-box;}
.twscripts-root .tw-panel{background:var(--tw-bg-surface);border:1px solid var(--tw-border);border-radius:var(--tw-radius);padding:var(--tw-space-4);}
.twscripts-root .tw-panel--accent{border-left:3px solid var(--tw-accent);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:13px;font-weight:500;padding:6px 14px;border-radius:var(--tw-radius-sm);cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:8px;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover{background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active{transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover{border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--danger{background:var(--tw-danger);color:#fff;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root .tw-input,.twscripts-root .tw-select{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:var(--tw-radius-sm);color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:13px;padding:6px 10px;transition:border-color 150ms ease;width:100%;}
.twscripts-root .tw-input:focus,.twscripts-root .tw-select:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.12);}
.twscripts-root .tw-table{width:100%;border-collapse:collapse;font-size:13px;}
.twscripts-root .tw-table th{font-family:var(--tw-font-heading);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-accent);border-bottom:1px solid var(--tw-border);padding:8px 12px;text-align:left;}
.twscripts-root .tw-table td{padding:8px 12px;border-bottom:1px solid var(--tw-border);}
.twscripts-root .tw-table tr:hover td{background:var(--tw-bg-hover);}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:500;padding:2px 7px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-badge--amber{background:rgba(245,158,11,.12);color:var(--tw-amber);border:1px solid rgba(245,158,11,.2);}
.twscripts-root .tw-badge--green{background:rgba(34,197,94,.12);color:var(--tw-success);border:1px solid rgba(34,197,94,.2);}
.twscripts-root .tw-badge--red{background:rgba(239,68,68,.12);color:var(--tw-danger);border:1px solid rgba(239,68,68,.2);}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:16px 0;}
.twscripts-root .tw-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(2px);z-index:9000;display:flex;align-items:center;justify-content:center;}
.twscripts-root .tw-modal{background:var(--tw-bg-surface);border:1px solid var(--tw-border-strong);border-radius:var(--tw-radius-lg);padding:24px;min-width:320px;max-width:560px;box-shadow:var(--tw-shadow-lg);}
.twscripts-root .tw-modal__header{font-family:var(--tw-font-heading);font-size:16px;font-weight:600;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--tw-border);}
.twscripts-root .tw-toast{position:fixed;bottom:20px;right:20px;background:var(--tw-bg-elevated);border:1px solid var(--tw-border-strong);border-radius:var(--tw-radius);padding:12px 16px;font-size:13px;box-shadow:var(--tw-shadow-lg);z-index:9999;animation:tw-slide-in 200ms ease;}
.twscripts-root .tw-toast--success{border-left:3px solid var(--tw-success);}
.twscripts-root .tw-toast--error{border-left:3px solid var(--tw-danger);}
.twscripts-root .tw-toast--info{border-left:3px solid var(--tw-accent);}
@keyframes tw-slide-in{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
.twscripts-root .tw-mono{font-family:var(--tw-font-mono);font-size:11px;color:var(--tw-text-secondary);}
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;}
.twscripts-root .tw-text-accent{color:var(--tw-accent);}
.twscripts-root .tw-text-amber{color:var(--tw-amber);}
.twscripts-root .tw-text-muted{color:var(--tw-text-secondary);}
.twscripts-root .tw-text-success{color:var(--tw-success);}
.twscripts-root .tw-text-danger{color:var(--tw-danger);}
`;

function injectStyles() {
  if (!document.getElementById(FONTS_ID)) {
    const link = document.createElement('link');
    link.id = FONTS_ID;
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  if (!document.getElementById(TOKENS_ID)) {
    const style = document.createElement('style');
    style.id = TOKENS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }
}

/**
 * Create a scoped root div. All TWscripts UI goes inside this.
 * @param {string} [id] - optional id for the root element
 */
function createRoot(id) {
  const el = document.createElement('div');
  el.className = 'twscripts-root';
  if (id) el.id = id;
  return el;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'info'|'success'|'error'} [type='info']
 * @param {number} [duration=3000]
 */
function showToast(message, type = 'info', duration = 3000) {
  injectStyles();
  const root = document.createElement('div');
  root.className = 'twscripts-root';
  const toast = document.createElement('div');
  toast.className = `tw-toast tw-toast--${type}`;
  toast.textContent = message;
  root.appendChild(toast);
  document.body.appendChild(root);
  setTimeout(() => root.remove(), duration);
}

// Export for use in scripts
if (typeof module !== 'undefined') {
  module.exports = { injectStyles, createRoot, showToast };
}
