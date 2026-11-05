import localFont from "next/font/local";

/**
 * Brand typefaces, self-hosted from /src/fonts (SIL OFL 1.1 — licences alongside).
 * Plus Jakarta Sans → headlines / branding / UI. Inter → body / content.
 */
export const jakarta = localFont({
  src: "../fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
  preload: true,
});

export const inter = localFont({
  src: "../fonts/Inter-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  preload: true,
});
