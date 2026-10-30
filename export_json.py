"""Additive JSON export for the redesigned app (schema v1, see docs/DATA_FORMAT.md).

publish.py calls export(payload) after it has written data.js. data.js is unchanged and stays the
primary source; this only ADDS:
  data/latest.json        index of all days + 30-day number series + the full latest day
  data/YYYY-MM-DD.json    one full day (same shape as a data.js days[] entry)

Optional richer fields: if a day folder contains structured.json (written by NBFC Guru when it can),
its "stories", "rules", "rules_note", "items_sources" and "items_value_num" keys are merged into that
day. Nothing is ever copied from one day to another: a figure missing on a day is null in the series.
Report content is passed through untouched, so every data/<id>.json report equals its data.js entry.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
SCHEMA_VERSION = 1
SERIES_DAYS = 30


def _num(value):
    if value is None:
        return None
    s = str(value).replace("\u2212", "-").replace("\u2013", "-").replace(",", "")
    m = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else None


def _clean_num(v):
    """value_num must be a real number or null. Anything else (bool, string, NaN) becomes null: never guessed."""
    if isinstance(v, bool) or not isinstance(v, (int, float)) or v != v or v in (float("inf"), float("-inf")):
        return None
    return v


def series_value(item: dict):
    """An explicit value_num wins, even when it is null (the figure was ambiguous). Otherwise parse value."""
    if "value_num" in item:
        return _clean_num(item["value_num"])
    return _num(item.get("value"))


def _merge_structured(day: dict) -> dict:
    side = ROOT / "days" / day["id"] / "structured.json"
    if not side.exists():
        return day
    try:
        extra = json.loads(side.read_text(encoding="utf-8"))
    except Exception as exc:  # a bad sidecar must never break publishing
        print(f"export_json: ignored {side}: {exc}")
        return day
    out = dict(day)
    for key in ("stories", "rules"):
        if isinstance(extra.get(key), list):
            out[key] = extra[key]
    if isinstance(extra.get("rules_note"), str) and extra["rules_note"].strip():
        out["rules_note"] = extra["rules_note"].strip()
    srcs = extra.get("items_sources")
    nums = extra.get("items_value_num")
    if out.get("key_numbers") and (isinstance(srcs, dict) or isinstance(nums, dict)):
        kn = dict(out["key_numbers"])
        items = []
        for it in kn.get("items", []):
            it = dict(it)
            if isinstance(srcs, dict) and it.get("key") in srcs:
                it["sources"] = srcs[it["key"]]
            if isinstance(nums, dict) and it.get("key") in nums:
                it["value_num"] = _clean_num(nums[it["key"]])
            items.append(it)
        kn["items"] = items
        out["key_numbers"] = kn
    return out


def _index_entry(day: dict) -> dict:
    return {
        "id": day["id"], "label": day["label"], "weekday": day["weekday"], "is_monday": day["is_monday"],
        "due": day["due"], "filed": day["filed"], "podcast": day["podcast"],
        "core_found": (day.get("key_numbers") or {}).get("core_found", 0),
        "reports": [
            {"key": r["key"], "section": r["section"], "title": r["title"], "missing": r["missing"],
             "expected": r["expected"], "words": r.get("words", 0), "sources": r.get("sources", 0)}
            for r in day["reports"]
        ],
    }


def export(payload: dict) -> None:
    days = sorted((_merge_structured(d) for d in payload["days"]), key=lambda d: d["id"], reverse=True)
    if not days:
        return
    DATA.mkdir(exist_ok=True)
    for d in days:
        (DATA / f"{d['id']}.json").write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    recent = sorted(d["id"] for d in days)[-SERIES_DAYS:]
    by_id = {d["id"]: d for d in days}
    keys = sorted({it["key"] for d in days for it in (d.get("key_numbers") or {}).get("items", [])})
    series = {}
    for k in keys:
        series[k] = {}
        for i in recent:
            hit = [it for it in (by_id[i].get("key_numbers") or {}).get("items", []) if it["key"] == k]
            series[k][i] = series_value(hit[0]) if hit else None
    latest = {
        "schema_version": SCHEMA_VERSION,
        "generated": payload["generated"],
        "primary": os.environ.get("NBFC_JSON_PRIMARY") == "1",
        "latest": days[0]["id"],
        "days": [_index_entry(d) for d in days],
        "series": series,
        "today": days[0],
    }
    (DATA / "latest.json").write_text(json.dumps(latest, ensure_ascii=False), encoding="utf-8")
    print(f"Exported {len(days)} day file(s) + data/latest.json (schema v{SCHEMA_VERSION})")
