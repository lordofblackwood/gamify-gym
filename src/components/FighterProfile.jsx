import { useEffect, useRef, useState } from "react";
import {
  AURA_COLORS,
  AVATAR_STYLES,
  normalizeProfile,
  profileInitials,
} from "../lib/profile.mjs";
import { Icon } from "./Icons";
import { LB_PER_KG, CATEGORY_RANGES } from "../lib/strength-comparison.mjs";
export function FighterAvatar({ profile, small = false }) {
  return (
    <svg
      className={`fighter-avatar ${small ? "small" : ""}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ color: profile.aura }}
    >
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="#0b111c"
        stroke="#526781"
        strokeWidth="2"
      />
      {profile.avatar === "star" ? (
        <path
          d="m50 2 10 17 20 2-2 20 20 9-20 10 2 20-20-2-10 20-9-20-20 2 2-20L2 50l20-9-2-20 20-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      ) : profile.avatar === "crest" ? (
        <path
          d="M50 3 89 20v35L50 97 11 55V20Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      ) : (
        <>
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="225 70"
            transform="rotate(25 50 50)"
          />
          <circle cx="12" cy="76" r="5" fill="currentColor" />
        </>
      )}
      <text
        x="50"
        y="53"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#f4f5fc"
        fontSize="27"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
      >
        {profileInitials(profile.name)}
      </text>
    </svg>
  );
}
function ProfileEditor({ profile, unit, onSave, onClose }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(profile);
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
  }, []);
  const colors = ["Lime", "Azure", "Gold", "Violet", "Crimson"];
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
          onSave(normalizeProfile({ ...draft, bodyweightKg: enteredKg }));
          onClose();
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
        <FighterAvatar profile={normalizeProfile(draft)} />
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
                  profile={{ ...normalizeProfile(draft), avatar }}
                />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Aura color</legend>
          <div className="aura-options">
            {AURA_COLORS.map((aura, i) => (
              <button
                type="button"
                key={aura}
                aria-label={`${colors[i]} aura`}
                aria-pressed={draft.aura === aura}
                className={draft.aura === aura ? "active" : ""}
                onClick={() => setDraft({ ...draft, aura })}
              >
                <span style={{ background: aura }} />
                {draft.aura === aura ? <Icon name="check" size={16} /> : null}
              </button>
            ))}
          </div>
        </fieldset>
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
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            Save profile
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function FighterProfile({ profile, unit, onSave }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <section
        className="panel fighter-identity"
        aria-label="Your fighter profile"
      >
        <FighterAvatar profile={profile} />
        <div className="fighter-name">
          <h2>{profile.name}</h2>
          <p>Your own character</p>
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
          unit={unit}
          onSave={onSave}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}
