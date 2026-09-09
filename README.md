# Powerlevel

A mobile-first companion PWA for Auto Bulgarian and Accessory Lift Tracker. Hosted on GitHub Pages. Keep logging in the original two iPhone apps; the dashboard receives their encrypted history through a small relay.

## First use on iPhone

1. Open Powerlevel in Safari, Share → Add to Home Screen, then open the installed dashboard.
2. In Sync, create a connection and copy its code.
3. Open your **existing installed** Auto Bulgarian app. Accept its update, scroll to Powerlevel dashboard sync and paste the code. Repeat inside your existing Accessory Lifts app.
4. Continue using those apps normally. Each open tracker syncs changes automatically. The dashboard refreshes on launch, foregrounding and every minute while visible.

There is no recurring export/import workflow. Do not uninstall the existing trackers: their original histories are local to those installations. iOS suspends closed apps; offline changes sync on the next online tracker visit. The dashboard displays source freshness and keeps its last synced records offline. Use one installation of each tracker per connection code.

## Your fighter and the two progression systems

Your profile is your own character: choose a name, emblem and aura color. Dragon Ball fighters are comparison benchmarks, never identities to equip. Profile preferences remain local to this dashboard installation; the encrypted workout history connection is preserved when upgrading.

- **Strength:** best recorded successful squat, bench and deadlift singles summed in pounds. Successful singles count even if backoff work fails. Three lift histories are required; an uncalibrated profile starts at Farmer with a Shotgun, power 5. Display units can change without changing scores.
- **Power ladder:** 233 character/era/form benchmarks, from early Dragon Ball to Super and selected DAIMA milestones. Equal-power entries share a band. Current, previous, next, and nearby comparisons are calculated centrally, not duplicated in UI components.
- **Your transformations:** 30 personal forms, from Base and Crimson Drive to Radiant Ascension, Azure Evolution, Perfected Instinct and Omni Legacy. They advance automatically from the same power estimate and never multiply it a second time. Older character-form selections are retired on upgrade.
- **Unrealized potential:** completed Auto Bulgarian backoff sets of 2–10 reps estimate 1RM with Epley (`weight × (1 + reps / 30)`; [formula reference](https://www.jssm.org/volume22/iss3/cap/jssm-22-436.pdf)). Reps are per set, never total volume. Potential uses the higher of each lift’s best single and e1RM. A positive gap shows a separate unearned transformation/latent-power state; actual power, benchmarks and earned forms still use singles only. All three recorded singles are required to project a potential power level. Failed/incomplete sets, prescriptions, accessories and bodyweight never contribute. Old snapshots still load; update and open Auto Bulgarian online once to send completed rep-set evidence through the existing encrypted connection. Corrections and new proven singles recalculate or close the gap.
- **Continuous progress:** geometric interpolation between the anchors in `src/lib/progression.mjs`. Examples: 600 lb total → 18,000 power; 900 lb → 3,000,000; 1,200 lb → 900,000,000. The bar measures progress through the strength interval to the next benchmark. Each improvement raises power even if the name has not changed. The PR preview is hypothetical and never writes workout data.
- **Evidence:** the centralized `src/data/benchmarks.mjs` dataset includes stable IDs, character, saga/era, form, display name, numeric value, tier, continuity, provenance, description and optional avatar reference. `canonicalPowerLevelKnown` indicates a stated reading or published guide value, with separate labels for those two kinds. All later invented values are marked as app estimates. Relative rankings, especially across anime/manga/DAIMA, are editorial. Zeno is explicitly a symbolic cosmic-authority endpoint, not a measured martial power. Power can keep growing past that final named milestone.
- **Consistency:** average weekly-target adherence over the last 12 completed Monday–Sunday weeks. Each training day counts once across sources; failed attempts count, entirely skipped sessions do not. Credit is capped at the target. Current partial weeks do not lower rank; older weeks with no records receive zero. Iron–Diamond have IV–I divisions and LP, then Master, Grandmaster and Challenger. This ranking remains separate from strength.
- **Accessories:** contribute training days and retain separate best-record listings; different equipment and units are never added to barbell strength.

History corrections, undo and resets recalculate strength and power. Future-dated records are excluded until their date arrives. Demo records are explicitly labeled and never uploaded. This is a fantasy fitness-game scale, not an official Dragon Ball ranking, medical assessment or population strength percentile.

## Privacy and sync

`public/shared/sync.mjs` uses Web Crypto AES-256-GCM with random IVs and source-bound authenticated data. The random connection code remains in device storage. The service receives a derived bearer credential and ciphertext, and stores snapshots under a second hash of that credential. It has no listing endpoint. Source updates are snapshots, not public GitHub commits. Raw training histories and connection codes are never included in the public repository.

The relay runs at `https://powerlevel-sync.micak27.chatgpt.site`. Its source is maintained separately in the private Sites repository. The adapter shared files are copied into both trackers and their offline asset lists. They never change a tracker’s progression logic or storage. Tracker sync is opt-in through the pairing form.

The service is designed for one writer per source. If two installations of the same tracker share a code, the latest upload wins. Keep the connection code: anyone with it can decrypt and replace the associated synced history. Losing a device’s code does not delete its original tracker data.

## Development

Node 22 or newer. `npm install`, `npm run dev`. Run `npm run check` for scoring/encryption tests and a production PWA build. Use `BASE_PATH=gamify-gym npm run build` to verify project-site paths. GitHub Actions tests, builds and publishes pushes to main.

## References

- [Apple: What’s new in web apps](https://developer.apple.com/videos/play/wwdc2023/10120/) explains separate Home Screen app storage.
- [Dragon Ball official transformations](https://en.dragon-ball-official.com/news/01_1328.html) and [SSJ4 DAIMA](https://en.dragon-ball-official.com/news/01_4140.html) informed naming.
- [League ranked tiers](https://support-leagueoflegends.riotgames.com/hc/en-us/articles/4406004330643) informed rank names. The scoring here is independent.

Fan-made personal training dashboard. Not affiliated with Dragon Ball or Riot Games. Profile artwork uses a personal emblem; benchmark labels never change the user’s identity.
