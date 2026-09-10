# Public strength calibration, September 2026

Powerlevel compares completed squat, bench press and deadlift singles with public lifting references. A reference score is translated through a national-record-calibrated game scale. Existing users can move to a different benchmark after this release. Their records and consistency rank do not change.

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
4. Translate that score through `POWER_ANCHORS` in `src/lib/progression.mjs` using geometric interpolation. The harder version 4 anchors are stored with provenance in `src/data/power-calibration.mjs`. Score 0 gives Farmer's 5; the final form requires the reference score of the American raw record performance described below. Score 100 is no longer the summit. Character ordering and fictional power numbers are independent of the public human-lifting evidence. Earned transformations and benchmark bands derive only from this value.

### American record calibration (version 4)

At the user’s request, the game scale was made harder while preserving the September public comparison data. The endgame reference is **Jesus Olivares’ 1,153.5 kg (2,543.03 lb) raw total** at SBD Austin on November 22, 2025: squat 478.5 kg, bench 265 kg, deadlift 410 kg. This is the Powerlifting America men’s Open 120+ kg national raw total record, verified September 10, 2026 against [OpenPowerlifting’s meet results](https://www.openpowerlifting.org/u/jesusolivares) and the indexed [federation record listing](https://69-164-197-11.ip.linodeusercontent.com/lifters-view?id=79). It is a specific raw (no wraps) American record benchmark, not a claim that all federations, equipment divisions, or weight classes share one record.

We use that meet’s three-lift proportions to calibrate the following absolute-mode game milestones:

| Form or benchmark | Calibration total (lb) |
| --- | ---: |
| Kaioken ×20 | 1,000 |
| Super Saiyan | 1,200 |
| Super Saiyan 2 | 1,500 |
| Ultimate | 1,700 |
| Super Saiyan God | 1,900 |
| Blue Kaioken ×10 | 2,100 |
| Mastered Ultra Instinct | 2,350 |
| Black Frieza (final form) | 2,543.03 |
| Zeno (final cosmic benchmark) | 3,100 |

Each stored anchor is reproducible: for calibration total `T` in pounds, assign each lift `recordLiftKg × T / 1153.5` pounds, run the unchanged absolute `compareStrength`, and retain its score. Geometric interpolation then maps these scores to the existing fictional power numbers. The remaining transformations lie between these landmarks; names, order, and fictional readings are unchanged. All nonzero power anchors require higher scores than version 3.

These totals define a calibration pattern, not universal total-only unlocks. The existing source and lift weighting still determines each user’s exact targets. For example, 550/350/650 lb and 600/400/550 lb now both earn Super Saiyan 2. The 315/225/360 lb demo reaches Black Frieza at a rounded balanced 2,507.5 lb, up from 1,357.5 lb. Bodyweight-adjusted mode still uses StrengthLog and nearby competition groups; its targets are **not official weight-class American records**. Cosmic milestones deliberately require performance beyond the reference record. New records do not automatically update the saved calibration.

Below the first known landmark, game points interpolate from zero load/zero points; the UI says “Below P…” rather than inventing a precise lower-tail percentile. Above the last community landmark, game points approach 100 exponentially, using the last observed segment's slope. Above the last competition landmark, game points continue with the last observed slope and can exceed 100. The UI always says “Above P…” in these unobserved tails. These extensions are explicitly game tuning and preserve continuous growth; they are not empirical percentiles. Every published curve in this edition has strictly increasing weight landmarks.

All three actual singles are required to calibrate earned power. Individual available lift comparisons can still be shown before then. Rep-based Epley estimates can project a separate unrealized score using the identical profile and reference curves; they cannot fill a missing actual single or unlock an earned transformation. The PR preview changes only its selected lift in memory and never writes history. Consistency remains independent.

The reference edition is bundled in the PWA. No live calls to data providers, user-history uploads, subscription, or new backend are needed. History refresh still uses the existing encrypted tracker sync. The September 2026 reference data and fictional power anchors are frozen at the user’s request. No automatic reference refresh is permitted. Changing this edition or its power anchors requires a new explicit user request. A regression test fingerprints the public data and the complete version 4 calibration, so an accidental update fails the checks. Version, retrieval date, source hashes and provenance are retained with the data.

## Lift targets instead of visible reference points

The UI translates each future benchmark or transformation into actual single-lift goals. For each alternative, `src/lib/lift-targets.mjs` holds the other two recorded singles fixed, solves the same reference model for the selected lift, and rounds the result **up** to the next 2.5 lb or 1 kg. The displayed total is that target plus the two unchanged bests. All three alternatives reach the same milestone, but their total weights can differ because squat, bench and deadlift have different public distributions.

The model also solves a balanced goal by increasing all three current bests proportionally until the same milestone is reached, then rounding each lift up. If that requires less additional total weight than any one-lift route, the ladder summarizes this balanced goal and the detail view prominently shows all three required singles. Otherwise, the nearest one-lift route is summarized. One-lift alternatives remain accessible for balanced goals. It does not imply that adding any weight to any lift yields that total’s rank. These are game milestones, not prescribed attempts or personalized training advice. Missing actual singles are shown as missing rather than replaced with estimates. Rep-based potential never changes a target. A new successful single or an intentional comparison-profile change recalculates the targets against the frozen edition.

The tests verify every future character and transformation target in pounds and kilograms against absolute, male/bodyweight, and female/bodyweight profiles: each one-lift target reaches its milestone and the preceding increment does not; every rounded balanced set of targets also reaches its milestone. They also check that source records remain unchanged.

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

The script writes only aggregate curves and provenance, about 20 KB. This data-build script does not regenerate the separately frozen game calibration. It never writes lifter names, raw meet entries, or user workout history into the app. It refuses competition groups with fewer than 200 distinct lifters. Do not refresh the frozen reference without a new explicit user request. If requested, review filters, schema, sample sizes, cutoff dates, hashes and the reference version before publishing, and update the reference fingerprint intentionally.
