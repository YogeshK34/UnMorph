"use client";

import { MotionConfig } from "motion/react";

/** Global motion defaults: honour the OS "reduce motion" setting everywhere. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
      {children}
    </MotionConfig>
  );
}
