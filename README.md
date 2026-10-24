# The Briefing

Official morning paper for the NBFC jobs. This design is final.

## Open it

Live site: https://nbfc-guru.vercel.app

Local preview: run `python3 -m http.server` in this folder and open http://localhost:8000.

## How to read it

- **News** — Daily Watch (NBFC Guru, 7:00 AM IST)
- **Rules** — Regulatory Monitor (NBFC Guru, 7:00 AM IST)
- **Weekly** — Weekly Analysis (NBFC Guru, Mondays 7:15 AM IST)

Pick a date in the top bar. Tap a desk that says *Ready*. The article is on the page.

## What files where

```
reader.html     the paper
publish.py      rebuilds the index after a job files
data.js         generated — do not edit by hand
days/YYYY-MM-DD/
  01-daily-watch.md
  02-regulation.md
  03-weekly-analysis.md   Mondays only
demo/           old sketches, not the product
```

Jobs write the markdown themselves, then run `python publish.py`.
