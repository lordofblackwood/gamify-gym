#!/usr/bin/env python3
"""Build anonymous reference curves from public source snapshots. See docs/strength-data.md."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
from html.parser import HTMLParser
import zipfile

LIFTS = {"backSquat": ("squat", "Best3SquatKg"), "benchPress": ("bench-press", "Best3BenchKg"), "deadlift": ("deadlift", "Best3DeadliftKg")}
PERCENTILES = [1, 5, 10, 25, 50, 75, 90, 95, 97.5, 99, 99.5, 99.9]
CENTERS = {"M": list(range(50, 141, 5)), "F": list(range(40, 121, 5))}

class Tables(HTMLParser):
    def __init__(self):
        super().__init__(); self.tables = []; self.table = None; self.cell = None
    def handle_starttag(self, tag, attrs):
        if tag == "table": self.table = []
        if self.table is not None and tag == "tr": self.row = []
        if self.table is not None and tag in ("th", "td"): self.cell = ""
    def handle_data(self, data):
        if self.cell is not None: self.cell += data
    def handle_endtag(self, tag):
        if tag in ("th", "td") and self.cell is not None:
            self.row.append(self.cell.strip()); self.cell = None
        if tag == "tr" and self.table is not None: self.table.append(self.row)
        if tag == "table" and self.table is not None:
            self.tables.append(self.table); self.table = None

def sha(path):
    return hashlib.file_digest(open(path, "rb"), "sha256").hexdigest()

def quantiles(values):
    values = sorted(values)
    assert len(values) >= 200, "Do not publish a sparse cohort"
    def q(p):
        index = (len(values) - 1) * p / 100
        lower = int(index); upper = min(lower + 1, len(values) - 1)
        return round(values[lower] + (values[upper] - values[lower]) * (index - lower), 4)
    return [q(p) for p in PERCENTILES]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("src/data/strength-references.mjs"))
    args = parser.parse_args(); root = args.inputs
    data = {"version": "public-strength-2026-09-v1", "retrieved": "2026-09-09"}
    hardy_path = root / "hardy-strength-report-data.csv"
    rows = list(csv.DictReader(hardy_path.open()))
    data["hardy"] = {"url": "https://hardy.app/strength-report", "csvUrl": "https://hardy.app/strength-report-data.csv", "license": "CC BY 4.0", "sha256": sha(hardy_path), "through": "2026-09-02", "percentiles": [10, 25, 50, 75, 90, 99], "lifts": {}}
    for id, (slug, _) in LIFTS.items():
        key = slug
        values = {r["metric"]: float(r["value"]) for r in rows if r["dataset"] == "percentiles" and r["key1"] == key and r["key2"] == "all"}
        assert values, f"Missing Hardy lift {key}"
        data["hardy"]["lifts"][id] = {"n": int(values["users"]), "kg": [values[f"e1rmP{p}Kg"] for p in data["hardy"]["percentiles"]]}
    counts = {"backSquat": {"M": 15314, "F": 6760}, "benchPress": {"M": 17296, "F": 7112}, "deadlift": {"M": 15107, "F": 6570}}
    data["strengthlog"] = {"url": "https://www.strengthlog.com/strength-standards/", "percentiles": [5, 25, 50, 75, 95], "lifts": {}}
    for id, (slug, _) in LIFTS.items():
        path = root / f"strengthlog-{slug}.html"
        parsed = Tables(); parsed.feed(path.read_text())
        tables = [t for t in parsed.tables if t[0][0] == "Bodyweight"]
        assert len(tables) == 2
        data["strengthlog"]["lifts"][id] = {"url": f"https://www.strengthlog.com/{slug}-strength-standards-kg/", "sha256": sha(path), "categories": {}}
        for sex, table in zip(["M", "F"], tables):
            values = [[float(v) for v in row] for row in table[1:]]
            assert [v[0] for v in values] == CENTERS[sex]
            assert all(all(a < b for a, b in zip(v[1:], v[2:])) for v in values)
            data["strengthlog"]["lifts"][id]["categories"][sex] = {"n": counts[id][sex], "rows": [{"bodyweightKg": v[0], "kg": v[1:]} for v in values]}

    zip_path = root / "openpowerlifting-public.zip"
    cohorts = {"absolute": {}}
    for sex, centers in CENTERS.items():
        for center in centers: cohorts[f"{sex}-{center}"] = {}
    total = selected = 0
    with zipfile.ZipFile(zip_path) as archive:
        name = next(n for n in archive.namelist() if n.endswith(".csv"))
        for row in csv.DictReader(io.TextIOWrapper(archive.open(name), encoding="utf-8")):
            total += 1
            if row["Equipment"] != "Raw" or row["Event"] != "SBD" or row["Tested"] != "Yes" or not "2010-01-01" <= row["Date"] <= "2026-09-04": continue
            try:
                age = float(row["Age"]); bw = float(row["BodyweightKg"])
                lifts = [float(row[field]) for _, field in LIFTS.values()]
                completed_total = float(row["TotalKg"])
            except ValueError: continue
            if age < 18 or bw <= 0 or completed_total <= 0 or min(lifts) <= 0 or row["Place"] in ("DQ", "DD", "NS"): continue
            selected += 1
            person = (row["Name"], row["Sex"])
            keys = ["absolute"] + [f"{row['Sex']}-{c}" for c in CENTERS.get(row["Sex"], []) if c * .9 <= bw <= c * 1.1]
            for key in keys:
                previous = cohorts[key].get(person)
                cohorts[key][person] = [max(a, b) for a, b in zip(previous, lifts)] if previous else lifts
    opl = {"url": "https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html", "license": "Public domain", "file": name.split("/")[-1], "sha256": sha(zip_path), "through": "2026-09-04", "totalRows": total, "eligibleMeetRows": selected, "percentiles": PERCENTILES, "absolute": {}, "categories": {"M": {}, "F": {}}}
    for key, people in cohorts.items():
        curves = {id: {"n": len(people), "kg": quantiles([values[i] for values in people.values()])} for i, id in enumerate(LIFTS)}
        if key == "absolute": opl["absolute"] = curves
        else:
            sex, bw = key.split("-")
            for id, curve in curves.items():
                opl["categories"][sex].setdefault(id, []).append({"bodyweightKg": int(bw), **curve})
    data["openpowerlifting"] = opl
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("// Generated public aggregates only. Rebuild: scripts/build-strength-data.py\nexport const STRENGTH_REFERENCES = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(json.dumps({"rows": total, "eligibleMeetRows": selected, "uniqueLifters": len(cohorts["absolute"]), "smallestMatchedCohort": min(map(len, cohorts.values())), "outputBytes": args.output.stat().st_size}))

if __name__ == "__main__": main()
