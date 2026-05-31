import { Component } from "@angular/core";

/** The Fluid ripples mark (same SVG as the other surfaces). */
@Component({
  selector: "app-logo",
  standalone: true,
  template: `
    <svg class="brand-mark" viewBox="0 0 96 96" aria-hidden="true">
      <defs>
        <linearGradient id="fluidLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#3b82f6" />
          <stop offset="1" stop-color="#22d3ee" />
        </linearGradient>
        <clipPath id="fluidLogoClip">
          <rect width="96" height="96" rx="22" />
        </clipPath>
      </defs>
      <g clip-path="url(#fluidLogoClip)">
        <rect width="96" height="96" fill="url(#fluidLogoGrad)" />
        <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">
          <path d="M-6,40 C12,30 26,50 44,40 S72,30 102,40" opacity="0.95" />
          <path d="M-6,58 C12,48 26,68 44,58 S72,48 102,58" opacity="0.65" />
          <path d="M-6,76 C12,66 26,86 44,76 S72,66 102,76" opacity="0.35" />
        </g>
      </g>
    </svg>
  `
})
export class LogoComponent {}
