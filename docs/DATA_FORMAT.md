# NBFC Guru data format (schema v1)

The app reads data in this order:

1. `data/latest.json`, but only when it has `"schema_version": 1` and its `generated` is the same as (or newer than) the `generated` at the top of `data.js`. The app reads just the first 256 bytes of `data.js` (an HTTP Range request) to check. You can force JSON for testing with `?src=json`, or force data.js with `?src=legacy`.
2. Otherwise `data.js` (`window.BRIEFING = {...}`), which is what `publish.py` writes today. **data.js remains the source of truth.** Until `data/` is committed, every visit falls back to it.

Nothing about NBFC Guru's inputs changes:

- `days/YYYY-MM-DD/01-daily-watch.md`, `02-regulation.md`, `podcast-script.txt`, and `03-weekly-analysis.md` on Mondays.
- `regulatory-log.md`.
- Then `python3 publish.py`.

`publish.py` still writes `data.js` byte-for-byte as before; only the `generated` timestamp differs. After that it calls `export_json.export()` inside a try/except. That call *additionally* writes:

| File | Contents |
|---|---|
| `data/YYYY-MM-DD.json` | One full day. Same shape as a `data.js` `days[]` entry. |
| `data/latest.json` | `{schema_version:1, generated, primary, latest, days:[index…], series, today:<full day>}` |

To get the faster JSON path, commit `data/` along with `data.js` after each `python3 publish.py`. data/latest.json is about 19 KB compressed; data.js is about 1.1 MB. Because of the `generated` check, a stale or forgotten `data/` folder just falls back to data.js and never shows an old edition. The `primary` field (`NBFC_JSON_PRIMARY=1`) is still written for information, but the app no longer needs it.

## Day object (data.js `days[]` entry = `data/YYYY-MM-DD.json`)

```jsonc
{
  "id": "2026-10-30", "label": "Friday, 30 October 2026", "iso": "2026-10-30", "weekday": "Friday",
  "is_monday": false, "due": 2, "filed": 2, "podcast": true,
  "reports": [{
    "id": "2026-10-30-01-daily-watch", "key": "01-daily-watch",   // or 02-regulation, 03-weekly-analysis
    "section": "News", "kind": "...", "agent": "NBFC Guru", "when": "7:00 AM", "monday_only": false,
    "title": "...", "excerpt": "...", "content": "<raw markdown>",
    "missing": false, "expected": true, "file": "days/2026-10-30/01-daily-watch.md",
    "sources": 45, "words": 1980, "sections": ["..."]
  }],
  "key_numbers": {
    "origin": "block" | "text" | null, "core_total": 11, "core_found": 11, "report_id": "...",
    "items": [{
      "key": "nifty", "name": "Nifty 50", "group": "index" | "peer" | "macro" | "flows",
      "value": "22,936.75",              // shown verbatim
      "change": "+237.90 (+1.05%)",      // "—" when the report gives none
      "dir": "up" | "down" | null,
      "asof": "2026-10-29", "asof_label": "29 Oct 2026", "basis": "close",
      "source": {"label": "NSE index closes", "url": "https://..."},   // REQUIRED for display
      "origin": "block"
    }],
    "watchlist": [{"name": "NCD Tranche I | subscription", "value": "1.67× …", "asof": "...", "asof_label": "...", "source": {"label": "...", "url": "..."}}]
  }
}
```

Item keys:

- core (11): `sensex nifty niftyfin manappuram muthoot iifl shriram bajaj usdinr gold10g brent`
- extra: `goldspot fii dii`

`muthoot` is **Muthoot Finance, a listed peer**. Muthoot Fincorp (MFL) appears only in `watchlist`.

## `latest.json` extras

- `days[]` is a light index: `id`, `label`, `weekday`, `is_monday`, `due`, `filed`, `podcast`, `core_found`, and `reports[{key, section, title, missing, expected, words, sources}]`. Full days are fetched from `data/<id>.json`.
- `series` is `{ "<item key>": { "YYYY-MM-DD": number | null } }` for the last 30 editions. `null` means that day's report did not state the figure. **Values are never carried forward.** Sparklines draw a gap there.

## Optional richer fields (NBFC Guru may add any of these; the app uses them when present)

Put them in an optional sidecar, `days/YYYY-MM-DD/structured.json`. The exporter merges it into that day. The markdown files stay unchanged.

```jsonc
{
  "stories": [{                       // replaces parsing the 🔴 URGENT block for the hero + "Also in the news"
    "title": "MFL's Tranche I NCD reached 1.67× on Thursday.",
    "dek": "HNI demand is above 2.3× …",
    "why": "Why it matters for MFL …",
    "sentiment": "positive" | "negative" | "neutral" | "watch",   // per-story tag
    "tag": "MFL" | "Peer" | "Regulation" | "Market" | "Macro",
    "sources": [{"label": "Chittorgarh", "url": "https://..."}]   // per-story sources (≥1)
  }],
  "rules": [{                         // Rules desk: structured circulars
    "issuer": "RBI" | "SEBI" | "IBBI" | "MCA",
    "ref": "RBI/2026-27/112 DoR.FIN.REC.45/03.10.001/2026-27",   // circular number
    "date": "2026-10-29",                                         // circular date
    "title": "...", "tag": "NEW_REG" | "AMENDMENT" | "CONSULTATION" | "CLARIFICATION",
    "effective": "2026-11-01" | null, "applies_to_mfl": true,
    "url": "https://rbi.org.in/..."
  }],
  "items_sources": {                  // per-item multiple sources, keyed by item key
    "nifty": [{"label": "NSE", "url": "https://..."}, {"label": "BusinessLine", "url": "https://..."}]
  }
}
```

Rules for every field:

- Every figure must carry a source URL.
- A missing figure is omitted (or `null`). Never copy it from an earlier day.
- Dates use ISO `YYYY-MM-DD`, in IST.
