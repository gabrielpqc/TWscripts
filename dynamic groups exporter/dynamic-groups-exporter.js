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
    const TA = `width:100%;height:80px;font-size:10px;resize:vertical;box-sizing:border-box;margin-bottom:5px;font-family:monospace;`;

    const panel = document.createElement('div');
    panel.style.cssText = `
        position:fixed;top:80px;right:10px;z-index:9999;
        background:#f0e0b0;border:2px solid #7d5a1e;border-radius:4px;
        padding:10px 12px;min-width:220px;max-width:260px;
        font:12px/1.5 sans-serif;box-shadow:2px 2px 6px rgba(0,0,0,.4);
    `;
    panel.innerHTML = `
        <b style="display:block;text-align:center;color:#603000;margin-bottom:8px">Group Config</b>
        <button id="gc-export" style="width:100%;margin-bottom:5px;cursor:pointer">Export All Groups</button>
        <div style="display:none;position:relative;margin-bottom:5px" id="gc-export-wrap">
            <textarea id="gc-export-area" style="${TA}margin-bottom:0;padding-right:56px" readonly></textarea>
            <button id="gc-copy" title="Copy" style="
                position:absolute;top:4px;right:4px;padding:2px 7px;
                cursor:pointer;font-size:11px;line-height:1.4;
            ">Copy</button>
        </div>
        <hr style="border:none;border-top:1px solid #7d5a1e;margin:6px 0">
        <div style="color:#603000;margin-bottom:3px">Import (paste JSON):</div>
        <textarea id="gc-import-area" placeholder="Paste JSON here…" style="${TA}"></textarea>
        <button id="gc-import" disabled
            style="width:100%;cursor:pointer;opacity:.5">Import Groups</button>
        <div id="gc-status"
            style="margin-top:6px;color:#444;font-size:11px;word-break:break-word;min-height:14px"></div>
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
            importBtn.style.opacity = '1';
            statusEl.textContent = `${pending.length} group(s) ready.`;
        } catch {
            pending = null;
            importBtn.disabled = true;
            importBtn.style.opacity = '.5';
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
            importBtn.style.opacity = '.5';
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
        importBtn.style.opacity = '.5';
        try { await doImport(pending, statusEl); }
        catch (e) { statusEl.textContent = 'Import error: ' + e.message; }
    });

})();
