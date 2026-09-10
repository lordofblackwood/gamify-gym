// Frozen overall American raw (no wraps) full-power records, September 10, 2026.
// Individual records from different lifters, not a combined meet total or
// bodyweight-class records. Bench-only, equipped and failed attempts are excluded.
export const LIFT_RECORD_LIMITS = Object.freeze({
  version: 1,
  retrieved: "2026-09-10",
  scope: "Overall American raw full-power records",
  records: Object.freeze({
    backSquat: Object.freeze({
      kg: 490.5,
      athlete: "Devonte Lewis",
      date: "2026-06-12",
      federation: "USAPL",
      url: "https://www.openpowerlifting.org/u/devontelewis1",
    }),
    benchPress: Object.freeze({
      kg: 325,
      athlete: "Thomas Davis",
      date: "2021-09-25",
      federation: "WRPF",
      url: "https://www.openpowerlifting.org/u/thomasdavis1",
    }),
    deadlift: Object.freeze({
      kg: 487.5,
      athlete: "Danny Grigsby",
      date: "2022-07-29",
      federation: "WRPF",
      url: "https://www.openpowerlifting.org/u/dannygrigsby",
    }),
  }),
});
