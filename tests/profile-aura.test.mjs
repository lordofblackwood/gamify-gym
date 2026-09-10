import test from "node:test";
import assert from "node:assert/strict";
import { TRANSFORMATIONS } from "../src/data/transformations.mjs";
import {
  AURA_PRESETS,
  TRANSFORMATION_AURAS,
  auraForTransformation,
} from "../src/data/auras.mjs";
import {
  progressionFromScore,
  scoreForPower,
} from "../src/lib/progression.mjs";
import {
  normalizePhoto,
  photoFrameStyle,
  readProfilePhoto,
  MAX_PHOTO_BYTES,
} from "../src/lib/profile-photo.mjs";
import { normalizeProfile } from "../src/lib/profile.mjs";
import { dashboard } from "../src/lib/scoring.mjs";
import { demoSnapshots } from "../src/lib/demo.mjs";

const photo = {
  src: "data:image/png;base64,aGVsbG8=",
  width: 800,
  height: 600,
};

test("every existing transformation has an explicit valid cosmetic preset", () => {
  assert.deepEqual(
    Object.keys(TRANSFORMATION_AURAS).sort(),
    TRANSFORMATIONS.map((f) => f.id).sort(),
  );
  for (const form of TRANSFORMATIONS)
    assert.equal(
      auraForTransformation(form),
      AURA_PRESETS[TRANSFORMATION_AURAS[form.id]],
    );
  for (const form of [null, {}, { id: "new-form" }, { id: "toString" }])
    assert.equal(auraForTransformation(form), AURA_PRESETS.base);
});

test("aura changes at earned transformation boundaries, independently of benchmarks", () => {
  const before = progressionFromScore(scoreForPower(900000000) - 0.001);
  const after = progressionFromScore(scoreForPower(900000000));
  assert.equal(auraForTransformation(before.transformation).id, "gold");
  assert.equal(
    auraForTransformation(after.transformation).id,
    "gold-lightning",
  );
  const separated = progressionFromScore(scoreForPower(3000000));
  assert.equal(separated.current.id, "goku-namek-recovered");
  assert.equal(auraForTransformation(separated.transformation).id, "kaioken");
  const tied = progressionFromScore(scoreForPower(160000000000000));
  assert.equal(tied.transformation.id, "blue-evolution");
  assert.equal(auraForTransformation(tied.transformation).id, "evolution");
});

test("photo and motion round-trip without keeping a manually selected aura", () => {
  const profile = normalizeProfile({
    name: "Test fighter",
    aura: "#ff828b",
    photo,
    auraMotion: "static",
  });
  assert.equal(profile.photo.src, photo.src);
  assert.equal(profile.aura, undefined);
  assert.deepEqual(
    normalizeProfile(JSON.parse(JSON.stringify(profile))),
    profile,
  );
  assert.equal(normalizeProfile({}).photo, null);
});

test("crop is reversible geometry and never changes source bytes", () => {
  const normalized = normalizePhoto(photo);
  assert.equal(normalized.src, photo.src);
  const style = photoFrameStyle(normalized);
  assert.equal(style.height, "100%");
  assert.ok(parseFloat(style.width) > 100);
  assert.equal(style.top, "0%");
  const cropped = normalizePhoto({
    ...photo,
    crop: { x: -1, y: 101, zoom: 20 },
  });
  assert.deepEqual(cropped.crop, { x: 0, y: 100, zoom: 3 });
  const square = photoFrameStyle(
    normalizePhoto({ ...photo, width: 600, crop: { x: 100, y: 100, zoom: 2 } }),
  );
  assert.deepEqual(square, {
    width: "200%",
    height: "200%",
    left: "-100%",
    top: "-100%",
  });
});

test("stored photos cannot fetch remote URLs and malformed images are rejected", async () => {
  for (const src of [
    "https://example.com/photo.png",
    "javascript:alert(1)",
    "data:image/svg+xml;base64,aGVsbG8=",
    "data:image/png;base64,invalid!",
    "x".repeat(MAX_PHOTO_BYTES * 2),
  ])
    assert.equal(normalizePhoto({ ...photo, src }), null);
  assert.equal(normalizePhoto({ ...photo, width: 0 }), null);
  assert.equal(normalizePhoto({ ...photo, width: 1000000 }), null);
  await assert.rejects(
    readProfilePhoto({ type: "image/gif", size: 10 }),
    /JPG, PNG, or WebP/,
  );
  await assert.rejects(
    readProfilePhoto({ type: "image/jpeg", size: MAX_PHOTO_BYTES + 1 }),
    /smaller than 2 MB/,
  );
});

test("cosmetic profile updates leave scores, records, earned unlocks and potential unchanged", () => {
  const today = "2026-09-10";
  const snapshots = demoSnapshots(today);
  const before = dashboard(snapshots, today, 4, normalizeProfile());
  const after = dashboard(
    snapshots,
    today,
    4,
    normalizeProfile({
      name: "Photo fighter",
      photo,
      auraMotion: "static",
      avatar: "crest",
    }),
  );
  const { comparisonProfile: beforeProfile, ...beforeStrength } =
    before.strength;
  const { comparisonProfile: afterProfile, ...afterStrength } = after.strength;
  assert.deepEqual(afterStrength, beforeStrength);
  assert.deepEqual({ ...after, strength: null }, { ...before, strength: null });
});
