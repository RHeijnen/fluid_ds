import type { Metadata } from "next";
import type { ReactNode } from "react";

// Token + brand CSS load server-side (no JS, no FOUC). Order matters: base,
// then the scheme sheets, then the brand presets, then app layout.
import "@fluid-ds/tokens/base.css";
import "@fluid-ds/tokens/light.css";
import "@fluid-ds/tokens/dark.css";
import "@fluid-ds/themes/midnight.css";
import "@fluid-ds/themes/corporate.css";
import "../src/styles.css";

import { Shell } from "../src/Shell";

export const metadata: Metadata = {
  title: "Fluid Admin · Next.js",
  description: "Fluid web components in a Next.js App Router app.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-fluid-theme="light">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
