import { useEffect, useRef, useState } from "react";
import { AVATAR_STYLES, normalizeProfile } from "../lib/profile.mjs";
import { FighterAvatar } from "./FighterAvatar";
import { readProfilePhoto } from "../lib/profile-photo.mjs";
import { Icon } from "./Icons";
import { LB_PER_KG, CATEGORY_RANGES } from "../lib/strength-comparison.mjs";
function ProfileEditor({ profile, transformation, unit, onSave, onClose }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(profile);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const uploadVersion = useRef(0);
  async function uploadPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const version = ++uploadVersion.current;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const photo = await readProfilePhoto(file);
      if (version === uploadVersion.current)
        setDraft((previous) => ({ ...previous, photo }));
    } catch (error) {
      if (version === uploadVersion.current) setPhotoError(error.message);
    } finally {
      if (version === uploadVersion.current) setPhotoBusy(false);
    }
  }
  function cropPhoto(key, value) {
    setDraft((previous) => ({
      ...previous,
      photo: {
        ...previous.photo,
        crop: { ...previous.photo.crop, [key]: Number(value) },
      },
    }));
  }
  const factor = unit === "kg" ? 1 : LB_PER_KG;
  const [bodyweight, setBodyweight] = useState(
    profile.bodyweightKg
      ? String(Number((profile.bodyweightKg * factor).toFixed(2)))
      : "",
  );
  const [weightChanged, setWeightChanged] = useState(false);
  const range = CATEGORY_RANGES[draft.referenceCategory];
  const enteredKg = weightChanged
    ? bodyweight === ""
      ? null
      : Number(bodyweight) / factor
    : profile.bodyweightKg;
  const canMatch =
    range &&
    enteredKg !== null &&
    enteredKg >= range[0] &&
    enteredKg <= range[1];
  useEffect(() => {
    dialog.current?.showModal();
    return () => {
      uploadVersion.current++;
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal panel profile-editor"
      aria-labelledby="profile-title"
      onCancel={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (photoBusy) return;
          const saved = onSave(
            normalizeProfile({ ...draft, bodyweightKg: enteredKg }),
          );
          if (saved === false) {
            setSaveError(
              "Your profile could not be saved. Free some device storage or choose a smaller photo and try again.",
            );
          } else onClose();
        }}
      >
        <div className="section-heading">
          <h2 id="profile-title">YOUR FIGHTER</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close profile editor"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="profile-photo-preview">
          <FighterAvatar profile={draft} transformation={transformation} />
          <p className="small muted" aria-live="polite">
            {transformation?.name || "Base"} · Earned aura
          </p>
        </div>
        <fieldset className="photo-settings">
          <legend>Profile photo</legend>
          <input
            id="fighter-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadPhoto}
            disabled={photoBusy}
            aria-label="Upload profile photo"
            aria-describedby="photo-help"
          />
          <p id="photo-help" className="small muted">
            JPG, PNG or WebP · up to 2 MB. Your photo stays on this device.
          </p>
          {photoError ? (
            <p role="alert" className="profile-save-error">
              {photoError}
            </p>
          ) : null}
          {photoBusy ? (
            <p role="status" className="small">
              Opening photo…
            </p>
          ) : null}
          {draft.photo ? (
            <>
              <label htmlFor="photo-zoom">Zoom</label>
              <input
                id="photo-zoom"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={draft.photo.crop.zoom}
                onChange={(e) => cropPhoto("zoom", e.target.value)}
              />
              <label htmlFor="photo-x">Horizontal position</label>
              <input
                id="photo-x"
                type="range"
                min="0"
                max="100"
                value={draft.photo.crop.x}
                onChange={(e) => cropPhoto("x", e.target.value)}
              />
              <label htmlFor="photo-y">Vertical position</label>
              <input
                id="photo-y"
                type="range"
                min="0"
                max="100"
                value={draft.photo.crop.y}
                onChange={(e) => cropPhoto("y", e.target.value)}
              />
              <div className="button-row">
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      photo: {
                        ...previous.photo,
                        crop: { x: 50, y: 50, zoom: 1 },
                      },
                    }))
                  }
                >
                  Reset crop
                </button>
                <button
                  type="button"
                  className="text-button"
                  disabled={photoBusy}
                  onClick={() =>
                    setDraft((previous) => ({ ...previous, photo: null }))
                  }
                >
                  Remove photo
                </button>
              </div>
            </>
          ) : null}
        </fieldset>
        <label className="aura-motion-control">
          <input
            type="checkbox"
            checked={draft.auraMotion !== "static"}
            onChange={(e) =>
              setDraft({
                ...draft,
                auraMotion: e.target.checked ? "auto" : "static",
              })
            }
          />
          Animate aura
        </label>
        <p className="small muted">
          Your aura follows your earned transformation. Reduced motion uses a
          still aura.
        </p>
        <label htmlFor="fighter-name">Fighter name</label>
        <input
          id="fighter-name"
          autoFocus
          maxLength={32}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          required
          autoComplete="nickname"
        />
        {!draft.photo ? (
          <fieldset>
            <legend>Your emblem</legend>
            <div className="avatar-options">
              {AVATAR_STYLES.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  aria-label={`${avatar} emblem`}
                  aria-pressed={draft.avatar === avatar}
                  className={draft.avatar === avatar ? "active" : ""}
                  onClick={() => setDraft({ ...draft, avatar })}
                >
                  <FighterAvatar
                    small
                    staticAura
                    transformation={transformation}
                    profile={{ ...draft, avatar }}
                  />
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}
        <fieldset className="comparison-settings">
          <legend>Strength comparison</legend>
          <label htmlFor="comparison-mode">Compare my lifts by</label>
          <select
            id="comparison-mode"
            value={draft.comparisonMode}
            onChange={(e) =>
              setDraft({ ...draft, comparisonMode: e.target.value })
            }
          >
            <option value="absolute">Absolute strength · all categories</option>
            <option value="relative">Bodyweight and category</option>
          </select>
          {draft.comparisonMode === "relative" ? (
            <>
              <label htmlFor="reference-category">
                Published reference category
              </label>
              <select
                id="reference-category"
                value={draft.referenceCategory}
                onChange={(e) =>
                  setDraft({ ...draft, referenceCategory: e.target.value })
                }
              >
                <option value="">Choose a reference</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
              <label htmlFor="fighter-bodyweight">
                Comparison bodyweight ({unit})
              </label>
              <input
                id="fighter-bodyweight"
                type="number"
                inputMode="decimal"
                step="any"
                min={20 * factor}
                max={400 * factor}
                value={bodyweight}
                onChange={(e) => {
                  setBodyweight(e.target.value);
                  setWeightChanged(true);
                }}
              />
              <p className="small muted">
                Uses your current comparison weight for all historical bests.
                The published tables support male references at 50–140 kg and
                female references at 40–120 kg.
              </p>
              {!canMatch ? (
                <p className="small comparison-fallback" role="status">
                  Absolute comparison will be used until a supported category
                  and bodyweight are saved.
                </p>
              ) : null}
            </>
          ) : (
            <p className="small muted">
              Compares the weight you lifted with all categories combined. No
              bodyweight or category is needed.
            </p>
          )}
          <p className="small muted">
            Changing these settings recalibrates your power. They stay on this
            device and are never sent to the benchmark providers.
          </p>
        </fieldset>
        <p className="small muted">
          Your identity stays yours at every power level. Saved on this device.
        </p>
        {saveError ? (
          <p role="alert" className="profile-save-error">
            {saveError}
          </p>
        ) : null}
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={photoBusy}>
            Save profile
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function FighterProfile({ profile, transformation, unit, onSave }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <section
        className="panel fighter-identity"
        aria-label="Your fighter profile"
      >
        <FighterAvatar profile={profile} transformation={transformation} />
        <div className="fighter-name">
          <h2>{profile.name}</h2>
          <p aria-live="polite">
            {transformation?.name || "Base"} · Earned aura
          </p>
        </div>
        <button
          className="secondary-button profile-edit"
          onClick={() => setEditing(true)}
        >
          Edit profile
        </button>
      </section>
      {editing ? (
        <ProfileEditor
          profile={profile}
          transformation={transformation}
          unit={unit}
          onSave={onSave}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
