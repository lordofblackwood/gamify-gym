# Powerlevel visual specification

Primary reference: generated mobile concept `exec-78036e27-c8ad-48f8-82d7-1793b4c05a0a.png`; secondary desktop reference `exec-e13fe4f7-ff75-434f-848f-4a852c7cc494.png`. Concepts remain outside the production bundle.

Mobile first: 20px gutters, 430px reference, stacked strength and horizontal rank panels, 12-column by 7-row heatmap, three compact lift records, five fixed bottom navigation destinations: Home, Forms, Rank, History, Sync. Desktop uses a 216px sidebar and a two-column strength/rank area. No embedded workout trackers.

Tokens: background #080c16, panel #0b111c, border #243044, text #f4f5fc, muted #a4b5d5, lime #d7fb79, gold #f8d375, violet #c1a0ff. Corners 12px. Inter body 14–16px; Barlow Condensed bold for display headings and records. At least 44px touch controls. Respect reduced motion and safe-area insets.

Components: shell/navigation, strength banner, faceted rank emblem, progress meter, heatmap, lift record strip, dated activity list, form collection and ranking ladder, connection panels. Icons use consistent 24px outlines, 1.7px stroke. Generated anime artwork occupies the right half of strength banner, blended at left edge only; no color wash. Emblem is a functional code-native vector rank indicator.

Copy: Every rep has a story. / Two paths. One stronger you. / Strength / Best three-lift total / Consistency / Training rhythm / Your strongest lifts. Demo preview must be explicit. Actual records replace invented illustration metrics. Singles are recorded, not estimated. Game thresholds are custom fitness milestones, not an official Dragon Ball power order or competitive League ranking.

Necessary extensions to concept: empty/unpaired and offline states, sync freshness, pairing form, source connection status, program explanations and selectable forms. Static concepts cannot represent the user's phone data; production opens unranked unless connected data exists. Avoid attributing illustrative records to the user.

## Personal fighter progression redesign

The active reference for the redesigned profile is `exec-c8f7587e-d754-4164-841b-cbc98f542ffa.png`. Keep the existing navy, lime, gold and violet palette, Inter and Barlow Condensed type, 20px phone gutters, 12px panels and fixed bottom navigation. A circular, customizable monogram replaces the existing-character portrait. The profile name remains independent of every benchmark and transformation.

Primary order: Your power. Your story. → editable identity → estimated power and personal transformation → current benchmark and continuous progress → previous/current/next comparison rows → source strength total → consistency → training rhythm and records. Journey contains the complete searchable ladder, personal transformations and a PR preview, using these same rows, borders and type scales. These additions are necessary for the requested comparison workflow.

Intentional reference corrections: omit the image generator's invented tagline and discipline slogan; preserve the real 12-week daily heatmap instead of its incorrect month labels. Add an explicit demo banner only in demo mode. Progress bars and numbers always follow data. Personal transformation names are inspired by Dragon Ball, without assigning the user's identity to any existing character. There is no character-art image in the redesigned profile. Mobile rows stack where required to retain 44px targets and legible numbers.

The implementation keeps the reference's identity row, large gold number, separate personal-form badge, three comparison rows, navy surfaces and lime navigation. The phone layout stacks the number and transformation at 430px so long form names remain readable. The complete ladder uses textual character/era labels rather than unrelated character portraits; details expose numeric provenance and explicitly mark symbolic cosmic benchmarks. Progress is measured through the underlying strength-score interval, using geometric interpolation to translate score into power.

### Redesign verification

The in-app Browser verified the production build at 360 × 800, 430 × 932 and 1536 × 1024. The 1024 × 1536 raster concept is interpreted as a phone composition at a readable CSS width, rather than forcing a phone layout onto a 1024px desktop viewport. `view_image` directly compared the concept with the latest viewport screenshots; the browser's full-page stitching produced duplicate fragments, so fidelity judgments use viewport captures.

| Comparison | Evidence and outcome |
| --- | --- |
| Identity and imagery | Personal orbital monogram, independent name and Edit profile control replace the character portrait. Name, emblem and aura save and survive reload. |
| Hierarchy and copy | White/lime title, identity, gold power, personal transformation, benchmark and three comparisons remain in the reference order. The copy audit found only the intentional corrections documented above and data-dependent demo/target labels. |
| Typography | Condensed display type for power and benchmarks; Inter for controls and explanations. Long names and the full Zeno value remain readable at 360px. |
| Palette and containers | Navy canvas, restrained bordered panels, gold power and lime progress/navigation match the reference. Existing consistency emblem and outline icon family are retained. |
| Responsive layout | No horizontal overflow at either phone width or desktop. Power and form stack on phones, while the independent consistency panel moves beside the power panel on desktop. Touch controls remain usable. |
| Interactions and evidence | Search, benchmark details, personal forms, profile editing, PR preview, history navigation and unit changes passed. Canon readings, guide values, app estimates and symbolic authority are distinguished. |

The PR preview demonstrated 900 → 905 lb raising power from 3,000,000 to 3,417,855 without changing the Goku benchmark, while advancing 45% toward the next band. A 25 lb increase crosses that band. Kilogram display leaves both progression systems unchanged. All 36 progression/scoring/encryption tests and the Pages-path production build pass; the production Browser console is clean. The implementation was faithfully checked against the active reference with the documented functional/mobile adaptations; no material visual mismatch remains. Physical iPhone installation was not available in this desktop check.
