(function () {
    'use strict';

    if (new URLSearchParams(window.location.search).get('screen') !== 'market') return;

    // ── Config ──────────────────────────────────────────────────────────────
    const DEFAULT_CONFIG = {
        SELL_PERCENTAGE: 0.9,
        MIN_REMAINING_CAPACITY: 1000,
        USE_MERCHANT_LIMIT: true,
        PAGE_RELOAD_INTERVAL: 15000,
        RANDOM_INTERVAL_MIN: 50,
        RANDOM_INTERVAL_MAX: 180,
        ENABLED: false
    };

    let config = Object.assign({}, DEFAULT_CONFIG, GM_getValue('sellerConfig', {}));
    let reloadInterval;

    // ── Helpers ─────────────────────────────────────────────────────────────
    const parseNum = el => el ? parseInt(el.innerText.replace(/\D/g, ''), 10) || 0 : 0;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // ── Core logic ──────────────────────────────────────────────────────────
    function getMerchantInfo() {
        return {
            available: parseNum(document.getElementById('market_merchant_available_count')),
            total: parseNum(document.getElementById('market_merchant_total_count')),
            maxTransport: parseNum(document.getElementById('market_merchant_max_transport')),
        };
    }

    function getVillageStock() {
        const stock = {};
        for (const res of ['wood', 'stone', 'iron']) {
            stock[res] = parseNum(document.getElementById(res));
        }
        return stock;
    }

    function getResourceInfo() {
        return ['wood', 'stone', 'iron'].map(res => ({
            res,
            stock: parseNum(document.getElementById(`premium_exchange_stock_${res}`)),
            capacity: parseNum(document.getElementById(`premium_exchange_capacity_${res}`)),
        })).map(r => ({ ...r, remaining: r.capacity - r.stock }));
    }

    // Accept any native browser confirm/alert dialogs
    window.confirm = () => true;
    window.alert   = () => undefined;

    function clickConfirmButton() {
        const checkDialog = setInterval(() => {
            // TW premium exchange confirmation dialog OR any visible popup with a yes/confirm button
            const confirmBtn = document.querySelector(
                '.confirmation-box .btn-confirm-yes, ' +
                '.popup_box .btn-confirm-yes, ' +
                'a.btn-confirm-yes, ' +
                'input.btn-confirm-yes'
            );
            const dialog = document.querySelector('.confirmation-box, .popup_box');
            const dialogVisible = dialog && dialog.style.display !== 'none' && dialog.style.visibility !== 'hidden';

            if (dialogVisible && confirmBtn) {
                clearInterval(checkDialog);
                confirmBtn.addEventListener('click', () => {
                    const delay = Math.random() * 65 + 420;
                    setTimeout(() => window.location.reload(), delay);
                });
                confirmBtn.click();
            }
        }, 20);

        // Safety: stop polling after 5s to avoid hanging interval
        setTimeout(() => clearInterval(checkDialog), 5000);
    }

    async function checkAndSell(statusEl, runBtn) {
        const merchants = getMerchantInfo();
        const resources = getResourceInfo();
        const villageStock = getVillageStock();
        const totalTransport = merchants.available * merchants.maxTransport;

        updateStatus(statusEl, `Merchants: ${merchants.available}/${merchants.total} · Transport: ${totalTransport.toLocaleString()}`);

        const sellAmounts = {};
        for (const { res, remaining } of resources) {
            if (villageStock[res] <= 0 || remaining < config.MIN_REMAINING_CAPACITY) {
                sellAmounts[res] = 0;
                continue;
            }
            sellAmounts[res] = Math.min(Math.floor(remaining * config.SELL_PERCENTAGE), villageStock[res]);
        }

        if (config.USE_MERCHANT_LIMIT && totalTransport > 0) {
            const totalDesired = Object.values(sellAmounts).reduce((a, b) => a + b, 0);
            if (totalDesired > totalTransport) {
                const scale = totalTransport / totalDesired;
                for (const res of ['wood', 'stone', 'iron']) {
                    sellAmounts[res] = Math.floor(sellAmounts[res] * scale);
                }
            }
        }

        let anySell = false;
        for (const res of ['wood', 'stone', 'iron']) {
            if (sellAmounts[res] <= 0) continue;
            const input = document.querySelector(`input[name="sell_${res}"]`);
            if (input && !input.disabled) {
                input.value = sellAmounts[res];
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                anySell = true;
            }
        }

        if (!anySell) {
            updateStatus(statusEl, 'No capacity available. Reloading…');
            const delay = Math.random() * 3800 + 200;
            setTimeout(() => window.location.reload(), delay);
            return;
        }

        const delay = Math.random() * (config.RANDOM_INTERVAL_MAX - config.RANDOM_INTERVAL_MIN) + config.RANDOM_INTERVAL_MIN;
        updateStatus(statusEl, `Selling in ${Math.round(delay)}ms…`);

        setTimeout(() => {
            const btn = document.querySelector('.btn-premium-exchange-buy');
            if (btn) {
                btn.click();
                clickConfirmButton();
            } else {
                window.location.reload();
            }
        }, delay);
    }

    function updateStatus(el, msg) {
        if (el) el.textContent = msg;
        console.log('[resource-seller]', msg);
    }

    function saveConfig() {
        config = {
            ENABLED: document.getElementById('resource-seller-enabled').checked,
            SELL_PERCENTAGE: parseInt(document.getElementById('resource-seller-pct').value) / 100,
            MIN_REMAINING_CAPACITY: parseInt(document.getElementById('resource-seller-min-cap').value),
            USE_MERCHANT_LIMIT: document.getElementById('resource-seller-merchant-limit').checked,
            PAGE_RELOAD_INTERVAL: parseInt(document.getElementById('resource-seller-reload').value) * 1000,
            RANDOM_INTERVAL_MIN: parseInt(document.getElementById('resource-seller-rnd-min').value),
            RANDOM_INTERVAL_MAX: parseInt(document.getElementById('resource-seller-rnd-max').value),
        };
        GM_setValue('sellerConfig', config);
        restartIntervals();
        const saved = document.getElementById('resource-seller-saved');
        if (saved) { saved.style.display = 'block'; setTimeout(() => saved.style.display = 'none', 2000); }
    }

    function restartIntervals() {
        if (reloadInterval) clearInterval(reloadInterval);
        if (config.ENABLED) {
            reloadInterval = setInterval(() => window.location.reload(), config.PAGE_RELOAD_INTERVAL);
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
.twscripts-root .tw-panel--success{border-left:3px solid var(--tw-success);}
.twscripts-root .tw-heading{font-family:var(--tw-font-heading);font-weight:600;color:var(--tw-text-primary);}
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;margin-bottom:3px;}
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
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;width:100%;display:block;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:10px 0;}
.twscripts-root .tw-row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}
.twscripts-root .tw-check-row{display:flex;align-items:center;gap:6px;margin-bottom:8px;cursor:pointer;}
.twscripts-root .tw-check-row input[type=checkbox]{accent-color:var(--tw-accent);width:13px;height:13px;}
.twscripts-root .tw-res-bar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px;}
.twscripts-root .tw-res-cell{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;padding:4px 6px;text-align:center;}
.twscripts-root .tw-res-cell .res-name{font-size:9px;text-transform:uppercase;letter-spacing:.04em;color:var(--tw-text-secondary);display:block;}
.twscripts-root .tw-res-cell .res-val{font-family:var(--tw-font-mono);font-size:11px;color:var(--tw-accent);}
        `;
        document.head.appendChild(s);
    }

    const panel = document.createElement('div');
    panel.className = 'twscripts-root';
    panel.style.cssText = 'position:fixed;top:80px;right:10px;z-index:9999;width:260px;';
    panel.innerHTML = `
        <div class="tw-panel tw-panel--accent">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <span class="tw-heading" style="font-size:14px;">Resource Seller</span>
                <span class="tw-badge tw-badge--cyan">v1.0</span>
            </div>

            <div id="resource-seller-market-info" class="tw-res-bar">
                <div class="tw-res-cell"><span class="res-name">Wood</span><span class="res-val" id="rs-rem-wood">—</span></div>
                <div class="tw-res-cell"><span class="res-name">Stone</span><span class="res-val" id="rs-rem-stone">—</span></div>
                <div class="tw-res-cell"><span class="res-name">Iron</span><span class="res-val" id="rs-rem-iron">—</span></div>
            </div>
            <div style="font-size:11px;color:var(--tw-text-secondary);margin-bottom:8px;" id="rs-merchant-info">Merchants: —</div>

            <hr class="tw-divider">

            <label class="tw-check-row">
                <input type="checkbox" id="resource-seller-enabled" ${config.ENABLED ? 'checked' : ''}>
                <span style="font-size:12px;">Enabled</span>
            </label>
            <label class="tw-check-row">
                <input type="checkbox" id="resource-seller-merchant-limit" ${config.USE_MERCHANT_LIMIT ? 'checked' : ''}>
                <span style="font-size:12px;">Cap by merchant capacity</span>
            </label>

            <div class="tw-row" style="margin-top:4px;">
                <label class="tw-label" style="margin:0;flex:1;">Sell %</label>
                <input type="number" id="resource-seller-pct" class="tw-input" style="width:70px;" value="${config.SELL_PERCENTAGE * 100}" min="1" max="100">
            </div>
            <div class="tw-row">
                <label class="tw-label" style="margin:0;flex:1;">Min capacity</label>
                <input type="number" id="resource-seller-min-cap" class="tw-input" style="width:70px;" value="${config.MIN_REMAINING_CAPACITY}" min="0">
            </div>
            <div class="tw-row">
                <label class="tw-label" style="margin:0;flex:1;">Reload (sec)</label>
                <input type="number" id="resource-seller-reload" class="tw-input" style="width:70px;" value="${config.PAGE_RELOAD_INTERVAL / 1000}" min="1">
            </div>
            <div class="tw-row">
                <label class="tw-label" style="margin:0;flex:1;">Rnd min (ms)</label>
                <input type="number" id="resource-seller-rnd-min" class="tw-input" style="width:70px;" value="${config.RANDOM_INTERVAL_MIN}" min="0">
            </div>
            <div class="tw-row">
                <label class="tw-label" style="margin:0;flex:1;">Rnd max (ms)</label>
                <input type="number" id="resource-seller-rnd-max" class="tw-input" style="width:70px;" value="${config.RANDOM_INTERVAL_MAX}" min="0">
            </div>

            <div style="display:flex;gap:6px;margin-top:4px;">
                <button id="resource-seller-save" class="tw-btn tw-btn--ghost tw-btn--sm" style="flex:1;justify-content:center;">Save</button>
                <button id="resource-seller-run" class="tw-btn tw-btn--primary tw-btn--sm" style="flex:1;justify-content:center;">Sell now</button>
            </div>
            <div id="resource-seller-saved" style="display:none;margin-top:6px;font-size:11px;color:var(--tw-success);">Saved!</div>
            <div id="resource-seller-status" style="margin-top:6px;font-size:11px;color:var(--tw-text-secondary);word-break:break-word;min-height:14px;"></div>
        </div>
    `;
    document.body.appendChild(panel);

    const statusEl = panel.querySelector('#resource-seller-status');
    const runBtn   = panel.querySelector('#resource-seller-run');

    // Populate live market info
    function refreshMarketInfo() {
        const resources = getResourceInfo();
        for (const { res, remaining } of resources) {
            const el = document.getElementById(`rs-rem-${res}`);
            if (el) el.textContent = remaining.toLocaleString();
        }
        const m = getMerchantInfo();
        const infoEl = document.getElementById('rs-merchant-info');
        if (infoEl) infoEl.textContent = `Merchants: ${m.available}/${m.total} · Max: ${(m.available * m.maxTransport).toLocaleString()}`;
    }

    refreshMarketInfo();

    panel.querySelector('#resource-seller-save').addEventListener('click', saveConfig);

    // Auto-save + restart when enabled toggle changes
    panel.querySelector('#resource-seller-enabled').addEventListener('change', () => {
        saveConfig();
        updateStatus(statusEl, config.ENABLED ? 'Enabled.' : 'Disabled.');
    });

    panel.querySelector('#resource-seller-merchant-limit').addEventListener('change', () => {
        saveConfig();
    });

    runBtn.addEventListener('click', async () => {
        runBtn.disabled = true;
        await checkAndSell(statusEl, runBtn);
        runBtn.disabled = false;
    });

    // Auto-run on load only if enabled
    if (config.ENABLED) {
        const initialDelay = Math.random() * (config.RANDOM_INTERVAL_MAX - config.RANDOM_INTERVAL_MIN) + config.RANDOM_INTERVAL_MIN;
        updateStatus(statusEl, `Auto-run in ${Math.round(initialDelay)}ms…`);
        setTimeout(async () => {
            runBtn.disabled = true;
            await checkAndSell(statusEl, runBtn);
            runBtn.disabled = false;
        }, initialDelay);
    } else {
        updateStatus(statusEl, 'Disabled. Enable and save to start.');
    }

    restartIntervals();

})();
