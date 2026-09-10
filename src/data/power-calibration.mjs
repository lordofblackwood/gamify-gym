// User-requested harder September 2026 edition. Frozen; no automatic refresh.
// Source scores use the unchanged absolute comparison model at this meet's lift
// proportions. Reference totals describe this calibration pattern, not every user.
export const POWER_CALIBRATION = Object.freeze({
  version: 4,
  record: Object.freeze({
    athlete: "Jesus Olivares",
    federation: "Powerlifting America",
    category: "Men’s Open · 120+ kg · raw (no wraps)",
    meet: "SBD Austin",
    date: "2025-11-22",
    retrieved: "2026-09-10",
    url: "https://www.openpowerlifting.org/u/jesusolivares",
    recordUrl:
      "https://69-164-197-11.ip.linodeusercontent.com/lifters-view?id=79",
    totalKg: 1153.5,
    liftsKg: {
      backSquat: 478.5,
      benchPress: 265,
      deadlift: 410,
    },
  }),
  anchors: Object.freeze(
    [
      {
        score: 0,
        power: 5,
        referenceTotalLb: 0,
      },
      {
        score: 5.849885742446581,
        power: 10,
        referenceTotalLb: 300,
      },
      {
        score: 14.91551755956104,
        power: 180,
        referenceTotalLb: 450,
      },
      {
        score: 29.76820719007371,
        power: 1500,
        referenceTotalLb: 600,
      },
      {
        score: 39.98705032868482,
        power: 18000,
        referenceTotalLb: 700,
      },
      {
        score: 54.459585294337195,
        power: 90000,
        referenceTotalLb: 850,
      },
      {
        score: 66.70771416496088,
        power: 3000000,
        referenceTotalLb: 1000,
      },
      {
        score: 79.59275727475642,
        power: 150000000,
        referenceTotalLb: 1200,
      },
      {
        score: 93.40442281859862,
        power: 900000000,
        referenceTotalLb: 1500,
      },
      {
        score: 97.71965746047918,
        power: 5000000000,
        referenceTotalLb: 1700,
      },
      {
        score: 99.4316955109523,
        power: 600000000000,
        referenceTotalLb: 1900,
      },
      {
        score: 99.94508982313698,
        power: 30000000000000,
        referenceTotalLb: 2100,
      },
      {
        score: 100.22613338510071,
        power: 400000000000000,
        referenceTotalLb: 2350,
      },
      {
        score: 100.4431351981351,
        power: 4000000000000000,
        referenceTotalLb: 2543.0321942463,
      },
      {
        score: 100.61959435598116,
        power: 10000000000000000,
        referenceTotalLb: 2700,
      },
      {
        score: 100.788220486351,
        power: 1000000000000000000,
        referenceTotalLb: 2850,
      },
      {
        score: 100.90063790659754,
        power: 100000000000000000000,
        referenceTotalLb: 2950,
      },
      {
        score: 101.06926403696741,
        power: 1e22,
        referenceTotalLb: 3100,
      },
    ].map(Object.freeze),
  ),
});
