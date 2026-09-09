# Public strength calibration, September 2026

Powerlevel compares completed squat, bench press and deadlift singles with public lifting references. A reference score replaces the old fixed-pound-total anchors. Existing users can move to a different benchmark after this release. Their records and consistency rank do not change.

## Sources and cohorts

- **Absolute mode — Hardy:** [Strength Progression Report 2026](https://hardy.app/strength-report), [aggregate CSV](https://hardy.app/strength-report-data.csv), published September 3, 2026; observations through September 2. The adapted percentile data are licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), with attribution and links in the app. Best estimated 1RM per qualifying lifter, using at least three sessions per exercise. Squat n=5,931, bench n=6,500, deadlift n=5,247. Published P10/P25/P50/P75/P90/P99; no sex, age or bodyweight information. This is a self-selected workout-app sample.
- **Bodyweight/category mode — StrengthLog:** public [squat](https://www.strengthlog.com/squat-strength-standards-kg/), [bench](https://www.strengthlog.com/bench-press-strength-standards-kg/), and [deadlift](https://www.strengthlog.com/deadlift-strength-standards-kg/) factual benchmark tables, retrieved September 9, 2026. P5/P25/P50/P75/P95 by male/female category and bodyweight. Category-wide sample sizes: squat 15,314/6,760; bench 17,296/7,112; deadlift 15,107/6,570 (M/F). Those counts are not bodyweight-cell sample sizes. The public tables have no age dimension or disclosed observation cutoff. These are public standards, not an openly licensed raw dataset. Their numeric facts are attributed; article prose and individual workout records are not reproduced.
- **Both modes — OpenPowerlifting:** [bulk CSV](https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html), [public-domain license](https://openpowerlifting.gitlab.io/opl-csv/). Archive CSV `openpowerlifting-2026-09-05-b8b9bf6e.csv`: 4,030,219 data rows (the site count includes the header). We select January 1, 2010–September 4, 2026; Equipment=Raw, Event=SBD, Tested=Yes, known Age>=18, positive bodyweight and all three best lifts and TotalKg, excluding DQ/DD/NS. This leaves 677,847 meet rows and 242,453 distinct Name+Sex identifiers. OPL disambiguates same-name athletes with # suffixes; its identifiers can still contain corrections/errors.

OpenPowerlifting absolute curves include all recorded sex categories and bodyweights. Each identifier contributes its best qualifying squat, bench and deadlift individually across the selected period, not one observation per meet. They need not come from the same meet, just as the user's all-time PRs need not share a date. Matched curves repeat this best-per-lifter calculation inside male/female bodyweight windows of ±10% around 5 kg centers. The smallest included window contains 648 lifters. Windows overlap and are never summed as independent people. Missing ages are excluded rather than assumed adult. Tested denotes a division, not proof every athlete was individually tested. Gym singles are not competition-judged lifts.

StrengthLog tables and OPL centers cover M 50–140 kg and F 40–120 kg. Linear interpolation between adjacent bodyweight rows avoids step changes. Outside these limits or with missing settings, an explicit absolute comparison is used. No extrapolated bodyweight tables, inferred sex, or age adjustment. Current comparison bodyweight applies to historical bests; it is not bodyweight at the time of each PR. Changing settings intentionally recalibrates power.

[Strength Level](https://strengthlevel.com/strength-standards) is another useful public reference, but its submitted-lift model has different percentiles and users. It is linked for context, not silently added as independent observations. None of these samples estimates the lifting distribution of the entire adult population. Overlap between sources is unknown.

## Scoring

1. Convert each completed single from its canonical pounds to kg. Accessory records and estimated 1RM do not feed earned power.
2. Interpolate that lift within each source's published quantile landmarks. OPL quantiles use linear interpolation at `(n - 1) × p / 100`, at P1/5/10/25/50/75/90/95/97.5/99/99.5/99.9. Display values as approximate source-specific percentiles, never as an exact ranking of all people.
3. Average community and competition reference points equally for each lift, then average the three lifts equally. This is a **game reference score**, not a pooled percentile or a meet-total percentile. Equal source weighting is a deliberate design choice, not a statistically representative population mixture.
4. Translate that score through `POWER_ANCHORS` in `src/lib/progression.mjs` using geometric interpolation. Score 0 gives Farmer's 5; 30 gives 3 million; 50 gives 900 million; 80 gives 30 trillion; 100 gives the symbolic Zeno milestone. Character ordering and fictional power numbers are independent of the public human-lifting evidence. Earned transformations and benchmark bands derive only from this value.

Below the first known landmark, game points interpolate from zero load/zero points; the UI says “Below P…” rather than inventing a precise lower-tail percentile. Above the last community landmark, game points approach 100 exponentially, using the last observed segment's slope. Above the last competition landmark, game points continue with the last observed slope and can exceed 100. The UI always says “Above P…” in these unobserved tails. These extensions are explicitly game tuning and preserve continuous growth; they are not empirical percentiles. Every published curve in this edition has strictly increasing weight landmarks.

All three actual singles are required to calibrate earned power. Individual available lift comparisons can still be shown before then. Rep-based Epley estimates can project a separate unrealized score using the identical profile and reference curves; they cannot fill a missing actual single or unlock an earned transformation. The PR preview changes only its selected lift in memory and never writes history. Consistency remains independent.

The reference edition is bundled in the PWA. No live calls to data providers, user-history uploads, subscription, or new backend are needed. History refresh still uses the existing encrypted tracker sync. Future reference editions may change scores; version, retrieval date, source hashes and provenance are retained with the data.

## Reproduce the aggregate bundle

Download these public inputs into a temporary directory, outside the repository:

| File name | URL |
| --- | --- |
| `openpowerlifting-public.zip` | https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip |
| `hardy-strength-report-data.csv` | https://hardy.app/strength-report-data.csv |
| `strengthlog-squat.html` | https://www.strengthlog.com/squat-strength-standards-kg/ |
| `strengthlog-bench-press.html` | https://www.strengthlog.com/bench-press-strength-standards-kg/ |
| `strengthlog-deadlift.html` | https://www.strengthlog.com/deadlift-strength-standards-kg/ |

Use the source snapshots matching the SHA-256 hashes in `src/data/strength-references.mjs` for exact reproduction. The URLs can change content. Python 3.11+ and its standard library are sufficient:

```sh
python3 scripts/build-strength-data.py --inputs /path/to/public-inputs
npm test
```

The script writes only aggregate curves and provenance, about 20 KB. It never writes lifter names, raw meet entries, or user workout history into the app. It refuses competition groups with fewer than 200 distinct lifters. A source refresh requires deliberate review of filters, schema, sample sizes, cutoff dates, hashes and the reference version before publishing.
