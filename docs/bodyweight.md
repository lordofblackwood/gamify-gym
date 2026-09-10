# Away Strength

A dedicated, installable companion PWA for air squats, push-ups, and glute bridges. The app is maintained in [lordofblackwood/away-strength](https://github.com/lordofblackwood/away-strength) and lives at https://lordofblackwood.github.io/away-strength/. Powerlevel remains the dashboard at /gamify-gym/.

## Workout rules

Each exercise and variation has an independent ladder. The default sequence is 1×10, 2×10, 3×10, 1×12, 2×12, 3×12, continuing through 3×20. After three sets, the reduced set count provides a shorter session at the new rep target; total volume does not rise monotonically. The ladder is an app convention, not a validated training protocol or an estimate of weight lifted.

Comfortable means at least two good reps remained. A comfortable completion can advance one level or deliberately repeat. Hard completions repeat. Stopping early reduces the number of sets; from one set it reduces reps by two if available. At the first level it holds, with instructions to select fewer starting reps or an easier variation next time. Resets never prescribe more total reps. Starting targets can be 2, 4, 6, 8, or 10. The maximum is three sets of twenty.

The app supports daily logging, including rest, while suggesting recovery after the previous day's training. It suggests roughly three nonconsecutive demanding sessions weekly as a starting point. The guidance is informed by [ACSM's 2026 resistance training update](https://acsm.org/resistance-training-guidelines-update-2026/); the exact ladder is custom. Difficulty is chosen by actual performance, with no assumption that bodyweight is a light load.

## Data and integration

- Versioned local state: `away-strength:state:v1`. All actual reps save immediately, including partial sessions. Dates preserve the local calendar day on which a session was logged.
- One record per exercise per day. Completion advances once. Undo restores its previous prescription; earlier entries cannot overwrite later workouts. Adjustments require undoing an existing entry first.
- Backup export includes workouts, variations, and levels without connection credentials. Import validates before replacing data and retains an exportable copy of the previous data.
- A separate connection key avoids accidentally sharing browser pairing state with the dashboard. First pairing checks for different existing bodyweight history before allowing replacement. As with the existing trackers, one installation should write each source.
- Encrypted `bodyweight` snapshots contain the actual rep arrays, outcome, exercise, variation, and date. Program configuration and notes stay local. Uploads retry while the app is open online.
- Powerlevel reads this third source. Any actual positive reps earn one training day, deduplicated across all sources. Rest and entirely skipped work earn none. Bodyweight records never affect the recorded three-lift total. Successful best sessions are grouped by exercise and variation.
- Separate manifest identity, start URL, scope, icons, and service worker. Powerlevel's navigation fallback excludes the bodyweight route. The tracker builds and deploys from its own repository. This repository retains only the dashboard integration and a migration page at the old tracker address.

## Design and verification

The design reference was generated with the built-in Image Generation tool: `exec-ea9473bf-431a-4520-a7e8-9d8b80134245.png`, in the task's generated-images folder. Brief: a complete mobile Away Strength workout screen in Powerlevel navy and lime, three stacked exercise cards, set logging, rest day, and Today/Progress/History/Sync navigation. The concept is a design reference; it is not shipped as a raster interface.

Tokens: background #080c16, panels #0b111c, borders #243044, text #f4f5fc, secondary text #a4b5d5, action #d7fb79. Inter supports content and controls, Barlow Condensed supports headings and prescriptions. Corners are 12 px, mobile gutters 16–21 px, controls at least 44 px. The desktop layout keeps a readable centered workout column.

Browser verification uses the Codex in-app Browser, without a Playwright fallback. Both the concept and browser screenshots were inspected with `view_image`; the layout, copy, type, palette, and controls were verified against the reference. Phone testing used 430×932 CSS px; desktop testing used 1280×900. The reference's 853×1844 raster corresponds approximately to the tested phone aspect ratio rather than a literal 853 CSS px mobile layout.

Comparison ledger:

| Point | Verification and change |
| --- | --- |
| Content | Exact primary heading, subtitle, movement names/order, Log set, Adjust, rest action, and four navigation labels preserved. |
| Layout | Three stacked cards, date row, daily progress, footer advice, and fixed navigation preserved. Reduced excessive initial spacing to fit the phone screen. |
| Typography | Inter body/control type and condensed heading/numeral hierarchy preserved; controls remain readable at phone size. |
| Palette | Navy, fine blue-gray borders, lime primary actions, and muted secondary labels preserved. |
| Components | Rounded cards, large set prescriptions, line icons, and a three-bar brand are code-native. No decorative raster image is required. |
| Responsive behavior | No horizontal document overflow at tested phone and desktop widths. Long history uses normal scrolling. |
| Necessary additional states | Accessible logging/setup/result dialogs, real saved-set indicators, offline/update notices, history, progression, backups, and pairing complete the functional workflow. |

No material product-layout mismatches remained in the verified views. A later Browser viewport override was unreliable during concurrent task testing, so the already-verified phone view and the desktop render supply the visual evidence. No primary-screen copy differences remain beyond date-dependent state and functional status. The date row is informational, so the concept's navigation chevron is not an active date picker. The generated button tint is implemented as a flat accessible lime action. These are intentional functional adjustments, not missing interactions.

Verified behavior: actual reps, comfortable progression, repeat, partial completion, undo restoring a level, saved data surviving reload, rest/resume, variation and lower-rep setup, bodyweight display and filtering in Powerlevel, and installable manifests with project-site paths. The production tracker reloaded and saved a workout after its local HTTP server was stopped, then reloaded with the saved result. Production browser console checks were clear. A development hot-reload warning was fixed by separating the React entry point from the app component.

Automated checks cover the whole ladder and cap, volume-reducing resets, separate exercises and variants, duplicate completions, corrections, dates, backup validation, zero/partial/skipped/rest credit, encryption, transport snapshots, and source isolation. The relay tests verify its new bodyweight path and existing authentication/envelope checks. Actual iPhone Home Screen installation requires the user's phone; the app includes Safari installation and storage instructions.

## Release

Away Strength builds and publishes from its own GitHub repository. Powerlevel keeps the compatible bodyweight parser, scoring integration, and encrypted relay connection. The relay already accepts the bodyweight source.

The previous /gamify-gym/bodyweight/ address serves a migration page with local backup export. Its replacement service worker affects only that previous child scope, leaves workout storage intact, and keeps the migration page available offline. Export from an old installed app before removing it; import in the new app and reconnect with the same dashboard code. Safari visits share the origin’s storage, while iPhone installations may have separate storage.
