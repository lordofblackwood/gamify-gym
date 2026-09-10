import { useId, useState } from "react";
import { auraForTransformation } from "../data/auras.mjs";
import { profileInitials } from "../lib/profile.mjs";
import { photoFrameStyle } from "../lib/profile-photo.mjs";

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
      data-motion={
        staticAura || profile.auraMotion === "static" ? "static" : "auto"
      }
      role="img"
      aria-label={`${profile.name} · ${transformation?.name || "Base"} aura`}
      style={{
        "--aura-color": aura.color,
        "--aura-core": aura.core,
        "--aura-accent": aura.accent,
      }}
    >
      <div className="aura-glow" aria-hidden="true" />
      {!aura.subtle ? (
        <>
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
              </defs>
              <path
                d="M60 132C25 135 9 111 12 91L4 69Q20 80 15 57L18 32Q24 59 32 60Q26 33 39 14Q37 44 47 48Q47 20 62 3Q56 31 71 47Q85 36 81 20Q100 44 88 66Q104 59 104 42Q114 62 104 85L117 76Q115 114 89 125Q73 135 60 132Z"
                fill={`url(#${gradient})`}
                stroke="var(--aura-color)"
                strokeOpacity=".32"
                strokeWidth="1"
              />
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
            {[0, 1, 2, 3].map((i) => (
              <i key={i} style={{ "--particle": i }} />
            ))}
          </div>
          {aura.lightning ? (
            <div className="aura-lightning" aria-hidden="true">
              <svg
                viewBox="0 0 120 140"
                fill="none"
                stroke="var(--aura-accent)"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 42-7 22 9-3-8 22 10 12M98 47l8 18-10 5 11 21-10 17" />
              </svg>
            </div>
          ) : null}
        </>
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
