(function () {
    'use strict';

    const RADIUS = 30;

    // --- Helpers ---
    const hasGameData = () => typeof window.game_data !== 'undefined' && game_data.village;
    const worldKey = () => (hasGameData() && game_data.world) || window.location.host.split('.')[0];

    function decodeCoordsFromKey(key) {
        const xy = parseInt(key, 10);
        return { x: Math.floor(xy / 1000), y: xy % 1000 };
    }

    function distanceXY(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Iterate TWMap.villages regardless of shape:
    // - Object: { "480533": { ... }, "480534": { ... } }
    // - Array of keyed objects: [ { "480533": { ... } }, { "480534": { ... } } ]
    function forEachVillage(cb) {
        const src = window.TWMap && TWMap.villages;
        if (!src) return;

        if (Array.isArray(src)) {
            src.forEach(entry => {
                for (const key in entry) {
                    if (!entry.hasOwnProperty(key)) continue;
                    cb(key, entry[key]);
                }
            });
        } else {
            for (const key in src) {
                if (!src.hasOwnProperty(key)) continue;
                cb(key, src[key]);
            }
        }
    }

    function getMapVillages() {
        const list = [];
        forEachVillage((key, v) => {
            // Prefer key for coords; fall back to v.xy if present
            const coords = decodeCoordsFromKey(key);
            list.push({
                key,               // the map key (xy-encoded)
                id: v.id,          // real village id for links
                name: v.name,
                owner: String(v.owner),
                x: coords.x,
                y: coords.y
            });
        });
        return list;
    }

    function storageKey() {
        return `barbarianVillages_${worldKey()}`;
    }

    function loadStoredVillages() {
        try {
            return JSON.parse(localStorage.getItem(storageKey()) || '[]');
        } catch {
            return [];
        }
    }

    function saveVillages(arr) {
        localStorage.setItem(storageKey(), JSON.stringify(arr));
    }

    function showPopup(newOnes, currentVillageId) {
        const rows = newOnes.map(v => `
            <tr>
                <td>${v.name || 'Barbarian Village'}</td>
                <td class="mono">${v.x}|${v.y}</td>
                <td style="text-align:right;">
                    <a href="/game.php?village=${currentVillageId}&screen=info_village&id=${v.id}"
                       target="_blank" class="tw-btn tw-btn--ghost tw-btn--sm">Open</a>
                </td>
            </tr>
        `).join('');

        const content = `
            <div class="twscripts-root">
                <div class="tw-panel tw-panel--amber" style="min-width:320px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <span class="tw-heading" style="font-size:14px;">New Barbarian Villages</span>
                        <span class="tw-badge tw-badge--amber">${newOnes.length} new</span>
                    </div>
                    <table class="tw-table">
                        <thead>
                            <tr>
                                <th>Village</th>
                                <th>Coords</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            </div>
        `;
        Dialog.show('barb_finder', content);
    }

    function run() {
        if (!hasGameData()) return;
        if (typeof TWMap === 'undefined' || !TWMap.villages) return;

        const current = {
            id: game_data.village.id,
            x: game_data.village.x,
            y: game_data.village.y
        };

        const villages = getMapVillages();
        const barbarians = villages.filter(v => v.owner === '0');

        const nearby = barbarians.filter(v => distanceXY(v, current) <= RADIUS);

        // localStorage de-dup by real village id
        const stored = loadStoredVillages();
        const storedIds = new Set(stored.map(v => String(v.id)));

        const newOnes = nearby.filter(v => !storedIds.has(String(v.id)));

        if (newOnes.length > 0) {
            const updated = stored.concat(newOnes);
            saveVillages(updated);
            showPopup(newOnes, current.id);
        }
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
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;color:var(--tw-text-primary);}
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-badge--amber{background:rgba(245,158,11,.12);color:var(--tw-amber);border:1px solid rgba(245,158,11,.2);}
.twscripts-root .tw-badge--green{background:rgba(34,197,94,.12);color:var(--tw-success);border:1px solid rgba(34,197,94,.2);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover:not(:disabled){background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active:not(:disabled){transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover:not(:disabled){border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root a.tw-btn{text-decoration:none;}
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

    // Run after map initializes
    const start = () => setTimeout(run, 1500);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
