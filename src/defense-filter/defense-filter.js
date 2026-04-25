(function () {
    'use strict';

    // ── Guards ──────────────────────────────────────────────────────────────
    const table = document.getElementById('units_home') || document.getElementById('units_table');
    if (!table) return;

    // ── Helpers ─────────────────────────────────────────────────────────────
    function getRows() {
        return Array.from(table.querySelectorAll('tr')).filter(row =>
            row.querySelector('input[type="checkbox"]')
        );
    }

    function getPlayerName(row) {
        let anchor = row.querySelector('a[href*="info_player"]');
        if (location.href.includes('&screen=place&mode=units')) {
            anchor = row.querySelector('.village_anchor a');
        }
        if (!anchor) return '';
        const text = anchor.textContent.trim();
        const match = text.match(/\(([^)]+)\)\s*\(\d+\|\d+\)/);
        return match ? match[1].trim() : text;
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
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;color:var(--tw-text-primary);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover:not(:disabled){background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active:not(:disabled){transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover:not(:disabled){border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-input::placeholder{color:var(--tw-text-secondary);opacity:.6;}
        `;
        document.head.appendChild(s);
    }

    const panel = document.createElement('div');
    panel.className = 'twscripts-root';
    panel.style.cssText = 'margin:10px 0;';
    panel.innerHTML = `
        <div class="tw-panel tw-panel--accent" style="display:inline-flex;align-items:center;gap:8px;padding:8px 12px;">
            <span class="tw-heading" style="font-size:13px;">Filter by player</span>
            <input id="defense-filter-input" class="tw-input" type="text" placeholder="e.g. Average Joe" style="width:180px;" />
            <button id="defense-filter-select" class="tw-btn tw-btn--primary tw-btn--sm">Select matching</button>
            <button id="defense-filter-deselect" class="tw-btn tw-btn--ghost tw-btn--sm">Deselect all</button>
            <span id="defense-filter-status" style="font-size:11px;color:var(--tw-text-secondary);min-width:100px;"></span>
        </div>
    `;
    table.parentNode.insertBefore(panel, table);

    const inputEl     = panel.querySelector('#defense-filter-input');
    const btnSelect   = panel.querySelector('#defense-filter-select');
    const btnDeselect = panel.querySelector('#defense-filter-deselect');
    const statusEl    = panel.querySelector('#defense-filter-status');

    btnSelect.addEventListener('click', (e) => {
        e.preventDefault();
        const query = inputEl.value.trim().toLowerCase();
        if (!query) { statusEl.textContent = 'Enter a player name first.'; return; }

        let matched = 0;
        getRows().forEach(row => {
            const cb = row.querySelector('input[type="checkbox"]');
            const player = getPlayerName(row).toLowerCase();
            if (player.includes(query)) {
                cb.checked = true;
                matched++;
            }
        });
        statusEl.textContent = `${matched} village(s) selected.`;
    });

    btnDeselect.addEventListener('click', () => {
        getRows().forEach(row => {
            row.querySelector('input[type="checkbox"]').checked = false;
        });
        statusEl.textContent = 'All deselected.';
    });

    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') btnSelect.click();
    });

})();
