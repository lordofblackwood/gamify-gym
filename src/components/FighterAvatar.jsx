import { useId, useState } from "react";
import { auraForTransformation } from "../data/auras.mjs";
import { AURA_SHAPES, AURA_LIGHTNING } from "../data/aura-shapes.mjs";
import { profileInitials } from "../lib/profile.mjs";
import { photoFrameStyle } from "../lib/profile-photo.mjs";

const LAYER_TRANSFORMS = [
  undefined,
  "translate(6 10) scale(.9 .92)",
  "translate(12 19) scale(.8 .85)",
];

function Emblem({ profile }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="fighter-emblem">
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

export function FighterAvatar({
  profile,
  transformation,
  small = false,
  staticAura = false,
}) {
  const gradient = useId();
  const aura = auraForTransformation(transformation);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const photo = profile.photo?.src !== failedPhoto ? profile.photo : null;
  return (
    <div
      className={`fighter-avatar ${small ? "small" : ""} ${aura.subtle ? "aura-subtle" : ""}`}
      data-aura={aura.id}
      data-transformation={transformation?.id || "base"}
      data-aura-shape={aura.shape}
      data-motion={
        staticAura || profile.auraMotion === "static" ? "static" : "auto"
      }
      role="img"
      aria-label={`${profile.name} · ${transformation?.name || "Base"} aura`}
      style={{
        "--aura-color": aura.color,
        "--aura-core": aura.core,
        "--aura-accent": aura.accent,
        "--aura-width": aura.width,
        "--aura-height": aura.height,
        "--aura-glow": aura.glow,
        "--aura-opacity": aura.opacity,
        "--aura-duration": `${aura.duration}s`,
      }}
    >
      <div className="aura-glow" aria-hidden="true" />
      {!aura.subtle ? (
        <div className="aura-energy" aria-hidden="true">
          <div className="aura-flames" aria-hidden="true">
            <svg viewBox="0 0 120 140" fill="none">
              <defs>
                <linearGradient
                  id={gradient}
                  x1="60"
                  y1="135"
                  x2="60"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--aura-core)" stopOpacity=".08" />
                  <stop
                    offset=".2"
                    stopColor="var(--aura-core)"
                    stopOpacity=".65"
                  />
                  <stop
                    offset=".5"
                    stopColor="var(--aura-color)"
                    stopOpacity=".72"
                  />
                  <stop
                    offset="1"
                    stopColor="var(--aura-accent)"
                    stopOpacity=".06"
                  />
                </linearGradient>
                <linearGradient
                  id={`${gradient}-edge`}
                  x1="60"
                  y1="135"
                  x2="60"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="var(--aura-accent)" stopOpacity=".06" />
                  <stop
                    offset=".4"
                    stopColor="var(--aura-accent)"
                    stopOpacity=".8"
                  />
                  <stop
                    offset="1"
                    stopColor="var(--aura-accent)"
                    stopOpacity=".1"
                  />
                </linearGradient>
              </defs>
              {LAYER_TRANSFORMS.slice(0, aura.layers).map(
                (transform, layer) => (
                  <path
                    key={layer}
                    className="aura-flame-layer"
                    d={AURA_SHAPES[aura.shape]}
                    transform={transform}
                    fill={`url(#${gradient}${layer === 0 && aura.layers > 1 ? "-edge" : ""})`}
                    opacity={
                      layer === aura.layers - 1 ? 1 : 0.48 + layer * 0.15
                    }
                    stroke={
                      layer === 0 ? "var(--aura-accent)" : "var(--aura-core)"
                    }
                    strokeOpacity={layer === 0 ? 0.4 : 0.6}
                    strokeWidth={layer === 0 ? 1 : 1.3}
                  />
                ),
              )}
              <path
                d="M33 115Q13 96 24 71Q19 95 34 102M88 113Q109 95 97 72Q101 94 86 101M38 52Q34 38 40 28M76 51Q85 48 86 38"
                stroke="var(--aura-core)"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity=".72"
              />
            </svg>
          </div>
          <div className="aura-particles" aria-hidden="true">
            {Array.from({ length: aura.particles }, (_, i) => (
              <i key={i} style={{ "--particle": i }} />
            ))}
          </div>
          {aura.lightning !== "none" ? (
            <div className="aura-lightning" aria-hidden="true">
              <svg
                viewBox="0 0 120 140"
                fill="none"
                stroke="var(--aura-accent)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {AURA_LIGHTNING[aura.lightning].map((path, i) => (
                  <path key={i} d={path} />
                ))}
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className={`fighter-portrait ${photo ? "has-photo" : ""}`}>
        {photo ? (
          <img
            src={photo.src}
            alt=""
            decoding="async"
            draggable="false"
            style={photoFrameStyle(photo)}
            onError={() => setFailedPhoto(photo.src)}
          />
        ) : (
          <Emblem profile={profile} />
        )}
      </div>
    </div>
  );
}
