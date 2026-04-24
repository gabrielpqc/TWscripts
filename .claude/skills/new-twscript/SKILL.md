# new-twscript

Scaffold a new Tribal Wars userscript with the Dark Command design system applied. Creates the folder, the logic file, and the root interface (installer) file.

## Trigger

`/new-twscript` or "create new twscript", "new TW script", "scaffold twscript"

## Step 1 — Gather info

Ask the user for these if not already provided in the command args:

| Field | Example |
|-------|---------|
| **slug** | `farm-assistant` (kebab-case, used for folder + filename) |
| **display name** | `Farm Assistant` |
| **description** | `Auto-sends farm attacks from queue` |
| **@match URL** | `https://*/game.php*screen=place*` |
| **UI type** | `panel` (fixed overlay) · `dialog` (TW Dialog.show) · `both` |

If the user provides all in one message (e.g. `/new-twscript farm-assistant "Farm Assistant" ...`), skip asking and proceed.

---

## Step 2 — Create files

Create these 2 files using the templates below. Replace all `{{PLACEHOLDER}}` values.

### File 1 — Root interface: `<slug>.js`

Path: `<project-root>/<slug>.js`  (root only — no subfolders here)

```js
// ==UserScript==
// @name         Joe - {{DISPLAY_NAME}}
// @author       Average Joe
// @namespace    tribalwars.{{SLUG}}
// @version      1.0
// @description  {{DESCRIPTION}}
// @match        {{MATCH_URL}}
// @require      https://raw.githubusercontent.com/gabrielpqc/TWscripts/refs/heads/main/src/{{SLUG}}/{{SLUG}}.js
// @icon         https://raw.githubusercontent.com/gabrielpqc/TWscripts/refs/heads/main/assets/icon.webp
// ==/UserScript==
```

> Note: if slug contains spaces or special characters, URL-encode them in the @require line (e.g. space → `%20`). Kebab-case slugs need no encoding.

---

### File 2 — Script logic: `src/<slug>/<slug>.js`

Path: `<project-root>/src/<slug>/<slug>.js`

Use the appropriate template based on **UI type**.

#### Template A — Panel (fixed overlay)

```js
(function () {
    'use strict';

    // ── Guards ──────────────────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    // TODO: add screen/mode guards if needed
    // if (params.get('screen') !== 'SCREEN_NAME') return;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ── Core logic ──────────────────────────────────────────────────────────
    // TODO: implement script logic here

    // ── UI ──────────────────────────────────────────────────────────────────
    if (!document.getElementById('twscripts-fonts')) {
        const link = document.createElement('link');
        link.id = 'twscripts-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap';
        document.head.appendChild(link);
    }
    if (!document.getElementById('twscripts-tokens')) {
        const s = document.createElement('style');
        s.id = 'twscripts-tokens';
        s.textContent = `
