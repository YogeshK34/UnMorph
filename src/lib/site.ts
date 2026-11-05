export const site = {
  name: "UnMorph",
  tagline: "Image Integrity Layer",
  description:
    "A decentralized security layer that makes image manipulation detectable and authenticity independently verifiable — powered by World ID, Arkiv and 0G.",
  url: "https://unmorph.app",
  repo: "https://github.com/maitreya-ai/UnMorph",
} as const;

export type SectionLink = {
  /** Section element id on the landing page. */
  id: string;
  label: string;
};

/** Landing page sections — drive the dynamic island links + active-section label. */
export const sections: SectionLink[] = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How it works" },
  { id: "detection", label: "Detection" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "use-cases", label: "Use cases" },
  { id: "get-started", label: "Get started" },
];

/** The subset shown as links in the navbar. */
export const navLinks = sections.filter((s) => s.id !== "overview" && s.id !== "get-started");
