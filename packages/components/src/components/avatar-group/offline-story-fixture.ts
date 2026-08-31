const portrait = (background: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" fill="${background}"/>
  <circle cx="40" cy="32" r="14" fill="#f8fafc"/>
  <path d="M14 80c2-18 13-26 26-26s24 8 26 26Z" fill="#f8fafc"/>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/** Story-only portraits with intrinsic dimensions and no external request. */
export const offlinePortraits = {
  ada: portrait("#2563eb"),
  grace: portrait("#db2777"),
  alan: portrait("#059669"),
  margaret: portrait("#d97706")
};
