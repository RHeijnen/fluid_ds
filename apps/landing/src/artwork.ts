/*
 * The closing-band gradient artwork. An original, dependency-free SVG in the
 * style of the layered silk-wave art the owner picked as reference, inlined
 * as a data URI so the landing page ships no external image request.
 */
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="haze" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#eee2f6"/>
      <stop offset="0.6" stop-color="#e0cbf0"/>
      <stop offset="1" stop-color="#d2b3e9"/>
    </linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c98fe5"/>
      <stop offset="0.55" stop-color="#ae64d9"/>
      <stop offset="1" stop-color="#9243ca"/>
    </linearGradient>
    <linearGradient id="cyan" x1="0.15" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="#7fe6f9"/>
      <stop offset="0.45" stop-color="#33c3ed"/>
      <stop offset="1" stop-color="#0b93c8"/>
    </linearGradient>
    <linearGradient id="violet" x1="0.25" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#bb63ec"/>
      <stop offset="0.5" stop-color="#8d28d8"/>
      <stop offset="1" stop-color="#5a0cad"/>
    </linearGradient>
    <linearGradient id="indigo" x1="0.2" y1="0" x2="0.75" y2="1">
      <stop offset="0" stop-color="#2e1fb4"/>
      <stop offset="1" stop-color="#150a6e"/>
    </linearGradient>
    <filter id="soft6" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
    <filter id="soft24" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="24"/>
    </filter>
  </defs>

  <!-- Lavender haze sky -->
  <rect width="1600" height="900" fill="url(#haze)"/>

  <!-- Magenta hill face: one smooth diagonal rising to the right edge -->
  <path d="M-100 520C400 440 900 330 1650 245V950H-100Z" fill="url(#hill)" filter="url(#soft6)"/>

  <!-- Rosy warmth around the horizon -->
  <path d="M500 260c340-40 700-40 1100 10v160C1220 360 840 340 500 380Z" fill="#ecc0dd" opacity="0.5" filter="url(#soft24)"/>

  <!-- Peach band above the cyan crest at the left edge -->
  <path d="M0 360c180-26 340-10 470 50v50C330 424 160 424 0 458Z" fill="#f3bd8b" opacity="0.7" filter="url(#soft24)"/>
  <path d="M0 330c150-20 280-8 400 28v30C270 368 130 368 0 396Z" fill="#f8e6cb" opacity="0.6" filter="url(#soft24)"/>

  <!-- Violet silk wave: valley in the middle, dominant face rising right -->
  <path d="M360 505c180-65 360-45 500 55 80 57 170 80 270 70 160-15 310-130 470-300v570H560c-90-140-160-260-200-395Z" fill="url(#violet)"/>
  <path d="M372 510c170-56 340-38 476 60 36 26 76 46 118 58-54-6-104-26-150-62-136-104-292-118-444-56Z" fill="#dca7f6" opacity="0.45" filter="url(#soft6)"/>

  <!-- Deep indigo shadow in the bottom-right corner -->
  <path d="M950 900c130-140 340-210 650-245v245Z" fill="url(#indigo)"/>

  <!-- Big glossy cyan wave in front: long flat crest, sweeping dive right -->
  <path d="M0 450c300-62 560-64 740-4 190 63 280 232 310 454H0Z" fill="url(#cyan)"/>
  <path d="M0 450c300-62 560-64 740-4 32 11 60 25 86 43-30-16-62-30-96-41-190-62-450-58-730 8Z" fill="#dcf8fd" opacity="0.75" filter="url(#soft6)"/>
</svg>`;

export const gradientArtwork = `data:image/svg+xml,${encodeURIComponent(artwork)}`;
