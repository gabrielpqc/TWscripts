(function () {
    'use strict';

    const STORAGE_KEY = 'coleta_joe_cfg';
    const ALL_UNITS = ['spear', 'sword', 'axe', 'archer', 'light', 'marcher', 'heavy', 'knight'];
    const SLOT_NAMES = ['Weak Scavenge', 'Humble Scavenge', 'Smart Scavenge', 'Extreme Scavenge'];
    const UNIT_LABELS = {
        spear: 'Spearman', sword: 'Swordsman', axe: 'Axeman', archer: 'Archer',
        light: 'Light Cavalry', marcher: 'Mounted Archer', heavy: 'Heavy Cavalry', knight: 'Paladin'
    };
    let statusEl;

    const DEFAULT_CONFIG = {
        slots: [true, true, true, true],
        units: { spear: true, sword: true, axe: true, archer: true, light: false, marcher: false, heavy: true, knight: false },
        limittemp: '11:00:00'
    };

    function loadConfig() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return {
                slots: Array.isArray(saved.slots) && saved.slots.length === 4 ? saved.slots : DEFAULT_CONFIG.slots.slice(),
                units: Object.assign({}, DEFAULT_CONFIG.units, saved.units || {}),
                limittemp: saved.limittemp || DEFAULT_CONFIG.limittemp
            };
        } catch (e) {
            return { slots: DEFAULT_CONFIG.slots.slice(), units: Object.assign({}, DEFAULT_CONFIG.units), limittemp: DEFAULT_CONFIG.limittemp };
        }
    }

    let config = loadConfig();

    function saveConfig() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    // ── Timing ──────────────────────────────────────────────────────────────
    const serverOff = () => (typeof Timing !== 'undefined' ? Timing.offset_to_server : 0);
    function rand(lo, hi) { return Math.floor(Math.random() * Math.max(1, Math.round(hi - lo))) + lo + serverOff(); }

    // ── Troop helpers ────────────────────────────────────────────────────────
    function getAvailable(unit) {
        const el = document.querySelector(`a.units-entry-all[data-unit="${unit}"]`);
        return el ? (parseInt(el.textContent.replace(/[^0-9]/g, '')) || 0) : 0;
    }

    function setUnit(unit, val) {
        const inp = document.querySelector(`input[name="${unit}"]`);
        if (!inp) return;
        inp.value = val;
        inp.dispatchEvent(new KeyboardEvent('keyup', { key: '0', bubbles: true }));
    }

    function fillTroops(divisor) {
        ALL_UNITS.forEach(u => {
            if (!config.units[u]) { setUnit(u, 0); return; }
            const n = getAvailable(u);
            setUnit(u, n > 0 ? (divisor <= 1 ? n : Math.trunc(n / divisor)) : 0);
        });
    }

    function timeExceeded() {
        const els = document.querySelectorAll('.duration');
        if (!els.length) return false;
        const d = parseInt(els[els.length - 1].textContent.replace(/:/g, ''));
        const l = parseInt(config.limittemp.replace(/:/g, ''));
        return d > l;
    }

    // ── Slot helpers ─────────────────────────────────────────────────────────
    function getAvailableSlots() {
        const opts = document.querySelectorAll('.scavenge-option');
        const result = [];
        opts.forEach((opt, i) => {
            if (!config.slots[i]) return;
            const btn = opt.querySelector('a.btn.btn-default.free_send_button:not(.btn-disabled)');
            if (btn) result.push({ index: i, btn });
        });
        return result;
    }

    // ── Main logic ───────────────────────────────────────────────────────────
    function sendSlots(slots) {
        let divisor = slots.length;
        fillTroops(divisor);

        let attempts = 0;
        while (timeExceeded() && attempts < 15) {
            divisor += 0.5;
            fillTroops(divisor);
            attempts++;
        }

        slots.forEach((slot, i) => {
            const delay = rand(900 + i * 1800, 1600 + i * 2200);
            setTimeout(() => {
                if (i > 0) fillTroops(slots.length - i);
                slot.btn.click();
                updateStatus(`Scavenge ${slot.index + 1} sent`);
            }, delay);
        });
    }

    function checkTimeOver() {
        const countdowns = document.querySelectorAll('.return-countdown');
        for (const cd of countdowns) {
            const parts = cd.textContent.split(':');
            if (parts.length >= 2 && parseInt(parts[1]) < 1) {
                setTimeout(() => window.location.reload(), rand(1200, 2400));
                return;
            }
        }
    }

    function logica() {
        const slots = getAvailableSlots();
        if (slots.length > 0) {
            sendSlots(slots);
        } else {
            checkTimeOver();
            updateStatus('Waiting for scavenges...');
        }
    }

    function altAldeia() {
        const arrow = document.querySelector('.arrowRight');
        const group = document.querySelector('.groupRight');
        if (arrow) arrow.click();
        if (group) group.click();
    }

    logica();
    setInterval(logica, rand(4500, 5500));
    setInterval(() => window.location.reload(), rand(56 * 60000, 64 * 60000));
    setInterval(altAldeia, rand(17500, 52500));

    // ── Status helper ────────────────────────────────────────────────────────
    function updateStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    // ── UI ───────────────────────────────────────────────────────────────────
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
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;margin-bottom:5px;}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover{background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active{transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover{border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;width:100%;display:block;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:10px 0;}
.twscripts-root .cs-check{display:flex;align-items:center;gap:6px;margin:3px 0;cursor:pointer;user-select:none;}
.twscripts-root .cs-check input[type=checkbox]{accent-color:var(--tw-accent);width:13px;height:13px;cursor:pointer;flex-shrink:0;}
.twscripts-root .cs-check span{font-size:11px;color:var(--tw-text-primary);}
.twscripts-root .cs-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px 6px;}
        `;
        document.head.appendChild(s);
    }

    const slotChecks = SLOT_NAMES.map((name, i) => `
        <label class="cs-check">
            <input type="checkbox" id="cs-slot-${i}" ${config.slots[i] ? 'checked' : ''}>
            <span>${name}</span>
        </label>`).join('');

    const unitChecks = ALL_UNITS.map(u => `
        <label class="cs-check">
            <input type="checkbox" id="cs-unit-${u}" ${config.units[u] ? 'checked' : ''}>
            <span>${UNIT_LABELS[u]}</span>
        </label>`).join('');

    const panel = document.createElement('div');
    panel.className = 'twscripts-root';
    panel.style.cssText = 'position:fixed;top:80px;right:10px;z-index:9999;width:260px;';
    panel.innerHTML = `
        <div class="tw-panel tw-panel--accent">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span class="tw-heading" style="font-size:13px;">COLETA - Joe</span>
                <span class="tw-badge tw-badge--cyan">v1.0</span>
            </div>
            <div id="cs-status" style="font-size:11px;color:var(--tw-text-secondary);margin-bottom:8px;min-height:14px;word-break:break-word;">Starting...</div>
            <button id="cs-toggle" class="tw-btn tw-btn--ghost tw-btn--sm" style="width:100%;justify-content:center;">&#9881; Settings &#9660;</button>
            <div id="cs-settings" style="display:none;">
                <hr class="tw-divider">
                <span class="tw-label">Active Scavenges</span>
                ${slotChecks}
                <hr class="tw-divider">
                <span class="tw-label">Units</span>
                <div class="cs-grid">${unitChecks}</div>
                <hr class="tw-divider">
                <span class="tw-label">Max Time</span>
                <input id="cs-limittemp" class="tw-input" type="text" value="${config.limittemp}" placeholder="HH:MM:SS" style="margin-bottom:8px;">
                <button id="cs-save" class="tw-btn tw-btn--primary" style="width:100%;justify-content:center;">Save</button>
                <div id="cs-save-msg" style="font-size:10px;color:var(--tw-success);text-align:center;margin-top:4px;min-height:14px;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    statusEl = panel.querySelector('#cs-status');

    const toggleBtn = panel.querySelector('#cs-toggle');
    const settingsDiv = panel.querySelector('#cs-settings');
    let open = false;
    toggleBtn.addEventListener('click', () => {
        open = !open;
        settingsDiv.style.display = open ? 'block' : 'none';
        toggleBtn.innerHTML = `&#9881; Settings ${open ? '&#9650;' : '&#9660;'}`;
    });

    panel.querySelector('#cs-save').addEventListener('click', () => {
        config.slots = SLOT_NAMES.map((_, i) => panel.querySelector(`#cs-slot-${i}`).checked);
        config.units = {};
        ALL_UNITS.forEach(u => { config.units[u] = panel.querySelector(`#cs-unit-${u}`).checked; });
        config.limittemp = panel.querySelector('#cs-limittemp').value.trim() || DEFAULT_CONFIG.limittemp;
        saveConfig();
        const msg = panel.querySelector('#cs-save-msg');
        msg.textContent = 'Saved!';
        setTimeout(() => { msg.textContent = ''; }, 2000);
    });

})();
