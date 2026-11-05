"use client";

import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

export const SECTION_SCROLL_OFFSET = -88;

/**
 * Click handler for "/#section" links: on the landing page it glides there with
 * Lenis (or native smooth scroll); elsewhere it lets Next navigate normally.
 */
export function useSectionNav() {
  const pathname = usePathname();
  const lenis = useLenis();

  return useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      if (pathname !== "/") return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: SECTION_SCROLL_OFFSET, duration: 1.4 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY + SECTION_SCROLL_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
      }
    },
    [pathname, lenis],
  );
}
