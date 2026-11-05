import type { Metadata } from "next";
import { DynamicIsland } from "@/components/nav/dynamic-island";
import { NotFoundView } from "@/components/not-found/not-found-view";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <DynamicIsland pageLabel="Page not found" />
      <NotFoundView />
    </>
  );
}
