import { CallToAction } from "@/components/landing/cta";
import { DetectionDemo } from "@/components/landing/detection-demo";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InfraStrip } from "@/components/landing/infra-strip";
import { Infrastructure } from "@/components/landing/infrastructure";
import { Manifesto } from "@/components/landing/manifesto";
import { UseCases } from "@/components/landing/use-cases";

export default function HomePage() {
  return (
    <>
      <Hero />
      <InfraStrip />
      <Manifesto />
      <HowItWorks />
      <DetectionDemo />
      <Infrastructure />
      <UseCases />
      <CallToAction />
    </>
  );
}
