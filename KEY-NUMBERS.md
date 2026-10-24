# Key numbers block (dashboard data spec)

The dashboard ticker, the "Key numbers" tile, the article rail and the MFL watchlist panel
show **only** figures that appear in that day's news report
(`days/<YYYY-MM-DD>/01-daily-watch.md`). `publish.py` reads them with `keynumbers.py` and writes
them to `data.js` as `days[i].key_numbers`. Nothing is typed into the site, and no value is ever
carried over from an earlier day. If a figure is not in today's file, the site shows it as
"not in today's report".

## Where it goes

Add a section to `01-daily-watch.md` whose heading contains **Key numbers** (for example,
`## 🔢 Key numbers`). The best place is just before `## 🔗 Source Links`. The section ends at the next `## ` heading.
The site hides it from the article body and shows it in the right rail instead. It is also left out of word counts.

## Table 1: market items (must have a `Change` column)

| Column | Meaning |
|---|---|
| Item | One of the allowed names below. A trailing "(peer)" is fine. |
| Value | Copy it exactly as the report states it, including any ₹/$ sign and Indian grouping. Prefix `~` if the report says about, around or approx. |
| Change | Day change exactly as reported, e.g. `−125.56 (−0.17%)`, `−1.03%`, `−12 paise`. Its sign (− or +) sets the red or green colour. Leave as `—` if the report gives no change. |
| As of | ISO date (`YYYY-MM-DD`) of the session or print the figure belongs to, which is usually the previous trading day. Use `—` if the report does not say; the site then shows "as-of not stated" (publish.py warns). |
| Basis | Short note such as close, NSE close, MCX Dec futures, morning, provisional or approx. |
| Source | A markdown link `[label](url)` to the source the report used for that figure. |

**Allowed items.** Core items (11) are counted in the "Key numbers N/11" tile:

| Key | Item name to use | Also accepted |
|---|---|---|
| sensex | Sensex | BSE Sensex |
| nifty | Nifty 50 | Nifty, Nifty50 |
| niftyfin | Nifty Financial Services | Nifty Fin Services, FinNifty |
| manappuram | Manappuram Finance (peer) | Manappuram |
| muthoot | Muthoot Finance (peer) | Muthoot Fin. This must not be Muthoot **Fincorp**/MFL, which is rejected. |
| iifl | IIFL Finance (peer) | IIFL |
| shriram | Shriram Finance (peer) | Shriram |
| bajaj | Bajaj Finance (peer) | |
| usdinr | USD/INR | Rupee, INR |
| gold10g | Gold (₹/10g) | MCX gold |
| brent | Brent ($/bbl) | Brent crude |

The optional items are not counted: `Gold spot ($/oz)`, `FII net (₹ cr)`, `DII net (₹ cr)`.

**Missing values.** If the report does not give a figure, write `—` in Value (or leave out the row).
`""`, `—`, `–`, `-`, `n/a`, `na`, `not available` and `not in report` all count as missing.
Missing core items show as "Not in today's report: …" and never as an old number.

## Table 2: MFL watchlist (optional, under a `### …watchlist` heading)

Columns: `Item | Value | As of | Source`. Value is free text (status, size, coupons, ratings, key dates).
Each row appears on the home "Watchlist · MFL" panel and in the article rail. If the table is missing, the panel is hidden.

## Example (2026-10-24, every figure taken from that day's report text)

## 🔢 Key numbers

