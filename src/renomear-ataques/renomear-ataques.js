(function () {
    'use strict';

    const webhookURL = 'https://discord.com/api/webhooks/1446457472431685745/JK9pWwm3bv4B3Jx8d54R4mLs_HVTASviUHQM--8cWLvCBPiOYY3NdLJwM5IZyqlKEyE2';

    // ── Style #etiq-mass-header + sibling th ────────────────────────────────
    if (!document.getElementById('renomear-ataques-styles')) {
        const s = document.createElement('style');
        s.id = 'renomear-ataques-styles';
        s.textContent = `
#etiq-mass-header {
    background: #111827 !important;
    color: #E8EDF5 !important;
}
#etiq-mass-header > * {
    color: #E8EDF5 !important;
}
#etiq-filter-toggle {
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-size: 11px;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 3px;
    cursor: pointer;
    outline: none;
    transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
    display: inline-block;
}
#etiq-filter-toggle.off {
    background: transparent;
    color: #8899BB;
    border: 1px solid #2A3550;
}
#etiq-filter-toggle.on {
    background: #00C8FF;
    color: #000;
    border: 1px solid #00C8FF;
}
#etiq-filter-toggle.off:hover { border-color: #0A8EBF; color: #E8EDF5; }
#etiq-filter-toggle.on:hover  { background: #1AD6FF; }
        `;
        document.head.appendChild(s);
    }

    // ── Core logic ──────────────────────────────────────────────────────────
    let filterMode = localStorage.getItem('etiq-filter-mode') === 'true';
    let originCounts = {};

    function hasUnknowns() {
        let newAtt = false;
        $('#incomings_table tbody .quickedit-label').each(function () {
            if ($(this).text().indexOf('Ataque') >= 1) newAtt = true;
        });
        return newAtt;
    }

    function countUntagged() {
        return [...document.querySelectorAll('.quickedit-label')]
            .filter(el => el.textContent.includes('Ataque')).length;
    }

    function etiquetar() {
        UI.InfoMessage('Executando etiquetador!');
        $.getScript('https://www.dl.dropboxusercontent.com/scl/fi/ptblnq4yvfl9n8kl4jpbo/EitquetadorWithBacktime.js?rlkey=720wdx4wytol8rd5azt0ja86i&dl=0');
    }

    function checkNameCommands() {
        if (filterMode) {
            // Only tag attacks still carrying the default "Ataque" label
            if (countUntagged() > 0) {
                etiquetar();
            } else {
                calcularEAtualizarQuantidadeAtaques();
            }
        } else {
            // Original: tag all if any untagged exists
            const names = document.querySelectorAll('.quickedit-label');
            let containsAtaque = false;
            for (let i = 0; i < names.length; i++) {
                if (names[i].textContent.includes('Ataque')) {
                    etiquetar();
                    containsAtaque = true;
                    break;
                }
            }
            if (!containsAtaque) calcularEAtualizarQuantidadeAtaques();
        }
    }

    function calcularEAtualizarQuantidadeAtaques() {
        const elTable = document.querySelectorAll('#incomings_table .nowrap');
        const objectsArray = [];
        originCounts = {};

        for (let i = 0; i < elTable.length; i++) {
            const origemText = elTable[i].children[2]?.innerText.trim();
            const origemMatch = origemText?.match(/\((\d+\|\d+)\)/);
            if (origemMatch) {
                const origem = origemMatch[1];
                objectsArray.push({ origem });
                originCounts[origem] = (originCounts[origem] || 0) + 1;
            }
        }

        for (let i = 0; i < objectsArray.length; i++) {
            objectsArray[i].ataques = originCounts[objectsArray[i].origem];
        }

        for (let i = 0; i < elTable.length; i++) {
            const ataques = objectsArray[i]?.ataques;
            const ataquesElement = document.createElement('span');
            ataquesElement.style.color = 'red';
            ataquesElement.style.fontWeight = 'bold';
            ataquesElement.textContent = `(${ataques} ataques)`;
            const cell = elTable[i]?.children[0];
            cell.insertBefore(ataquesElement, cell.firstChild);
        }

        runDiscord();
    }

    // Reload on incoming count change
    (function watchIncomings() {
        function check() {
            const cell = document.querySelector('#incomings_cell');
            if (!cell) return;
            const n = parseInt(cell.innerText);
            const stored = parseInt(localStorage.getItem('attacks') || 0);
            if (n !== stored) {
                localStorage.setItem('attacks', n);
                setTimeout(() => window.location.reload(), 5000);
            }
        }
        const obs = new MutationObserver(check);
        const cell = document.querySelector('#incomings_cell');
        if (cell) obs.observe(cell, { childList: true, subtree: true });
        check();
    })();

    // ── Inject toggle button into sibling <th> of #etiq-mass-header ─────────
    function injectFilterToggle() {
        const header = document.getElementById('etiq-mass-header');
        if (!header || document.getElementById('etiq-filter-toggle')) return;

        const headerCell = header.tagName === 'TH' || header.tagName === 'TD'
            ? header
            : header.closest('th, td');
        const siblingTh = headerCell?.nextElementSibling;

        if (!siblingTh) return;

        // Style the sibling th
        siblingTh.style.setProperty('background', '#111827', 'important');
        siblingTh.style.setProperty('color', '#E8EDF5', 'important');

        const btn = document.createElement('button');
        btn.id = 'etiq-filter-toggle';

        function syncBtn() {
            btn.className = filterMode ? 'on' : 'off';
            btn.textContent = filterMode ? 'Só sem etiqueta: ON' : 'Só sem etiqueta: OFF';
            btn.title = filterMode
                ? 'Modo filtro ativo — só etiqueta ataques sem nome personalizado'
                : 'Modo normal — etiqueta todos os ataques';
        }

        btn.addEventListener('click', () => {
            filterMode = !filterMode;
            localStorage.setItem('etiq-filter-mode', filterMode);
            syncBtn();
        });

        syncBtn();
        siblingTh.appendChild(btn);
    }

    const headerObserver = new MutationObserver(() => {
        if (document.getElementById('etiq-mass-header')) {
            injectFilterToggle();
        }
    });
    headerObserver.observe(document.body, { childList: true, subtree: true });
    injectFilterToggle();

    // ── Discord notifications ────────────────────────────────────────────────
    function runDiscord() {
        const sentCommandIDs = localStorage.getItem('sentCommandIDs')
            ? JSON.parse(localStorage.getItem('sentCommandIDs'))
            : [];

        function enviarNotificacaoParaDiscord(payload) {
            fetch(webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            }).then(() => {
                localStorage.setItem('sentCommandIDs', JSON.stringify(sentCommandIDs));
            }).catch(err => console.error(err));
        }

        const elTable = document.querySelectorAll('#incomings_table .nowrap');
        const objectsArray = [];

        for (let i = 0; i < elTable.length; i++) {
            const nomeDaEtiqueta = elTable[i].children[0]?.innerText.trim();
            const destinoText    = elTable[i].children[1]?.innerText.trim();
            const origemText     = elTable[i].children[2]?.innerText.trim();
            const dataMatch      = nomeDaEtiqueta?.match(/[A-Z][a-z]{2}\. \d{1,2}, \d{2}:\d{2}:\d{2}/);
            const horarioRetorno = dataMatch ? dataMatch[0] : '';
            const destinoMatch   = destinoText?.match(/\((\d+\|\d+)\)/);
            const origemMatch    = origemText?.match(/\((\d+\|\d+)\)/);
            const idComando      = elTable[i]?.querySelector('td .quickedit')?.attributes[1]?.value;
            const imagemComando  = elTable[i]?.querySelector('td .quickedit .icon-container img');

            if (sentCommandIDs.includes(idComando)) continue;
            if (!destinoMatch || !origemMatch) continue;

            const objeto = {
                nomeDaEtiqueta,
                destino: destinoMatch[1],
                origem:  origemMatch[1],
                idComando,
                atacante:       elTable[i].children[3].innerText.trim(),
                imagem:         imagemComando.currentSrc,
                distancia:      elTable[i].children[4].innerText.trim(),
                horarioChegada: elTable[i].children[5].innerText.trim(),
                tempoRestante:  elTable[i].children[6].innerText.trim(),
                horarioRetorno,
            };

            objectsArray.push(objeto);
            sentCommandIDs.push(idComando);
        }

        if (!objectsArray.length) return;

        const gruposPorDestino = {};
        objectsArray.forEach(o => {
            (gruposPorDestino[o.destino] = gruposPorDestino[o.destino] || []).push(o);
        });

        const ataqueFraco   = '<:attack_small:1151839637401239582>';
        const ataqueVerde   = '<:attack_small1:1151839620829544479>';
        const ataqueMedio   = '<:attack_medium:1151839638823108648>';
        const ataqueForte   = '<:attack_large:1151839623358726205>';
        const ataqueComSpy  = '<:spy:1151839634578485300>';
        const ataqueComAriete = '<:ram:1151839631680208977>';
        const ataqueComCp   = '<:heavy:1151839633236308018>';
        const ataqueComCl   = '<:light:1151839627330732124>';
        const ataqueComEspada = '<:sword:1151839628911968288>';
        const ataqueComBarbaro = '<:axe1:1151839624898027530>';
        const ataqueComNobre = '<:snob:1151839619541893233>';

        const embeds = [];

        Object.entries(gruposPorDestino).forEach(([destino, items]) => {
            let currentDescription = '';
            const maxLen = 4096;

            items.forEach(o => {
                let imgAttack = '';
                if      (o.imagem.includes('command/attack_small.png'))  imgAttack = ataqueVerde;
                else if (o.imagem.includes('command/attack.png'))        imgAttack = ataqueFraco;
                else if (o.imagem.includes('command/attack_medium.png')) imgAttack = ataqueMedio;
                else if (o.imagem.includes('command/attack_large.png'))  imgAttack = ataqueForte;

                let slowUnit = '';
                if      (o.nomeDaEtiqueta.includes('Batedor'))           slowUnit = ataqueComSpy;
                else if (o.nomeDaEtiqueta.includes('Aríete'))            slowUnit = ataqueComAriete;
                else if (o.nomeDaEtiqueta.includes('Cavalaria Pesada'))  slowUnit = ataqueComCp;
                else if (o.nomeDaEtiqueta.includes('Machado'))           slowUnit = ataqueComBarbaro;
                else if (o.nomeDaEtiqueta.includes('Espada'))            slowUnit = ataqueComEspada;
                else if (o.nomeDaEtiqueta.includes('CavL'))              slowUnit = ataqueComCl;
                else if (o.nomeDaEtiqueta.includes('Nobre'))             slowUnit = ataqueComNobre;

                const line = `${imgAttack} ${slowUnit} **Atacante:** ${o.atacante} **Origem:** ${o.origem} **[AtOrigem: ${originCounts[o.origem]}]** Chegada: **${o.horarioChegada}** Retorno: **${o.horarioRetorno}**\n\n`;

                if (currentDescription.length + line.length <= maxLen) {
                    currentDescription += line;
                } else {
                    embeds.push({ type: 'rich', title: `${game_data.player.name} ${destino} T: ${items.length}`, description: currentDescription, color: 0x00FF00 });
                    currentDescription = line;
                }
            });

            if (currentDescription.length > 0) {
                embeds.push({ type: 'rich', title: `${game_data.player.name} ${destino} T: ${items.length}`, description: currentDescription, color: 0x00FF00 });
            }
        });

        (function send(i) {
            if (i >= embeds.length) return;
            enviarNotificacaoParaDiscord(JSON.stringify({ embeds: [embeds[i]] }));
            setTimeout(() => send(i + 1), 680);
        })(0);
    }

    // ── Boot ─────────────────────────────────────────────────────────────────
    checkNameCommands();

})();
