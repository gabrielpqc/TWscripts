(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') !== 'overview_villages' ||
        params.get('mode')   !== 'groups' ||
        params.get('type')   !== 'dynamic') return;

    const villageId = params.get('village');
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const BASE_URL = `/game.php?village=${villageId}&screen=overview_villages&mode=groups&type=dynamic`;

    function getH() {
        return document.querySelector('input[name="h"]')?.value ?? '';
    }

    function getGroups() {
        return Array.from(document.querySelectorAll('.quickedit-group'))
            .map(el => ({
                id:   el.dataset.id,
                name: el.querySelector('.quickedit-label')?.textContent.trim() ?? ''
            }))
            .filter(g => g.id && g.name);
    }

    function serializeForm(form) {
        const data = {};
        for (const el of form.elements) {
            if (!el.name || el.type === 'submit' || el.disabled) continue;
            if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
            data[el.name] = el.value;
        }
        return data;
    }

    // Load group page in a hidden iframe so TW's JS runs and enables active filter
    // inputs — fetch() skips JS so all inputs stay disabled (inactive state).
    function loadGroupInIframe(groupId) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                position:fixed;top:-9999px;left:-9999px;
                width:1px;height:1px;border:none;visibility:hidden;
            `;

            const finish = (config) => { iframe.remove(); resolve(config); };
            const master = setTimeout(() => finish({}), 12000);

            iframe.onload = () => {
                // Give TW's $(document).ready / VillageFilters time to initialize
                // and toggle disabled state on active filter inputs
                const waitForInit = () => {
                    try {
                        const win = iframe.contentWindow;
                        // VillageFilters defined = TW's filter JS has run
                        if (win && (win.VillageFilters || win.$ && win.$.isReady)) {
                            clearTimeout(master);
                            const form = iframe.contentDocument?.getElementById('filter_config');
                            finish(form ? serializeForm(form) : {});
                        } else {
                            setTimeout(waitForInit, 100);
                        }
                    } catch {
                        // Cross-origin or other error — just use timeout fallback
                    }
                };

                // Start polling, fall back to 2s hard timeout
                waitForInit();
                setTimeout(() => {
                    clearTimeout(master);
                    try {
                        const form = iframe.contentDocument?.getElementById('filter_config');
                        finish(form ? serializeForm(form) : {});
                    } catch { finish({}); }
                }, 2000);
            };

            iframe.onerror = () => { clearTimeout(master); finish({}); };
            iframe.src = `${BASE_URL}&group=${groupId}`;
            document.body.appendChild(iframe);
        });
    }

    async function doExport(status, exportArea) {
        const groups = getGroups();
        if (!groups.length) { status.textContent = 'No groups found.'; return; }

        const out = [];
        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            status.textContent = `Exporting ${i + 1}/${groups.length}: ${g.name}…`;
            const config = await loadGroupInIframe(g.id);
            out.push({ name: g.name, config });
        }

        exportArea.value = JSON.stringify(out, null, 2);
        exportWrap.style.display = 'block';
        exportArea.select();
        status.textContent = `Exported ${out.length} groups.`;
    }

    // ── Import ──────────────────────────────────────────────────────────────

    async function createGroup(name) {
        const body = new URLSearchParams({ group_name: name, h: getH() });
        const res = await fetch(`${BASE_URL}&action=create_dynamic`,
            { method: 'POST', body, credentials: 'include' });
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

        let maxId = null;
        doc.querySelectorAll('.quickedit-group').forEach(el => {
            if (el.querySelector('.quickedit-label')?.textContent.trim() === name) {
                const id = parseInt(el.dataset.id, 10);
                if (maxId === null || id > maxId) maxId = id;
            }
        });
        return maxId !== null ? String(maxId) : null;
    }

    async function applyFilters(groupId, config) {
        const body = new URLSearchParams({ group_id: groupId, h: getH() });
        for (const [k, v] of Object.entries(config)) {
            if (k !== 'group_id' && k !== 'h') body.append(k, v);
        }
        await fetch(`${BASE_URL}&action=set_filters`,
            { method: 'POST', body, credentials: 'include' });
    }

    async function deleteGroup(groupId) {
        await fetch(`${BASE_URL}&action=delete_dynamic&group=${groupId}&h=${getH()}`,
            { credentials: 'include' });
    }

    async function doImport(groups, status) {
        const existing = {};
        getGroups().forEach(g => { existing[g.name] = g.id; });

        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];

            if (existing[g.name]) {
                status.textContent = `Deleting existing: ${g.name}`;
                await deleteGroup(existing[g.name]);
                await sleep(300);
            }

            status.textContent = `Creating ${i + 1}/${groups.length}: ${g.name}`;
            const newId = await createGroup(g.name);
            if (!newId) { status.textContent = `Failed to create: ${g.name}`; continue; }

            await sleep(300);

            if (g.config && Object.keys(g.config).length) {
                status.textContent = `Applying filters: ${g.name}`;
                await applyFilters(newId, g.config);
            }
            await sleep(350);
        }

        status.textContent = 'Done! Reloading...';
        await sleep(1000);
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
.twscripts-root{--tw-bg-surface:#111827;--tw-bg-elevated:#1C2333;--tw-bg-hover:#243048;--tw-accent:#00C8FF;--tw-accent-dim:#0A8EBF;--tw-text-primary:#E8EDF5;--tw-text-secondary:#8899BB;--tw-border:#2A3550;--tw-border-strong:#3D4F72;--tw-success:#22C55E;--tw-danger:#EF4444;--tw-font-heading:'Space Grotesk',system-ui,sans-serif;--tw-font-body:'IBM Plex Sans',system-ui,sans-serif;--tw-font-mono:'JetBrains Mono','Fira Code',monospace;--tw-glow-cyan:0 0 12px rgba(0,200,255,.25);}
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

    const panel = document.createElement('div');
    panel.className = 'twscripts-root';
    panel.style.cssText = 'position:fixed;top:80px;right:10px;z-index:9999;width:260px;';
    panel.innerHTML = `
        <div class="tw-panel tw-panel--accent">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <span class="tw-heading" style="font-size:14px;">Group Config</span>
                <span class="tw-badge tw-badge--cyan">Dynamic</span>
            </div>
            <button id="gc-export" class="tw-btn tw-btn--primary" style="width:100%;justify-content:center;margin-bottom:8px;">Export All Groups</button>
            <div id="gc-export-wrap" style="display:none;margin-bottom:8px;position:relative;">
                <textarea id="gc-export-area" class="tw-input" style="height:80px;padding-right:52px;font-family:var(--tw-font-mono);font-size:11px;" readonly></textarea>
                <button id="gc-copy" class="tw-btn tw-btn--ghost tw-btn--sm" style="position:absolute;top:4px;right:4px;">Copy</button>
            </div>
            <div class="tw-divider"></div>
            <label class="tw-label" style="margin-bottom:6px;">Import (paste JSON)</label>
            <textarea id="gc-import-area" class="tw-input" placeholder="Paste JSON here…" style="height:72px;font-family:var(--tw-font-mono);font-size:11px;margin-bottom:8px;"></textarea>
            <button id="gc-import" class="tw-btn tw-btn--ghost" disabled style="width:100%;justify-content:center;">Import Groups</button>
            <div id="gc-status" style="margin-top:8px;font-size:11px;color:var(--tw-text-secondary);word-break:break-word;min-height:14px;"></div>
        </div>
    `;
    document.body.appendChild(panel);

    const statusEl   = panel.querySelector('#gc-status');
    const exportBtn  = panel.querySelector('#gc-export');
    const exportWrap = panel.querySelector('#gc-export-wrap');
    const exportArea = panel.querySelector('#gc-export-area');
    const copyBtn    = panel.querySelector('#gc-copy');
    const importArea = panel.querySelector('#gc-import-area');
    const importBtn  = panel.querySelector('#gc-import');
    let   pending    = null;

    function tryLoadJSON(str) {
        try {
            pending = JSON.parse(str);
            importBtn.disabled = false;
            statusEl.textContent = `${pending.length} group(s) ready.`;
        } catch {
            pending = null;
            importBtn.disabled = true;
            statusEl.textContent = 'Invalid JSON.';
        }
    }

    exportBtn.addEventListener('click', async () => {
        exportBtn.disabled = true;
        try { await doExport(statusEl, exportArea); }
        catch (e) { statusEl.textContent = 'Export error: ' + e.message; }
        exportBtn.disabled = false;
    });

    importArea.addEventListener('input', () => {
        const v = importArea.value.trim();
        if (v) tryLoadJSON(v);
        else {
            pending = null;
            importBtn.disabled = true;
            statusEl.textContent = '';
        }
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
        if (!confirm(`Import ${pending.length} group(s)?\nExisting groups with matching names will be deleted and recreated.`)) return;
        importBtn.disabled = true;
        try { await doImport(pending, statusEl); }
        catch (e) { statusEl.textContent = 'Import error: ' + e.message; }
    });

})();
