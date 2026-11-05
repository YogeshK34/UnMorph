import { Footer } from "@/components/landing/footer";
import { DynamicIsland } from "@/components/nav/dynamic-island";
import { SmoothScroll } from "@/components/providers/smooth-scroll";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <SmoothScroll>
      <DynamicIsland />
      <main className="relative overflow-x-clip">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
