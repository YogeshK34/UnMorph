import { Database, HardDrive, ScanFace } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

const rails = [
  {
    name: "World ID",
    icon: ScanFace,
    role: "Privacy-preserving proof of personhood",
    tone: "bg-nb-yellow",
  },
  {
    name: "Arkiv",
    icon: Database,
    role: "Wallet-owned, queryable integrity records",
    tone: "bg-nb-blue",
  },
  {
    name: "0G",
    icon: HardDrive,
    role: "Decentralized storage & AI compute",
    tone: "bg-nb-lavender",
  },
];

export function InfraStrip() {
  return (
    <section aria-labelledby="infra-strip-title" className="relative px-5 pt-6 pb-20 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <p id="infra-strip-title" className="flex justify-center">
          <span className="border-[3px] border-nb-black bg-nb-black px-3 py-1 font-heading text-[11.5px] font-bold tracking-[0.18em] text-nb-bg uppercase">
            Integrity anchored on open infrastructure
          </span>
        </p>
        <ul className="mt-8 grid border-[3px] border-nb-black bg-nb-surface shadow-nb sm:grid-cols-3">
          {rails.map(({ name, icon: Icon, role, tone }, i) => (
            <li
              key={name}
              className={cn(
                "group flex items-center gap-4 px-6 py-5 transition-colors duration-150 hover:bg-nb-yellow",
                i > 0 && "border-t-[3px] border-nb-black sm:border-t-0 sm:border-l-[3px]",
              )}
            >
              <span
                className={cn(
                  "grid size-12 shrink-0 place-items-center border-[3px] border-nb-black text-nb-black transition-transform duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5",
                  tone,
                )}
              >
                <Icon className="size-5" strokeWidth={2.5} />
              </span>
              <span>
                <span className="block font-display text-lg font-extrabold uppercase tracking-tight text-nb-black">
                  {name}
                </span>
                <span className="block text-[13px] leading-snug text-nb-muted">{role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
