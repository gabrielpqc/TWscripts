# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Tampermonkey userscripts for Tribal Wars (tribalwars.com.pt). No build step, no package manager, no tests. Pure browser JS delivered via GitHub raw URLs.

## File layout

```
<slug>.js              ← root installer (UserScript header + @require only)
src/<slug>/<slug>.js   ← actual script logic (loaded via @require)
rename.js              ← special: self-contained script (no src/ split)
```

Root files are thin shells. All logic lives in `src/`.

## How scripts are used

Users paste the root `<slug>.js` into Tampermonkey. The `@require` line points to the raw GitHub URL of `src/<slug>/<slug>.js`. Changes pushed to `main` are live immediately.

Raw URL pattern: `https://raw.githubusercontent.com/gabrielpqc/TWscripts/refs/heads/main/src/<slug>/<slug>.js`

## Scaffold new script

Use `/new-twscript` — it creates both files with the Dark Command design system already wired up.

## Design system (Dark Command)

All UI must be inside `<div class="twscripts-root">` to scope styles away from the TW game page. Tokens injected once via `id="twscripts-tokens"` guard. Key CSS vars:

| Token | Value | Use |
|-------|-------|-----|
| `--tw-bg-surface` | `#111827` | panel background |
| `--tw-accent` | `#00C8FF` | primary action / info |
| `--tw-amber` | `#F59E0B` | warnings |
| `--tw-danger` | `#EF4444` | destructive |
| `--tw-text-primary` | `#E8EDF5` | body text |
| `--tw-text-secondary` | `#8899BB` | labels, muted |

Fixed panel placement: `position:fixed; top:80px; right:10px; z-index:9999; width:260px`

Element ID convention: `<slug>-<action>` (e.g. `farm-assistant-run`, `farm-assistant-status`)

## Code patterns

Every script follows this structure:

```js
(function () {
    'use strict';

    // screen guard — return early if wrong page
    if (new URLSearchParams(window.location.search).get('screen') !== 'SCREEN') return;

    // config (localStorage-backed)
    const DEFAULT_CONFIG = { ... };
    const config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(localStorage.getItem('key') || '{}'));

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // core logic

    // UI injection (twscripts-fonts + twscripts-tokens id guards, then panel/dialog)
})();
```

`localStorage` is always used for persistence (config, toggles, seen IDs).

## rename.js specifics

This script (`rename.js` / `src/renomear-ataques/`) is the most complex one. It:
- Colors incoming attack rows by tag (label → color mapping in `settings[]` + `colors[]` arrays)
- Injects per-row tag buttons and a mass-tag header row
- Fires Discord webhook notifications for new attacks (groups by destination village, sends embeds)
- Uses MutationObserver on `#incomings_table` to react to TW's dynamic row updates
- Tracks sent command IDs in `localStorage.sentCommandIDs` to avoid duplicate Discord pings

The `pagina_de_ataques` variable (`'coluna'` or `'linha'`) controls whether color applies to first column only or the whole row.
