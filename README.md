# Powerlevel

A mobile-first companion PWA for Auto Bulgarian and Accessory Lift Tracker. Hosted on GitHub Pages. Keep logging in the original two iPhone apps; the dashboard receives their encrypted history through a small relay.

## First use on iPhone

1. Open Powerlevel in Safari, Share → Add to Home Screen, then open the installed dashboard.
2. In Sync, create a connection and copy its code.
3. Open your **existing installed** Auto Bulgarian app. Accept its update, scroll to Powerlevel dashboard sync and paste the code. Repeat inside your existing Accessory Lifts app.
4. Continue using those apps normally. Each open tracker syncs changes automatically. The dashboard refreshes on launch, foregrounding and every minute while visible.

There is no recurring export/import workflow. Do not uninstall the existing trackers: their original histories are local to those installations. iOS suspends closed apps; offline changes sync on the next online tracker visit. The dashboard displays source freshness and keeps its last synced records offline. Use one installation of each tracker per connection code.

## The two systems

- **Strength:** best recorded successful squat, bench and deadlift singles, summed in pounds. A successful single still counts if backoff work failed. Three recorded lift histories are required; starting prescriptions and state PR summaries do not substitute for history. Display can be switched to kg.
- **Transformations:** 65 collectible forms, techniques and fusions across the main Saiyan path and alternate collections. Main path includes SSJ 1, 2, 3, God, Blue, Blue Kaioken, Blue Evolution and Ultra Instinct. All thresholds are original fitness-game milestones, not official Dragon Ball rankings or strength standards. Alternate forms can be equipped once earned.
- **Consistency:** average weekly-target adherence over the last 12 completed Monday–Sunday weeks. Each training day counts once across both sources; failed attempts count, entirely skipped sessions do not. Weekly credit is capped at the chosen target. Current partial weeks do not lower rank. Older weeks with no records receive zero credit. Changing the target recalculates the score. Iron–Diamond have IV–I divisions and LP; Master, Grandmaster and Challenger use the displayed thresholds. There is no competitive leaderboard.
- **Accessories:** contribute training days and have separate best-record listings; different equipment and units are never added to the barbell total.

The dashboard replaces each source snapshot on sync so source corrections, undo and resets remain authoritative. Future-dated events are excluded until their date arrives. Demo mode is explicitly labeled and never uploads illustrative records.

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

Fan-made personal training dashboard. Not affiliated with Dragon Ball or Riot Games. Generated artwork is decorative; equipped form labels and colors communicate the earned form.
