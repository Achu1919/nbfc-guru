"""Checks for export_json.py. Run: python3 -m unittest discover tests

Each test copies publish.py, keynumbers.py, export_json.py and days/ into a temp folder and runs
publish.py THERE, so the repo's data.js, data/ and days/ are never touched.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def make_site(tmp: Path) -> Path:
    for f in ("publish.py", "keynumbers.py", "export_json.py"):
        shutil.copy2(REPO / f, tmp / f)
    shutil.copytree(REPO / "days", tmp / "days", ignore=shutil.ignore_patterns("structured.json"))
    return tmp


def publish(site: Path) -> tuple[dict, dict]:
    out = subprocess.run([sys.executable, "publish.py"], cwd=site, capture_output=True, text=True)
    assert out.returncode == 0, out.stdout + out.stderr
    assert "JSON export skipped" not in out.stdout, out.stdout
    raw = (site / "data.js").read_text(encoding="utf-8")
    assert raw.startswith("window.BRIEFING = ") and raw.rstrip().endswith(";")
    legacy = json.loads(raw[len("window.BRIEFING = "):].rstrip().rstrip(";"))
    latest = json.loads((site / "data" / "latest.json").read_text(encoding="utf-8"))
    return legacy, latest


def day_json(site: Path, day_id: str) -> dict:
    return json.loads((site / "data" / f"{day_id}.json").read_text(encoding="utf-8"))


def rep(day: dict, key: str) -> dict:
    return next(r for r in day["reports"] if r["key"] == key)


class Base(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self.site = make_site(Path(self._tmp.name))

    def tearDown(self):
        self._tmp.cleanup()

    def assertConsistent(self, legacy: dict, latest: dict):
        """latest.json and every data/<id>.json agree with data.js (no sidecars in these runs)."""
        self.assertEqual(latest["schema_version"], 1)
        self.assertEqual(latest["generated"], legacy["generated"])
        ids = sorted((d["id"] for d in legacy["days"]), reverse=True)
        self.assertEqual(latest["latest"], ids[0])
        self.assertEqual([d["id"] for d in latest["days"]], ids)
        by_id = {d["id"]: d for d in legacy["days"]}
        self.assertEqual(latest["today"], by_id[ids[0]])
        for d in legacy["days"]:
            self.assertEqual(day_json(self.site, d["id"]), d, d["id"])
        for entry in latest["days"]:
            src = by_id[entry["id"]]
            for k in ("due", "filed", "podcast", "is_monday"):
                self.assertEqual(entry[k], src[k], (entry["id"], k))
            self.assertEqual([(r["key"], r["missing"], r["expected"]) for r in entry["reports"]],
                             [(r["key"], r["missing"], r["expected"]) for r in src["reports"]])


class WeeklyPassThrough(Base):
    def test_monday_weekly_identical_to_data_js(self):
        legacy, latest = publish(self.site)
        self.assertConsistent(legacy, latest)
        mondays = [d for d in legacy["days"] if d["is_monday"] and not rep(d, "03-weekly-analysis")["missing"]]
        self.assertTrue(mondays, "no Monday with 03-weekly-analysis.md in days/")
        for d in mondays:
            want = rep(d, "03-weekly-analysis")
            got = rep(day_json(self.site, d["id"]), "03-weekly-analysis")
            self.assertEqual(got, want, d["id"])
            self.assertEqual(got["content"], want["content"])
            text = (self.site / "days" / d["id"] / "03-weekly-analysis.md").read_text(encoding="utf-8")
            self.assertEqual(want["content"].strip(), text.strip(), d["id"])  # nothing rewritten
            self.assertTrue(want["expected"])
        # a non-Monday never expects the weekly
        for d in legacy["days"]:
            if not d["is_monday"]:
                self.assertFalse(rep(d, "03-weekly-analysis")["expected"], d["id"])


class PartialDay(Base):
    def test_only_news_filed(self):
        last = sorted(p.name for p in (self.site / "days").iterdir() if p.is_dir())[-1]
        folder = self.site / "days" / last
        for f in ("02-regulation.md", "podcast-script.txt"):
            (folder / f).unlink(missing_ok=True)
        # also a Monday with only the news desk in (rules, weekly and podcast still to come)
        monday = date.fromisoformat(last)
        while True:
            monday = date.fromordinal(monday.toordinal() + 1)
            if monday.weekday() == 0:
                break
        mdir = self.site / "days" / monday.isoformat()
        mdir.mkdir()
        shutil.copy2(folder / "01-daily-watch.md", mdir / "01-daily-watch.md")

        legacy, latest = publish(self.site)
        self.assertConsistent(legacy, latest)
        by_id = {d["id"]: d for d in legacy["days"]}

        d = by_id[last]
        self.assertFalse(rep(d, "01-daily-watch")["missing"])
        self.assertTrue(rep(d, "02-regulation")["missing"] and rep(d, "02-regulation")["expected"])
        self.assertFalse(d["podcast"])
        self.assertEqual(d["filed"], 1)

        m = by_id[monday.isoformat()]
        self.assertEqual(latest["latest"], monday.isoformat())
        self.assertEqual((m["due"], m["filed"], m["podcast"]), (3, 1, False))
        self.assertTrue(rep(m, "03-weekly-analysis")["missing"] and rep(m, "03-weekly-analysis")["expected"])
        self.assertEqual(latest["today"], m)
        # the copied news gives figures for the new day; no figure is invented for a day without one
        for k, pts in latest["series"].items():
            for day_id, v in pts.items():
                items = [i for i in by_id[day_id]["key_numbers"]["items"] if i["key"] == k]
                if not items:
                    self.assertIsNone(v, (k, day_id))


class Sidecar(Base):
    def test_value_num_and_empty_rules(self):
        last = sorted(p.name for p in (self.site / "days").iterdir() if p.is_dir())[-1]
        (self.site / "days" / last / "structured.json").write_text(json.dumps({
            "rules": [], "rules_note": "  RBI, SEBI, IBBI checked 06:40 IST.  ",
            "items_value_num": {"nifty": 12345.5, "sensex": None, "gold10g": "12,000", "brent": True},
        }), encoding="utf-8")
        legacy, latest = publish(self.site)
        today = latest["today"]
        self.assertEqual(today["rules"], [])
        self.assertEqual(today["rules_note"], "RBI, SEBI, IBBI checked 06:40 IST.")
        items = {i["key"]: i for i in today["key_numbers"]["items"]}
        ser = {k: v[last] for k, v in latest["series"].items()}
        self.assertIn("nifty", items)
        self.assertEqual(items["nifty"]["value_num"], 12345.5)
        self.assertEqual(ser["nifty"], 12345.5)
        checked = 0
        for k in ("sensex", "gold10g", "brent"):  # null, or not a real number -> null, never parsed or guessed
            if k in items:
                checked += 1
                self.assertIsNone(items[k]["value_num"], k)
                self.assertIsNone(ser[k], k)
        self.assertGreater(checked, 0)
        # data.js itself is unaffected by the sidecar
        self.assertNotIn("rules", next(d for d in legacy["days"] if d["id"] == last))
        self.assertNotIn("value_num", json.dumps(legacy))


if __name__ == "__main__":
    unittest.main()