.twscripts-root{--tw-bg-surface:#111827;--tw-bg-elevated:#1C2333;--tw-bg-hover:#243048;--tw-accent:#00C8FF;--tw-accent-dim:#0A8EBF;--tw-amber:#F59E0B;--tw-text-primary:#E8EDF5;--tw-text-secondary:#8899BB;--tw-border:#2A3550;--tw-border-strong:#3D4F72;--tw-success:#22C55E;--tw-danger:#EF4444;--tw-font-heading:'Space Grotesk',system-ui,sans-serif;--tw-font-body:'IBM Plex Sans',system-ui,sans-serif;--tw-font-mono:'JetBrains Mono','Fira Code',monospace;--tw-glow-cyan:0 0 12px rgba(0,200,255,.25);}
.twscripts-root *{box-sizing:border-box;}
.twscripts-root .tw-panel{background:var(--tw-bg-surface);border:1px solid var(--tw-border);border-radius:6px;padding:14px;font-family:var(--tw-font-body);font-size:13px;color:var(--tw-text-primary);}
.twscripts-root .tw-panel--accent{border-left:3px solid var(--tw-accent);}
.twscripts-root .tw-panel--amber{border-left:3px solid var(--tw-amber);}
.twscripts-root .tw-panel--danger{border-left:3px solid var(--tw-danger);}
.twscripts-root .tw-panel--success{border-left:3px solid var(--tw-success);}
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;color:var(--tw-text-primary);}
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-badge--amber{background:rgba(245,158,11,.12);color:var(--tw-amber);border:1px solid rgba(245,158,11,.2);}
.twscripts-root .tw-badge--green{background:rgba(34,197,94,.12);color:var(--tw-success);border:1px solid rgba(34,197,94,.2);}
.twscripts-root .tw-badge--red{background:rgba(239,68,68,.12);color:var(--tw-danger);border:1px solid rgba(239,68,68,.2);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover:not(:disabled){background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active:not(:disabled){transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover:not(:disabled){border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--danger{background:var(--tw-danger);color:#fff;}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root a.tw-btn{text-decoration:none;}
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;width:100%;display:block;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-input::placeholder{color:var(--tw-text-secondary);opacity:.6;}
.twscripts-root textarea.tw-input{resize:vertical;line-height:1.5;}
.twscripts-root .tw-table{width:100%;border-collapse:collapse;font-size:12px;}
.twscripts-root .tw-table th{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-accent);border-bottom:1px solid var(--tw-border);padding:6px 10px;text-align:left;}
.twscripts-root .tw-table td{padding:6px 10px;border-bottom:1px solid var(--tw-border);color:var(--tw-text-primary);}
.twscripts-root .tw-table tr:last-child td{border-bottom:none;}
.twscripts-root .tw-table tr:hover td{background:var(--tw-bg-hover);}
.twscripts-root .tw-table .mono{font-family:var(--tw-font-mono);font-size:11px;color:var(--tw-text-secondary);}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:10px 0;}
        `;
        document.head.appendChild(s);
    }

    const panel = document.createElement('div');
    panel.className = 'twscripts-root';
    panel.style.cssText = 'position:fixed;top:80px;right:10px;z-index:9999;width:260px;';
    panel.innerHTML = `
        <div class="tw-panel tw-panel--accent">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <span class="tw-heading" style="font-size:14px;">{{DISPLAY_NAME}}</span>
                <span class="tw-badge tw-badge--cyan">v1.0</span>
            </div>
            <!-- TODO: add controls -->
            <button id="{{SLUG}}-run" class="tw-btn tw-btn--primary" style="width:100%;justify-content:center;">
                Run
            </button>
            <div id="{{SLUG}}-status" style="margin-top:8px;font-size:11px;color:var(--tw-text-secondary);word-break:break-word;min-height:14px;"></div>
        </div>
    `;
    document.body.appendChild(panel);

    const statusEl = panel.querySelector('#{{SLUG}}-status');
    const runBtn   = panel.querySelector('#{{SLUG}}-run');

    runBtn.addEventListener('click', async () => {
        runBtn.disabled = true;
        statusEl.textContent = 'Running…';
        try {
            // TODO: call core logic
            statusEl.textContent = 'Done.';
        } catch (e) {
            statusEl.textContent = 'Error: ' + e.message;
        }
        runBtn.disabled = false;
    });

})();
```

#### Template B — Dialog (TW Dialog.show)

```js
(function () {
    'use strict';

    // ── Guards ──────────────────────────────────────────────────────────────
    // TODO: add run conditions / event hooks

    // ── Core logic ──────────────────────────────────────────────────────────
    // TODO: implement script logic here

    function showDialog(data) {
        const rows = data.map(item => `
            <tr>
                <td>${item.name}</td>
                <td class="mono">${item.value}</td>
            </tr>
        `).join('');

        const content = `
            <div class="twscripts-root">
                <div class="tw-panel tw-panel--accent" style="min-width:320px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <span class="tw-heading" style="font-size:14px;">{{DISPLAY_NAME}}</span>
                        <span class="tw-badge tw-badge--cyan">${data.length} items</span>
                    </div>
                    <table class="tw-table">
                        <thead><tr><th>Name</th><th>Value</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
        Dialog.show('{{SLUG}}', content);
    }

    // ── UI ──────────────────────────────────────────────────────────────────
    if (!document.getElementById('twscripts-fonts')) {
        const link = document.createElement('link');
        link.id = 'twscripts-fonts';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400&display=swap';
        document.head.appendChild(link);
    }
    if (!document.getElementById('twscripts-tokens')) {
        const s = document.createElement('style');
        s.id = 'twscripts-tokens';
        s.textContent = `
.twscripts-root{--tw-bg-surface:#111827;--tw-bg-elevated:#1C2333;--tw-bg-hover:#243048;--tw-accent:#00C8FF;--tw-accent-dim:#0A8EBF;--tw-amber:#F59E0B;--tw-text-primary:#E8EDF5;--tw-text-secondary:#8899BB;--tw-border:#2A3550;--tw-border-strong:#3D4F72;--tw-success:#22C55E;--tw-danger:#EF4444;--tw-font-heading:'Space Grotesk',system-ui,sans-serif;--tw-font-body:'IBM Plex Sans',system-ui,sans-serif;--tw-font-mono:'JetBrains Mono','Fira Code',monospace;--tw-glow-cyan:0 0 12px rgba(0,200,255,.25);}
.twscripts-root *{box-sizing:border-box;}
.twscripts-root .tw-panel{background:var(--tw-bg-surface);border:1px solid var(--tw-border);border-radius:6px;padding:14px;font-family:var(--tw-font-body);font-size:13px;color:var(--tw-text-primary);}
.twscripts-root .tw-panel--accent{border-left:3px solid var(--tw-accent);}
.twscripts-root .tw-panel--amber{border-left:3px solid var(--tw-amber);}
.twscripts-root .tw-panel--danger{border-left:3px solid var(--tw-danger);}
.twscripts-root .tw-panel--success{border-left:3px solid var(--tw-success);}
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;color:var(--tw-text-primary);}
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-badge--amber{background:rgba(245,158,11,.12);color:var(--tw-amber);border:1px solid rgba(245,158,11,.2);}
.twscripts-root .tw-badge--green{background:rgba(34,197,94,.12);color:var(--tw-success);border:1px solid rgba(34,197,94,.2);}
.twscripts-root .tw-badge--red{background:rgba(239,68,68,.12);color:var(--tw-danger);border:1px solid rgba(239,68,68,.2);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover:not(:disabled){background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active:not(:disabled){transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover:not(:disabled){border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--danger{background:var(--tw-danger);color:#fff;}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root a.tw-btn{text-decoration:none;}
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;width:100%;display:block;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-input::placeholder{color:var(--tw-text-secondary);opacity:.6;}
.twscripts-root textarea.tw-input{resize:vertical;line-height:1.5;}
.twscripts-root .tw-table{width:100%;border-collapse:collapse;font-size:12px;}
.twscripts-root .tw-table th{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-accent);border-bottom:1px solid var(--tw-border);padding:6px 10px;text-align:left;}
.twscripts-root .tw-table td{padding:6px 10px;border-bottom:1px solid var(--tw-border);color:var(--tw-text-primary);}
.twscripts-root .tw-table tr:last-child td{border-bottom:none;}
.twscripts-root .tw-table tr:hover td{background:var(--tw-bg-hover);}
.twscripts-root .tw-table .mono{font-family:var(--tw-font-mono);font-size:11px;color:var(--tw-text-secondary);}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:10px 0;}
        `;
        document.head.appendChild(s);
    }

    // Run after page initializes
    const start = () => setTimeout(() => {
        // TODO: call showDialog with real data
    }, 1500);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
```

---

## Step 3 — Confirm output

After creating both files, report back:

```
Created:
  src/<slug>/<slug>.js  ← script logic (design system applied)
  <slug>.js             ← userscript installer (@require → GitHub raw)

Install in Tampermonkey: paste contents of <slug>.js (root file).
GitHub raw URL: https://raw.githubusercontent.com/gabrielpqc/TWscripts/refs/heads/main/src/<slug>/<slug>.js
```

---

## Design system rules (always apply)

- All UI inside `<div class="twscripts-root">` — scopes CSS away from TW game styles
- CSS injected once via `twscripts-tokens` ID guard — idempotent
- Fixed panels: `position:fixed; top:80px; right:10px; z-index:9999; width:260px`
- Dialog content: wrap in `.twscripts-root > .tw-panel`
- Accent stripe: `--accent` cyan for info/action, `--amber` for warnings, `--danger` for destructive
- Button IDs: `<slug>-<action>` (e.g. `farm-assistant-run`)
- Status div ID: `<slug>-status`
- Never use `element.style.opacity` to fake disabled — use `element.disabled` and let CSS handle it

## GitHub username
`gabrielpqc` — always use this in @require and @icon URLs.
