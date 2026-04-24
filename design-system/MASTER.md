# TWscripts Design System — MASTER

**Style:** Dark Command  
**Concept:** IDE/terminal polish. Serious tooling aesthetic. Signals craft, precision, trust. Not decorative.  
**Audience:** Competitive Tribal Wars players who respect function + quality.

---

## Color Palette

Derived from icon: deep midnight navy bg, electric cyan accent, warm amber secondary, near-white text.

```css
:root {
  /* Backgrounds */
  --tw-bg-base:       #090D18;  /* page/game overlay backdrop */
  --tw-bg-surface:    #111827;  /* panel/card bg */
  --tw-bg-elevated:   #1C2333;  /* nested card, input bg */
  --tw-bg-hover:      #243048;  /* hover state on rows/items */

  /* Accents */
  --tw-accent:        #00C8FF;  /* electric cyan — primary action, focus, glow */
  --tw-accent-dim:    #0A8EBF;  /* darker cyan for borders, secondary elements */
  --tw-amber:         #F59E0B;  /* warm amber — secondary highlight, warnings */
  --tw-amber-dim:     #92600A;  /* amber border */

  /* Text */
  --tw-text-primary:  #E8EDF5;  /* main text */
  --tw-text-secondary:#8899BB;  /* muted/supporting text */
  --tw-text-disabled: #4A5568;  /* disabled state */

  /* Borders */
  --tw-border:        #2A3550;  /* default border */
  --tw-border-strong: #3D4F72;  /* emphasized border */

  /* Semantic */
  --tw-success:       #22C55E;
  --tw-danger:        #EF4444;
  --tw-danger-dim:    #7F1D1D;
}
```

---

## Typography

**Import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Role | Font | Weight |
|------|------|--------|
| Heading | Space Grotesk | 600–700 |
| Body/UI | IBM Plex Sans | 400–500 |
| Numbers/data | JetBrains Mono | 400–500 |

```css
:root {
  --tw-font-heading: 'Space Grotesk', system-ui, sans-serif;
  --tw-font-body:    'IBM Plex Sans', system-ui, sans-serif;
  --tw-font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}
```

**Scale:**
```css
--tw-text-xs:   11px;
--tw-text-sm:   13px;
--tw-text-base: 14px;
--tw-text-md:   16px;
--tw-text-lg:   20px;
--tw-text-xl:   24px;
--tw-text-2xl:  32px;
```

---

## Spacing & Shape

```css
:root {
  --tw-radius-sm:  3px;
  --tw-radius:     6px;
  --tw-radius-lg:  10px;

  --tw-space-1:  4px;
  --tw-space-2:  8px;
  --tw-space-3:  12px;
  --tw-space-4:  16px;
  --tw-space-6:  24px;
  --tw-space-8:  32px;
}
```

Sharp-ish corners. NOT rounded blobs. NOT zero radius (not brutalist). 3–6px is the sweet spot.

---

## Shadows & Glow

Use borders as primary depth signal. Shadows only for elevation.

```css
:root {
  --tw-shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
  --tw-shadow:     0 4px 12px rgba(0,0,0,0.5);
  --tw-shadow-lg:  0 8px 24px rgba(0,0,0,0.6);

  /* Glow — use sparingly, only on accent-colored interactive elements */
  --tw-glow-cyan:  0 0 12px rgba(0, 200, 255, 0.25);
  --tw-glow-amber: 0 0 12px rgba(245, 158, 11, 0.25);
}
```

---

## Components

### Panel / Card

```css
.tw-panel {
  background: var(--tw-bg-surface);
  border: 1px solid var(--tw-border);
  border-radius: var(--tw-radius);
  padding: var(--tw-space-4);
}

/* Accented panel — left border highlight */
.tw-panel--accent {
  border-left: 3px solid var(--tw-accent);
}
```

### Button

```css
.tw-btn {
  font-family: var(--tw-font-body);
  font-size: var(--tw-text-sm);
  font-weight: 500;
  padding: 6px 14px;
  border-radius: var(--tw-radius-sm);
  cursor: pointer;
  transition: all 180ms ease;
  border: none;
  outline: none;
}

.tw-btn--primary {
  background: var(--tw-accent);
  color: #000;
}
.tw-btn--primary:hover {
  background: #1AD6FF;
  box-shadow: var(--tw-glow-cyan);
}

.tw-btn--ghost {
  background: transparent;
  color: var(--tw-text-secondary);
  border: 1px solid var(--tw-border);
}
.tw-btn--ghost:hover {
  border-color: var(--tw-accent-dim);
  color: var(--tw-text-primary);
}

.tw-btn--danger {
  background: var(--tw-danger);
  color: #fff;
}

.tw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

### Input / Select

```css
.tw-input {
  background: var(--tw-bg-elevated);
  border: 1px solid var(--tw-border);
  border-radius: var(--tw-radius-sm);
  color: var(--tw-text-primary);
  font-family: var(--tw-font-body);
  font-size: var(--tw-text-sm);
  padding: 6px 10px;
  transition: border-color 150ms ease;
}
.tw-input:focus {
  outline: none;
  border-color: var(--tw-accent-dim);
  box-shadow: 0 0 0 2px rgba(0, 200, 255, 0.12);
}
```

### Table

```css
.tw-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--tw-font-body);
  font-size: var(--tw-text-sm);
}

