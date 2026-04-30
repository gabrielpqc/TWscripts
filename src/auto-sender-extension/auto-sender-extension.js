(function () {
    'use strict';

    if (!window.location.search.includes('screen=overview_villages')) return;

    // ── Data ─────────────────────────────────────────────────────────────────
    function loadCommands() {
        const map = new Map(); // "X|Y" → Set<type>
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.includes('overviewVars_')) continue;
            try {
                const data = JSON.parse(localStorage.getItem(key) || '{}');
                const dataArray = Object.values(data.commands)
                if (dataArray.length == 0) continue;
                for (const cmd of dataArray) {
                    if (!cmd.source || !cmd.type) continue;
                    const coords = String(cmd.source).trim();
                    if (!map.has(coords)) map.set(coords, new Set());
                    map.get(coords).add(String(cmd.type));
                    map.get(coords).add(String(cmd.slowestUnit));
                }
            } catch {}
        }
        return map;
    }

    const coordMap = loadCommands();

    // ── Icons ─────────────────────────────────────────────────────────────────

    function iconUrl(type) {
       
        if (type.toLowerCase().includes('attack')) {
            return 'https://cdn-icons-png.flaticon.com/128/4154/4154234.png'
        }
        if (type.toLowerCase().includes('support')) {
            return 'https://cdn-icons-png.flaticon.com/128/4542/4542941.png'
        }
    }

    // ── Injection ─────────────────────────────────────────────────────────────
    function processLabel(label) {
        if (label.dataset.aseProcessed) return;
        const m = label.textContent.match(/\((\d+\|\d+)\)/);
        if (!m) return;
        const types = coordMap.get(m[1]);
        if (!types || !types.size) return;
        label.dataset.aseProcessed = '1';

        const wrap = document.createElement('span');
        wrap.style.cssText = 'display:inline-flex;align-items:center;gap:2px;margin-right:3px;vertical-align:middle;';
        for (const t of types) {
            const img = document.createElement('img');
            let bg_color;
            t.toLowerCase() == 'attack' ? bg_color = 'red' : 'blue';
            img.src = iconUrl(t);
            img.style.cssText = 'width:14px;height:14px;vertical-align:middle;background-color:' + bg_color + ';';
            wrap.appendChild(img);
        }
        if (types.has('snob')) {
         const nobleWrap = document.createElement('span');
         const nobleImg = document.createElement('img');
         nobleWrap.style.cssText = 'display:inline-flex;align-items:center;gap:2px;margin-right:3px;vertical-align:middle;';
         nobleImg.src = 'https://cdn-icons-png.flaticon.com/128/4954/4954770.png';
         nobleImg.style.cssText = 'width:14px;height:14px;vertical-align:middle;background-color:yellow;';
         nobleWrap.appendChild(nobleImg);
         label.closest('tr').firstElementChild.appendChild(nobleWrap);
        }
        label.closest('tr').firstElementChild.appendChild(wrap);
    }

    function processAll() {
        document.querySelectorAll('.quickedit-label:not([data-ase-processed])').forEach(processLabel);
    }

    processAll();

    let debounce = null;
    const observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(processAll, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
