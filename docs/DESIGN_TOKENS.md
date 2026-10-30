# NBFC Guru design tokens (v6)

All colour, type, spacing, radius and elevation values live as CSS custom properties at the top of `app.css`.
Components use **semantic** tokens only (`--bg`, `--text-1`, `--accent` …). Never reference a raw hex or a
primitive (`--n500`, `--a600`) inside a component rule.

Themes: **Light** and **Dark** only. On a first visit the theme follows `prefers-color-scheme`. Once the user taps
the toggle, the choice is saved in `localStorage['nbfc-theme']` and used from then on. There is no "system" state.

## Primitives

| Neutral | Hex | Accent (ink blue) | Hex |
|---|---|---|---|
| n0 | `#FFFFFF` | a50 | `#EEF2FA` |
| n50 | `#F6F7F9` | a100 | `#DCE4F5` |
| n100 | `#EEF0F3` | a200 | `#B9C8EB` |
| n200 | `#E1E4E9` | a300 | `#8EA6E0` |
| n300 | `#C9CDD5` | a400 | `#6585D2` |
| n400 | `#9EA3AE` | a500 | `#4366BE` |
| n500 | `#6B717E` | a600 | `#2F4FA3` |
| n600 | `#535965` | a700 | `#253F84` |
| n700 | `#3C414B` | a800 | `#1D3166` |
| n800 | `#272A31` | a900 | `#15244A` |
| n850 | `#1E2026` | | |
| n900 | `#17191E` | | |
| n950 | `#0E0F12` | | |

## Semantic tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F7F9` | `#0E0F12` | page background (flat, no gradients) |
| `--surface-1` | `#FFFFFF` | `#16181C` | cards, tables |
| `--surface-2` | `#EEF0F3` | `#1C1E23` | segmented track, hover |
| `--surface-3` | `#E1E4E9` | `#25282E` | pressed |
| `--chrome` | `rgba(255,255,255,.86)` | `rgba(26,28,33,.86)` | top pill and bottom nav (the only blurred surfaces) |
| `--text-1` | `#17191E` | `#ECEDF0` | primary text |
| `--text-2` | `#535965` | `#A8ADB7` | secondary text |
| `--text-3` | `#6B717E` | `#878D98` | meta and captions (≥4.5:1 on bg and surface-1) |
| `--border` | `rgba(23,25,30,.10)` | `rgba(255,255,255,.09)` | card outlines |
| `--hairline` | `rgba(23,25,30,.07)` | `rgba(255,255,255,.06)` | row dividers |
| `--border-strong` | `rgba(23,25,30,.18)` | `rgba(255,255,255,.16)` | controls |
| `--accent` | `#2F4FA3` | `#8EA6E0` | links, focus ring, active dots |
| `--accent-soft` | `rgba(47,79,163,.08)` | `rgba(142,166,224,.12)` | selected-row tint |
| `--on-accent` | `#FFFFFF` | `#0E0F12` | text on accent |
| `--up` | `#0E7A4B` | `#4BC28A` | gains |
| `--down` | `#B42330` | `#F2777A` | losses |
| `--warn` | `#8F5C06` | `#E2AC52` | rules / caution |
| `--inv` / `--on-inv` | `#17191E` / `#F6F7F9` | `#ECEDF0` / `#0E0F12` | active pill, today in the calendar, toasts |
| `--cover` | `#17191E` | `#24272D` | daily magazine cover |
| `--cover-wk` | `#253F84` | `#253F84` | weekly-edition cover |
| `--cover-ink` / `--cover-ink2` | `#F3F4F6` / `rgba(243,244,246,.68)` | same | text on covers |

Archive dots: News = accent, Rules = warn, Weekly = n700 (dark: n300), Audio = up.

## Type

Inter (system fallback), tabular numbers (`font-variant-numeric: tabular-nums`) on every figure.
Scale: `--t-12` 12 · `--t-13` 13 · `--t-15` 15 · `--t-17` 17 · `--t-20` 20 · `--t-24` 24 · `--t-34` clamp(30px, 8.2vw, 36px).
Headings are 650–700 weight with tight tracking. No gradient text and no emoji in headings (report emoji are stripped at render time).

## Spacing (8px grid, 4px half-step)

`--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48.

## Radius

`--r-s` 6 (covers, chips) · `--r-m` 10 (pills, buttons) · `--r-l` 14 (cards) · `--r-pill` 999 (top pill, bottom nav).

## Elevation

`--elev-1` cards (hairline + 1px shadow) · `--elev-2` floating chrome · `--elev-3` covers and the open transition.
Dark theme uses deeper, lower-opacity shadows plus a 1px light edge on covers.

## Chrome

- Top pill: fixed, `--pill-h` 52px (60 on ≥900px), inset 12px, `--chrome` plus 30px blur. It is the only header: the
  page title fades out under it before the compact title, date and key stat fade in.
- Bottom nav: same glass, with a neutral `--surface-2` active indicator and the active label at weight 650 in `--text-1`.