.tw-table th {
  font-family: var(--tw-font-heading);
  font-size: var(--tw-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tw-accent);
  border-bottom: 1px solid var(--tw-border);
  padding: var(--tw-space-2) var(--tw-space-3);
  text-align: left;
}

.tw-table td {
  padding: var(--tw-space-2) var(--tw-space-3);
  color: var(--tw-text-primary);
  border-bottom: 1px solid var(--tw-border);
}

.tw-table tr:hover td {
  background: var(--tw-bg-hover);
}

.tw-table .tw-mono {
  font-family: var(--tw-font-mono);
  font-size: var(--tw-text-xs);
  color: var(--tw-text-secondary);
}
```

### Badge / Tag

```css
.tw-badge {
  display: inline-flex;
  align-items: center;
  font-size: var(--tw-text-xs);
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 3px;
  font-family: var(--tw-font-mono);
}

.tw-badge--cyan   { background: rgba(0,200,255,0.12); color: var(--tw-accent); border: 1px solid rgba(0,200,255,0.2); }
.tw-badge--amber  { background: rgba(245,158,11,0.12); color: var(--tw-amber); border: 1px solid rgba(245,158,11,0.2); }
.tw-badge--green  { background: rgba(34,197,94,0.12);  color: var(--tw-success); border: 1px solid rgba(34,197,94,0.2); }
.tw-badge--red    { background: rgba(239,68,68,0.12);   color: var(--tw-danger);  border: 1px solid rgba(239,68,68,0.2); }
```

### Divider

```css
.tw-divider {
  border: none;
  border-top: 1px solid var(--tw-border);
  margin: var(--tw-space-4) 0;
}
```

### Modal / Dialog

```css
.tw-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tw-modal {
  background: var(--tw-bg-surface);
  border: 1px solid var(--tw-border-strong);
  border-radius: var(--tw-radius-lg);
  padding: var(--tw-space-6);
  min-width: 320px;
  max-width: 560px;
  box-shadow: var(--tw-shadow-lg);
}

.tw-modal__header {
  font-family: var(--tw-font-heading);
  font-size: var(--tw-text-md);
  font-weight: 600;
  color: var(--tw-text-primary);
  margin-bottom: var(--tw-space-4);
  padding-bottom: var(--tw-space-3);
  border-bottom: 1px solid var(--tw-border);
}
```

### Notification / Toast

```css
.tw-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--tw-bg-elevated);
  border: 1px solid var(--tw-border-strong);
  border-radius: var(--tw-radius);
  padding: var(--tw-space-3) var(--tw-space-4);
  font-family: var(--tw-font-body);
  font-size: var(--tw-text-sm);
  color: var(--tw-text-primary);
  box-shadow: var(--tw-shadow-lg);
  z-index: 9999;
  animation: tw-slide-in 200ms ease;
}

.tw-toast--success { border-left: 3px solid var(--tw-success); }
.tw-toast--error   { border-left: 3px solid var(--tw-danger);  }
.tw-toast--info    { border-left: 3px solid var(--tw-accent);  }

@keyframes tw-slide-in {
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
```

---

## Interaction Principles

| Principle | Rule |
|-----------|------|
| Transitions | 150–200ms ease. No slower. |
| Hover | Color/border shift. Never scale that causes layout shift. |
| Focus | 2px ring, `rgba(0, 200, 255, 0.3)`. Always visible. |
| Active/press | `transform: scale(0.97)` on buttons only. |
| Glow | Only on primary action buttons + focused inputs. Subtle. |
| Cursor | `cursor-pointer` on all clickable elements. |

---

## Anti-Patterns (DO NOT use)

- Glassmorphism `backdrop-filter: blur()` on content panels (kills perf, overused)
- Generic indigo/purple SaaS gradients  
- `border-radius: 12px+` on functional panels (too bubbly)
- Rounded pill buttons for primary actions in tables (use compact square-ish)
- Emoji icons — use inline SVG or unicode symbols
- Drop shadows on everything — use borders for depth
- White/light backgrounds — always dark surfaces
- `font-family: Inter` alone — Space Grotesk differentiates headings
- Animations > 300ms on utility interactions

---

## In-Game Injection Notes

When injecting into Tribal Wars DOM:

1. Scope all CSS under `.twscripts-root` to avoid game style conflicts
2. Use `position: fixed` or `position: absolute` with explicit `z-index: 8000+`
3. Reset inherited game styles on root element:
   ```css
   .twscripts-root * {
     box-sizing: border-box;
     font-family: var(--tw-font-body);
     line-height: 1.5;
   }
   ```
4. Inject fonts via `<link>` in `<head>` if not loaded
5. Use shadow DOM for full isolation on complex UIs

---

## Quick Reference Card

```
Bg base:      #090D18
Bg surface:   #111827
Bg elevated:  #1C2333
Accent cyan:  #00C8FF
Amber:        #F59E0B
Text:         #E8EDF5
Muted:        #8899BB
Border:       #2A3550
Success:      #22C55E
Danger:       #EF4444

Heading: Space Grotesk 600-700
Body:    IBM Plex Sans 400-500
Mono:    JetBrains Mono 400-500

Radius: 3px / 6px / 10px
Motion: 150-200ms ease
```
