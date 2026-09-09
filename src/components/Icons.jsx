export function Icon({ name, size = 22, ...props }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9" />
      </>
    ),
    forms: (
      <>
        <path d="M12 3c1 5-3 5-1 9 3-1 4-3 4-5 5 5 6 13-3 14C3 20 4 13 7 10c-1 4 3 5 3 2" />
      </>
    ),
    rank: (
      <>
        <path d="m12 2 7 9-7 11-7-11zM5 11h14M12 2v20M2 8l1 9 5 4M22 8l-1 9-5 4" />
      </>
    ),
    history: (
      <>
        <path d="M4 21V11m6 10V6m6 15V2m5 19H1" />
      </>
    ),
    sync: (
      <>
        <path d="M20 7a9 9 0 0 0-15-1L2 9m0-6v6h6M4 17a9 9 0 0 0 15 1l3-3m0 6v-6h-6" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 4v3" />
      </>
    ),
    weight: (
      <>
        <path d="M6 9h12M6 15h12M3 9H1m22 0h-2M3 15H1m22 0h-2" />
        <rect x="3" y="5" width="3" height="14" />
        <rect x="18" y="5" width="3" height="14" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V3H3v13h5" />
      </>
    ),
    close: <path d="m5 5 14 14M5 19 19 5" />,
    link: (
      <>
        <path d="m10 13 4-4m-6 6-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.rank}
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <svg viewBox="0 0 40 40" width="31" height="31" aria-hidden="true">
        <path
          d="m20 1 5 14 14 5-14 5-5 14-5-14L1 20l14-5z"
          fill="currentColor"
        />
      </svg>
      <span>POWERLEVEL</span>
    </span>
  );
}
export function RankEmblem({ color = "#c1a0ff", small = false }) {
  return (
    <svg
      className={small ? "rank-emblem small" : "rank-emblem"}
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      style={{ color }}
    >
      <path d="m90 9 48 71-48 88-48-88z" fill="currentColor" opacity=".12" />
      <path
        d="m90 10 40 66-40 77-40-77z"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path d="m90 20 30 56-30 60-30-60z" fill="currentColor" opacity=".7" />
      <path d="M90 20v116l30-60z" fill="#172039" />
      <path d="m90 20 30 56-30-13-30 13z" fill="currentColor" />
      <path d="m60 76 30 60V63z" fill="currentColor" opacity=".7" />
      <path d="m90 20-30 56h60zM90 20v116" stroke="#eff0ff" strokeWidth="1.4" />
      <path
        d="m14 43 29 27-6 26-10-14zM166 43l-29 27 6 26 10-14z"
        fill="currentColor"
        opacity=".8"
      />
      <path
        d="m19 97 24 11 23 41-26-20zM161 97l-24 11-23 41 26-20z"
        fill="currentColor"
        opacity=".5"
      />
      <path
        d="m14 43 13 39 10 14-4-25zM166 43l-13 39-10 14 4-25z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="m66 151 24 18 24-18-24 27z" fill="currentColor" />
      <path
        d="m42 23 5 7-3 10-5-8zM142 24l-5 7 3 10 5-8z"
        fill="currentColor"
        opacity=".6"
      />
    </svg>
  );
}
