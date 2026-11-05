/**
 * Procedural "photograph" palettes. Every image on the site is a vector scene
 * drawn from one of these, so the product imagery stays crisp, light and on-brand.
 */
export type SceneVariant = "glacier" | "dawn" | "dusk" | "harbor" | "aurora" | "mist";

export type ScenePalette = {
  sky: [string, string];
  sun: string;
  far: string;
  mid: [string, string];
  near: [string, string];
  snow: string;
  water: [string, string];
};

export const scenePalettes: Record<SceneVariant, ScenePalette> = {
  glacier: {
    sky: ["#BDEFFF", "#F1FBFF"],
    sun: "#FFFFFF",
    far: "#A9DDEC",
    mid: ["#5AB3CC", "#2E7F99"],
    near: ["#0E7490", "#0B3A4A"],
    snow: "#F4FDFF",
    water: ["#7FD3E8", "#1B6F86"],
  },
  dawn: {
    sky: ["#FFE3D3", "#E9F6FF"],
    sun: "#FFF3E6",
    far: "#C9D8EA",
    mid: ["#7FA6C4", "#4C7597"],
    near: ["#2F5470", "#172B3D"],
    snow: "#FFF8F2",
    water: ["#B9D6EC", "#3F6788"],
  },
  dusk: {
    sky: ["#C7D2FE", "#FDE7F3"],
    sun: "#FFF1F6",
    far: "#B6BEE6",
    mid: ["#7480B8", "#46508A"],
    near: ["#2B3266", "#151A3A"],
    snow: "#F5F3FF",
    water: ["#A5B4FC", "#3B4384"],
  },
  harbor: {
    sky: ["#CFF7F1", "#F3FFFC"],
    sun: "#FFFFFF",
    far: "#A7E3D8",
    mid: ["#4FB3A6", "#2A8378"],
    near: ["#155E63", "#0B3437"],
    snow: "#F2FFFC",
    water: ["#6FD1C4", "#17635F"],
  },
  aurora: {
    sky: ["#0F2A3D", "#155E75"],
    sun: "#A5F3FC",
    far: "#1F4D63",
    mid: ["#1E6E86", "#123F52"],
    near: ["#0B2633", "#06141C"],
    snow: "#CFFAFE",
    water: ["#0E7490", "#082F3B"],
  },
  mist: {
    sky: ["#E5E7EB", "#F8FAFC"],
    sun: "#FFFFFF",
    far: "#CBD5E1",
    mid: ["#94A3B8", "#64748B"],
    near: ["#475569", "#1E293B"],
    snow: "#F8FAFC",
    water: ["#CBD5E1", "#475569"],
  },
};
