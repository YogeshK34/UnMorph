import { Syne, Space_Grotesk, Inter, Space_Mono } from "next/font/google";

/**
 * Neubrutalist type stack.
 *
 * Syne (800)          → display / hero headlines. Assertive geometry.
 * Space Grotesk (700) → section headings and UI labels.
 * Inter (400/700)     → body copy.
 * Space Mono (400/700) → every technical string: hashes, keys, addresses, JSON.
 */
export const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
  preload: true,
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  display: "swap",
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: true,
});

export const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});
