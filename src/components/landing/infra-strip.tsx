import { Database, HardDrive, ScanFace } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const rails = [
  { name: "World ID", icon: ScanFace, role: "Privacy-preserving proof of personhood" },
  { name: "Arkiv", icon: Database, role: "Wallet-owned, queryable integrity records" },
  { name: "0G", icon: HardDrive, role: "Decentralized storage & AI compute" },
];

export function InfraStrip() {
  return (
    <section aria-labelledby="infra-strip-title" className="relative px-5 pt-6 pb-20 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <p
          id="infra-strip-title"
          className="text-center text-[11.5px] font-semibold tracking-[0.22em] text-muted uppercase"
        >
          Integrity anchored on open infrastructure
        </p>
        <ul className="mt-8 grid overflow-hidden rounded-3xl border border-line/80 bg-white/60 shadow-glass backdrop-blur-md sm:grid-cols-3">
          {rails.map(({ name, icon: Icon, role }, i) => (
            <li
              key={name}
              className={`group flex items-center gap-4 px-6 py-5 transition-colors duration-500 hover:bg-white ${
                i > 0 ? "border-t border-line/80 sm:border-t-0 sm:border-l" : ""
              }`}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-brand-cyan transition-transform duration-500 ease-(--ease-out-expo) group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]">
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              <span>
                <span className="block font-display text-lg font-bold tracking-tight text-ink">
                  {name}
                </span>
                <span className="block text-[13px] leading-snug text-muted">{role}</span>
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
