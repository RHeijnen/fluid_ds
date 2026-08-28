const landscape = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
  <rect width="800" height="300" fill="#dbeafe"/>
  <circle cx="650" cy="72" r="42" fill="#fbbf24"/>
  <path d="m0 238 180-142 145 112 128-96 203 126Z" fill="#64748b"/>
  <path d="m0 254 198-112 116 88 139-76 203 100Z" fill="#94a3b8"/>
  <path d="M0 236c146-28 225 46 356 18s244-34 444 2v44H0Z" fill="#38bdf8"/>
</svg>`;

/** Story-only image with intrinsic dimensions and no external request. */
export const offlineLandscapeImage = `data:image/svg+xml,${encodeURIComponent(landscape)}`;
