// Cosmetic only: callers supply the earned progression.transformation.
// No thresholds, character benchmarks, or projected forms belong here.
const preset = (
  id,
  color,
  core,
  { accent = color, lightning = false, subtle = false } = {},
) => Object.freeze({ id, color, core, accent, lightning, subtle });

export const AURA_PRESETS = Object.freeze({
  base: preset("base", "#aab8ce", "#edf3ff", { subtle: true }),
  primal: preset("primal", "#c99545", "#ffe4ae"),
  kaioken: preset("kaioken", "#ff435c", "#ffd4be"),
  gold: preset("gold", "#ffc63d", "#fff6c2"),
  "gold-lightning": preset("gold-lightning", "#ffce45", "#fff9d9", {
    accent: "#bceaff",
    lightning: true,
  }),
  ultimate: preset("ultimate", "#cadbff", "#ffffff"),
  god: preset("god", "#ff3b4e", "#ffd191", { accent: "#ff773d" }),
  blue: preset("blue", "#22bbff", "#ceffff"),
  rose: preset("rose", "#e967b8", "#ffe2f6"),
  "blue-kaioken": preset("blue-kaioken", "#22caff", "#d4ffff", {
    accent: "#ff5067",
  }),
  evolution: preset("evolution", "#4277ff", "#b3eeff", {
    accent: "#89dbff",
    lightning: true,
  }),
  instinct: preset("instinct", "#c7d9fa", "#ffffff", { accent: "#91bdff" }),
  broly: preset("broly", "#91e84b", "#f0ffc7"),
  orange: preset("orange", "#ff962e", "#ffebaa"),
  ego: preset("ego", "#a752ef", "#eed5ff", {
    accent: "#e49bff",
    lightning: true,
  }),
  beast: preset("beast", "#d4c7ff", "#ffffff", {
    accent: "#ed82dc",
    lightning: true,
  }),
  shadow: preset("shadow", "#9482b5", "#ddd5ee", { accent: "#c2a6ed" }),
});

export const TRANSFORMATION_AURAS = Object.freeze({
  base: "base",
  "great-ape": "primal",
  kaioken: "kaioken",
  "kaioken-2": "kaioken",
  "kaioken-3": "kaioken",
  "kaioken-4": "kaioken",
  "kaioken-10": "kaioken",
  "kaioken-20": "kaioken",
  "super-saiyan": "gold",
  "super-saiyan-grade2": "gold",
  "super-saiyan-grade3": "gold",
  "super-saiyan-full-power": "gold",
  "super-saiyan-2": "gold-lightning",
  "super-saiyan-3": "gold-lightning",
  ultimate: "ultimate",
  "super-saiyan-4": "god",
  "super-saiyan-god": "god",
  "super-saiyan-blue": "blue",
  "golden-frieza": "gold",
  "super-saiyan-rose": "rose",
  "blue-kaioken-10": "blue-kaioken",
  "blue-kaioken-20": "blue-kaioken",
  "blue-evolution": "evolution",
  "ultra-instinct-sign": "instinct",
  "mastered-ultra-instinct": "instinct",
  "broly-full-power": "broly",
  "orange-piccolo": "orange",
  "ultra-ego": "ego",
  "true-ultra-instinct": "instinct",
  beast: "beast",
  "black-frieza": "shadow",
});

export function auraForTransformation(transformation) {
  const id = transformation?.id;
  // Missing, future, or retired IDs get a quiet neutral aura, never a guessed rank.
  return Object.hasOwn(TRANSFORMATION_AURAS, id)
    ? AURA_PRESETS[TRANSFORMATION_AURAS[id]]
    : AURA_PRESETS.base;
}
