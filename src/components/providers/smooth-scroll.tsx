"use client";

import { ReactLenis } from "lenis/react";

/**
 * Inertial smooth scrolling for marketing pages. Motion's useScroll reads the
 * native scroll position Lenis drives, so parallax stays perfectly in sync.
 * Lenis disables smoothing automatically when the user prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.09,
        smoothWheel: true,
        wheelMultiplier: 1,
        stopInertiaOnNavigate: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}