| Item | Value | Change | As of | Basis | Source |
|---|---|---|---|---|---|
| Sensex | 73,123.83 | −125.56 (−0.17%) | 2026-10-23 | close | [BusinessLine](https://www.thehindubusinessline.com/markets/sensex-nifty50-today-stock-market-highlights-23rd-october-2026/article71611889.ece) |
| Nifty 50 | 22,600 | −87.65 (−0.39%) | 2026-10-23 | close | [BusinessLine](https://www.thehindubusinessline.com/markets/sensex-nifty50-today-stock-market-highlights-23rd-october-2026/article71611889.ece) |
| Nifty Financial Services | 24,403.00 | −1.03% | 2026-10-23 | close | [TrackLivePrice](https://trackliveprice.com/nifty-financial-services/) |
| Manappuram Finance (peer) | ₹286.10 | −5.23% | 2026-10-23 | NSE close | [exa.ai MANAPPURAM](https://exa.ai/library/markets/stock/MANAPPURAM?exchange=XNSE&date=2026-10-23&view=daily) |
| Muthoot Finance (peer) | ₹2,373.00 | −1.74% | 2026-10-23 | NSE close | [exa.ai MUTHOOTFIN](https://exa.ai/library/markets/stock/MUTHOOTFIN?exchange=XNSE&date=2026-10-23&view=daily) |
| IIFL Finance (peer) | — | — | — | not in today's report | — |
| Shriram Finance (peer) | ~₹865 | ~−4% | — | approx. ("settled about 4% lower"); session date not stated | [Mint](https://www.livemint.com/news/gold-loan-stress-nbfc-piramal-bajaj-finance-precious-metal-11792580129138.html) |
| Bajaj Finance (peer) | — | — | — | not in today's report | — |
| USD/INR | 94.93 | −12 paise | 2026-10-23 | close | [Moneycontrol live, 23 Oct](https://www.moneycontrol.com/news/business/markets/stock-market-live-updates-nifty50-share-price-sensex-share-price-crude-fii-gift-nifty-rupee-latest-updates-23-10-2026-alpha-liveblog-14058065.html) |
| Gold (₹/10g) | ~₹1,42,150 | — | 2026-10-24 | MCX Dec futures, morning | [ET MCX gold](https://economictimes.indiatimes.com/commoditysummary/symbol-GOLD.cms) |
| Brent ($/bbl) | ~$114 | — | 2026-10-23 | approx., per 23 Oct live blog | [Moneycontrol live, 23 Oct](https://www.moneycontrol.com/news/business/markets/stock-market-live-updates-nifty50-share-price-sensex-share-price-crude-fii-gift-nifty-rupee-latest-updates-23-10-2026-alpha-liveblog-14058065.html) |
| Gold spot ($/oz) | ~$3,996 | — | 2026-10-24 | morning | [Gold spot](https://exa.ai/library/markets/commodity/gold?currency=USD) |
| FII net (₹ cr) | +887.65 | — | 2026-10-23 | provisional | [Moneycontrol](https://www.moneycontrol.com/news/business/markets/fiis-net-buy-rs-888-crore-of-indian-equities-while-diis-net-buy-rs-3459-crore-14058825.html) |
| DII net (₹ cr) | +3,235.36 | — | 2026-10-23 | provisional | [Moneycontrol](https://www.moneycontrol.com/news/business/markets/fiis-net-buy-rs-888-crore-of-indian-equities-while-diis-net-buy-rs-3459-crore-14058825.html) |

### MFL watchlist

| Item | Value | As of | Source |
|---|---|---|---|
| NCD Tranche I status | Open, 23 Oct – 5 Nov 2026 | 2026-10-24 | [Chittorgarh](https://www.chittorgarh.com/bond/muthoot-fincorp-tranche-i-ncd-october-2026/399/) |
| NCD Tranche I size | ₹200 cr base + ₹300 cr green shoe = ₹500 cr (₹4,000 cr shelf) | 2026-10-24 | [FintechBizNews](https://www.fintechbiznews.com/exchanges-ipos-nfos/muthoot-fincorp-rolls-out-ncd-tranche-i-aims-to-raise-rs5-bn) |
| NCD Tranche I coupons | 8.56%–9.25% (effective yield 8.89–9.25%) | 2026-10-24 | [Nuvama prospectus](https://www.nuvama.com/wp-content/uploads/2026/10/Muthoot-FinCorp-Limited-Tranche-I-Prospectus-dated-October-19-2026.pdf) |
| NCD Tranche I subscription | 0.55× at end of day 1 | 2026-10-23 | [Chittorgarh](https://www.chittorgarh.com/bond/muthoot-fincorp-tranche-i-ncd-october-2026/399/) |
| Ratings | CRISIL AA/Stable · BWR AA+/Stable · CARE AA/Stable | 2026-10-24 | [Chittorgarh](https://www.chittorgarh.com/bond/muthoot-fincorp-tranche-i-ncd-october-2026/399/) |
| Key date: SEBI Credit Risk-o-Meter live | 21 Nov 2026 | 2026-10-24 | — |

## Old days without a block: text fallback (best effort)

For days that have no Key numbers section, `keynumbers.parse_fallback` reads the report text
**conservatively** and keeps a figure only when it is unambiguous. The site marks these figures as
"read from report text" (dotted underline in the ticker, plus a note in the rail and archive).

- The label must be followed directly by the number, with only filler words between them. Lines about targets, TP, upside, downside, averages, forecasts or estimates are skipped, and so are Source sections.
- The number must end cleanly: no cr, crore, lakh, bn, %, x, and no ranges (`₹965–970` is rejected). It must also fall within a sanity range for that item.
- If the file has more than one distinct value for an item, nothing is shown for it.
- As-of is set only from a trusted context: a single date in the bullet's bold lead-in (not a range), "on/as of DATE" right after the value, or a date beside "close". Otherwise it shows "as-of not stated".
- Change is kept only when it is a clean signed day change. Mixed day and week text is dropped.
- Source is the first link on that line, if there is one. If there is none, the figure links to the article.

Limits: 19 of the 62 days give no figures (no news report, or nothing unambiguous). Text-read values can still be wrong if the report
text itself is wrong, so the block is the source of truth from now on.
