"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type HTMLMotionProps } from "motion/react";

type ParallaxProps = HTMLMotionProps<"div"> & {
  /**
   * Relative depth. Positive values drift up as you scroll down (foreground),
   * negative values lag behind (background). ~0.1–0.4 is tasteful.
   */
  speed?: number;
  /** Optional rotation (deg) applied across the element's scroll range. */
  rotate?: number;
};

/** Scroll-linked vertical parallax for any element. */
export function Parallax({ speed = 0.2, rotate = 0, style, children, ...rest }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const distance = speed * 260;
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);

  return (
    <motion.div ref={ref} style={{ y, rotate: r, ...style }} {...rest}>
      {children}
    </motion.div>
  );
}
