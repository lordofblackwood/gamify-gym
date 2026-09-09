export const AURA_COLORS = [
  "#d7fb79",
  "#7cd9ff",
  "#f8d375",
  "#c1a0ff",
  "#ff828b",
];
export const AVATAR_STYLES = ["orbit", "star", "crest"];
export function normalizeProfile(raw = {}) {
  const name =
    typeof raw?.name === "string"
      ? raw.name
          .replace(/[\u0000-\u001f\u007f]/g, "")
          .trim()
          .slice(0, 32)
      : "";
  return {
    name: name || "Your fighter",
    aura: AURA_COLORS.includes(raw?.aura) ? raw.aura : AURA_COLORS[0],
    avatar: AVATAR_STYLES.includes(raw?.avatar) ? raw.avatar : "orbit",
    comparisonMode:
      raw?.comparisonMode === "relative" ? "relative" : "absolute",
    referenceCategory: ["M", "F"].includes(raw?.referenceCategory)
      ? raw.referenceCategory
      : "",
    bodyweightKg:
      Number.isFinite(raw?.bodyweightKg) &&
      raw.bodyweightKg >= 20 &&
      raw.bodyweightKg <= 400
        ? raw.bodyweightKg
        : null,
  };
}
export function profileInitials(name) {
  return (
    [
      ...String(name)
        .trim()
        .split(/\s+/)
        .map((part) => [...part][0] || "")
        .join(""),
    ]
      .slice(0, 2)
      .join("")
      .toLocaleUpperCase() || "YF"
  );
}
