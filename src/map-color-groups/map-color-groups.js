(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') !== 'map') return;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function getH() {
        return document.querySelector('input[name="h"]')?.value ??
               (typeof game_data !== 'undefined' && game_data.csrf) ?? '';
    }

    function getVillageId() {
        return params.get('village') ||
               (typeof game_data !== 'undefined' && game_data.village?.id) || '';
    }

    function baseUrl() {
        return `/game.php?village=${getVillageId()}&screen=map`;
    }

    function worldKey() {
        return (typeof game_data !== 'undefined' && game_data.world) ||
               location.host.split('.')[0];
    }

    const PENDING_KEY = () => `mcg_pending_${worldKey()}`;

    // ── Export ──────────────────────────────────────────────────────────────

    function getColorGroups() {
        return Array.from(document.querySelectorAll('#own_color_groups .colorgroup-own-entry'))
            .map(row => {
                const tds    = row.querySelectorAll('td.small');
                const name   = tds[0]?.textContent.trim() ?? '';
                const picker = row.querySelector('.color_picker_launcher');
                return {
                    name,
                    r:    parseInt(picker?.dataset.r    ?? '0', 10),
                    g:    parseInt(picker?.dataset.g    ?? '0', 10),
                    b:    parseInt(picker?.dataset.b    ?? '0', 10),
                    icon: picker?.dataset.icon ?? '',
                    t:    parseInt(picker?.dataset.t    ?? '0', 10),
                };
            })
            .filter(g => g.name);
    }

    // ── Group map helpers ────────────────────────────────────────────────────

    function getCurrentGroupMap() {
        const map = {};
        document.querySelectorAll('#own_color_groups .colorgroup-own-entry').forEach(row => {
            const name = row.querySelectorAll('td.small')[0]?.textContent.trim();
            if (name) map[name] = row.dataset.id;
        });
        return map;
    }

    function getGroupOptions() {
        const sel = document.querySelector('select[name="add_group"]');
        if (!sel) return {};
        const map = {};
        for (const opt of sel.options) {
            if (opt.disabled || !opt.value) continue;
            map[opt.textContent.trim()] = opt.value;
        }
        return map;
    }

    // ── Color apply (pass 2 — runs after reload) ─────────────────────────────

    async function applyPendingColors(statusEl) {
        let pending;
        try { pending = JSON.parse(localStorage.getItem(PENDING_KEY()) || 'null'); }
        catch { pending = null; }
        if (!pending) return;

        localStorage.removeItem(PENDING_KEY());

        const currentMap = getCurrentGroupMap();
        let applied = 0;

        // TW pre-renders #editcolorform in the DOM — reuse it so field names,
        // action URL, and h token are guaranteed correct
        const form      = document.getElementById('editcolorform');
        const groupIdEl = document.getElementById('color_group_id');
        const rEl       = document.getElementById('color_picker_r');
        const gEl       = document.getElementById('color_picker_g');
        const bEl       = document.getElementById('color_picker_b');
        const iconEl    = document.getElementById('icon_url');
        const transEl   = document.getElementById('trans_color_input');
        const useForm   = !!(form && groupIdEl && rEl && gEl && bEl);

        for (const g of pending) {
            const id = currentMap[g.name];
            if (!id) continue;

            if (useForm) {
                groupIdEl.value = id;
                rEl.value       = g.r;
                gEl.value       = g.g;
                bEl.value       = g.b;
                if (iconEl)  iconEl.value    = g.icon ?? '';
                if (transEl) transEl.checked = !!g.t;
                await fetch(form.action, {
                    method:      'POST',
                    body:        new URLSearchParams(new FormData(form)),
                    credentials: 'include'
                });
            } else {
                const body = new URLSearchParams({
                    group_id:       id,
                    color_picker_r: g.r,
                    color_picker_g: g.g,
                    color_picker_b: g.b,
                    icon_url:       g.icon ?? '',
                    h:              getH()
                });
                if (g.t) body.append('transparent', '1');
                await fetch(`${baseUrl()}&action=change_group_color`, { method: 'POST', body, credentials: 'include' });
            }

            // Update sidebar visuals
            const launcher = document.querySelector(`.color_picker_launcher[data-id="${id}"]`);
            if (launcher) {
                launcher.dataset.r    = g.r;
                launcher.dataset.g    = g.g;
                launcher.dataset.b    = g.b;
                launcher.dataset.icon = g.icon ?? '';
                launcher.dataset.t    = g.t;
                const marker = launcher.querySelector('.marker');
                if (marker) marker.style.backgroundColor = `rgb(${g.r},${g.g},${g.b})`;
            }

            applied++;
            if (statusEl) statusEl.textContent = `Applying colors… ${applied}/${pending.length}`;
            await sleep(300);
        }

        if (statusEl && applied) {
            statusEl.textContent = `Colors applied to ${applied} group(s).`;
        }
    }

    // ── Import (pass 1 — adds missing groups, stores colors, reloads) ────────

    async function addGroupToMap(optionId) {
        const body = new URLSearchParams({ add_group: optionId, h: getH() });
        const res  = await fetch(`${baseUrl()}&action=add_own_group`,
            { method: 'POST', body, credentials: 'include' });
        return new DOMParser().parseFromString(await res.text(), 'text/html');
    }

    function findNewGroupId(docAfter, knownIds) {
        let newId = null;
        docAfter.querySelectorAll('#own_color_groups .colorgroup-own-entry').forEach(row => {
            if (!knownIds.has(row.dataset.id)) newId = row.dataset.id;
        });
        return newId;
    }

    async function doImport(groups, statusEl) {
        const options    = getGroupOptions();
        const currentMap = getCurrentGroupMap();
        const knownIds   = new Set(Object.values(currentMap));

        let added = 0, skipped = 0;

        for (const g of groups) {
            if (currentMap[g.name]) {
                // Already in color panel — will set color after reload
                added++;
                continue;
            }

            const optionId = options[g.name];
            if (!optionId) {
                statusEl.textContent = `Skipped (not in account): ${g.name}`;
                await sleep(300);
                skipped++;
                continue;
            }

            statusEl.textContent = `Adding: ${g.name}…`;
            const docAfter = await addGroupToMap(optionId);
            const newId    = findNewGroupId(docAfter, knownIds);

            if (!newId) {
                statusEl.textContent = `Failed to add: ${g.name}`;
                await sleep(400);
                skipped++;
                continue;
            }

            knownIds.add(newId);
            currentMap[g.name] = newId;
            added++;
            await sleep(350);
        }

        // Store full color data — applied on next load after reload
        localStorage.setItem(PENDING_KEY(), JSON.stringify(
            groups.filter(g => currentMap[g.name])
        ));

        statusEl.textContent = `${added} group(s) ready. Setting colors on reload…`;
        await sleep(1000);
        location.reload();
    }

    // ── Remove all ───────────────────────────────────────────────────────────

    async function doRemoveAll(statusEl) {
        const entries = Array.from(document.querySelectorAll('#own_color_groups .colorgroup-own-entry'));
        const total = entries.length;
        for (let i = 0; i < entries.length; i++) {
            statusEl.textContent = `Removing ${i + 1}/${total}…`;
            entries[i].querySelector('.colorgroup-own-delete')?.click();
            await sleep(500);
        }
        statusEl.textContent = `Removed ${total} group(s). Reloading…`;
        await sleep(1200);
        location.reload();
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
.twscripts-root .tw-label{font-family:var(--tw-font-heading);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--tw-text-secondary);display:block;}
.twscripts-root .tw-badge{display:inline-flex;align-items:center;font-size:10px;font-weight:500;padding:2px 6px;border-radius:3px;font-family:var(--tw-font-mono);}
.twscripts-root .tw-badge--cyan{background:rgba(0,200,255,.12);color:var(--tw-accent);border:1px solid rgba(0,200,255,.2);}
.twscripts-root .tw-btn{font-family:var(--tw-font-body);font-size:12px;font-weight:500;padding:6px 12px;border-radius:3px;cursor:pointer;transition:all 150ms ease;border:none;outline:none;display:inline-flex;align-items:center;gap:5px;line-height:1.4;}
.twscripts-root .tw-btn--primary{background:var(--tw-accent);color:#000;}
.twscripts-root .tw-btn--primary:hover:not(:disabled){background:#1AD6FF;box-shadow:var(--tw-glow-cyan);}
.twscripts-root .tw-btn--primary:active:not(:disabled){transform:scale(.97);}
.twscripts-root .tw-btn--ghost{background:transparent;color:var(--tw-text-secondary);border:1px solid var(--tw-border);}
.twscripts-root .tw-btn--ghost:hover:not(:disabled){border-color:var(--tw-accent-dim);color:var(--tw-text-primary);}
.twscripts-root .tw-btn--danger{background:var(--tw-danger);color:#fff;}
.twscripts-root .tw-btn--danger:hover:not(:disabled){background:#f87171;}
.twscripts-root .tw-btn--sm{font-size:11px;padding:3px 8px;}
.twscripts-root .tw-btn:disabled{opacity:.4;cursor:not-allowed;}
.twscripts-root .tw-input{background:var(--tw-bg-elevated);border:1px solid var(--tw-border);border-radius:3px;color:var(--tw-text-primary);font-family:var(--tw-font-body);font-size:12px;padding:5px 8px;transition:border-color 150ms ease;width:100%;display:block;}
.twscripts-root .tw-input:focus{outline:none;border-color:var(--tw-accent-dim);box-shadow:0 0 0 2px rgba(0,200,255,.1);}
.twscripts-root .tw-input::placeholder{color:var(--tw-text-secondary);opacity:.6;}
.twscripts-root textarea.tw-input{resize:vertical;line-height:1.5;}
.twscripts-root .tw-divider{border:none;border-top:1px solid var(--tw-border);margin:10px 0;}
        `;
        document.head.appendChild(s);
    }

    function buildUI(container) {
        if (container.querySelector('#mcg-root')) return;

        const root = document.createElement('div');
        root.id = 'mcg-root';
        root.className = 'twscripts-root';
        root.style.cssText = 'margin-top:6px;';
        root.innerHTML = `
            <button id="mcg-toggle" class="tw-btn tw-btn--ghost tw-btn--sm" style="width:100%;justify-content:space-between;border-radius:4px;">
                <span style="font-family:var(--tw-font-heading);font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">Color Groups</span>
                <span id="mcg-chevron" style="font-size:9px;transition:transform 150ms ease;color:var(--tw-text-secondary);">▼</span>
            </button>
            <div id="mcg-panel" style="display:none;margin-top:4px;">
                <div class="tw-panel tw-panel--accent">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                        <span class="tw-heading" style="font-size:13px;">Export / Import</span>
                        <span class="tw-badge tw-badge--cyan">Map</span>
                    </div>
                    <button id="mcg-export" class="tw-btn tw-btn--primary" style="width:100%;justify-content:center;font-size:11px;">Export Color Groups</button>
                    <div id="mcg-export-wrap" style="display:none;margin-top:8px;position:relative;">
                        <textarea id="mcg-export-area" class="tw-input" style="height:72px;padding-right:52px;font-family:var(--tw-font-mono);font-size:10px;" readonly></textarea>
                        <button id="mcg-copy" class="tw-btn tw-btn--ghost tw-btn--sm" style="position:absolute;top:4px;right:4px;">Copy</button>
                    </div>
                    <div class="tw-divider"></div>
                    <label class="tw-label" style="margin-bottom:5px;">Import JSON</label>
                    <textarea id="mcg-import-area" class="tw-input" placeholder="Paste JSON here…" style="height:60px;font-family:var(--tw-font-mono);font-size:10px;margin-bottom:6px;"></textarea>
                    <button id="mcg-import" class="tw-btn tw-btn--ghost" disabled style="width:100%;justify-content:center;font-size:11px;">Import Color Groups</button>
                    <div class="tw-divider"></div>
                    <button id="mcg-remove-all" class="tw-btn tw-btn--danger tw-btn--sm" style="width:100%;justify-content:center;">Remove All Color Groups</button>
                    <div id="mcg-status" style="margin-top:8px;font-size:11px;color:var(--tw-text-secondary);word-break:break-word;min-height:14px;"></div>
                </div>
            </div>
        `;
        container.appendChild(root);

        const toggleBtn   = root.querySelector('#mcg-toggle');
        const chevron     = root.querySelector('#mcg-chevron');
        const panelEl     = root.querySelector('#mcg-panel');
        const statusEl    = root.querySelector('#mcg-status');
        const exportBtn   = root.querySelector('#mcg-export');
        const exportWrap  = root.querySelector('#mcg-export-wrap');
        const exportArea  = root.querySelector('#mcg-export-area');
        const copyBtn     = root.querySelector('#mcg-copy');
        const importArea  = root.querySelector('#mcg-import-area');
        const importBtn   = root.querySelector('#mcg-import');
        const removeAllBtn = root.querySelector('#mcg-remove-all');
        let   pending     = null;
        let   expanded    = false;

        // Apply pending colors from previous import pass
        applyPendingColors(statusEl);

        toggleBtn.addEventListener('click', () => {
            expanded = !expanded;
            panelEl.style.display = expanded ? 'block' : 'none';
            chevron.style.transform = expanded ? 'rotate(180deg)' : '';
        });

        function tryLoadJSON(str) {
            try {
                pending = JSON.parse(str);
                if (!Array.isArray(pending)) throw new Error();
                importBtn.disabled = false;
                statusEl.textContent = `${pending.length} group(s) ready.`;
            } catch {
                pending = null;
                importBtn.disabled = true;
                statusEl.textContent = 'Invalid JSON.';
            }
        }

        exportBtn.addEventListener('click', () => {
            const groups = getColorGroups();
            if (!groups.length) { statusEl.textContent = 'No color groups found.'; return; }
            exportArea.value = JSON.stringify(groups, null, 2);
            exportWrap.style.display = 'block';
            exportArea.select();
            statusEl.textContent = `Exported ${groups.length} group(s).`;
        });

        importArea.addEventListener('input', () => {
            const v = importArea.value.trim();
            if (v) tryLoadJSON(v);
            else { pending = null; importBtn.disabled = true; statusEl.textContent = ''; }
        });

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(exportArea.value).then(() => {
                copyBtn.textContent = '✓';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
            }).catch(() => {
                exportArea.select();
                document.execCommand('copy');
                copyBtn.textContent = '✓';
                setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
            });
        });

        importBtn.addEventListener('click', async () => {
            if (!pending) return;
            if (!confirm(`Import ${pending.length} group(s)?\nGroups will be added if missing. Colors and icons applied on reload.\nNew groups must already exist in your account.`)) return;
            importBtn.disabled = true;
            exportBtn.disabled = true;
            removeAllBtn.disabled = true;
            try { await doImport(pending, statusEl); }
            catch (e) { statusEl.textContent = 'Import error: ' + e.message; }
            importBtn.disabled = false;
            exportBtn.disabled = false;
            removeAllBtn.disabled = false;
        });

        removeAllBtn.addEventListener('click', async () => {
            const count = document.querySelectorAll('#own_color_groups .colorgroup-own-entry').length;
            if (!count) { statusEl.textContent = 'No color groups to remove.'; return; }
            if (!confirm(`Remove all ${count} color group(s) from the map?\nThis cannot be undone.`)) return;
            importBtn.disabled = true;
            exportBtn.disabled = true;
            removeAllBtn.disabled = true;
            try { await doRemoveAll(statusEl); }
            catch (e) { statusEl.textContent = 'Remove error: ' + e.message; }
        });
    }

    function tryInject() {
        const container = document.getElementById('village_colors');
        if (container) { buildUI(container); return; }
        const t = setInterval(() => {
            const c = document.getElementById('village_colors');
            if (c) { clearInterval(t); buildUI(c); }
        }, 300);
        setTimeout(() => clearInterval(t), 15000);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(tryInject, 800);
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryInject, 800));
    }

})();
