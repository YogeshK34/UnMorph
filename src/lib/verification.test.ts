/**
 * @jest-environment node
 */
import { deriveVerdict, pipelineSteps, sceneForHash, sha256Hex } from "./verification";

describe("sha256Hex", () => {
  it("matches the NIST test vector for 'abc'", async () => {
    const digest = await sha256Hex(new TextEncoder().encode("abc"));
    expect(digest).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("accepts an ArrayBuffer", async () => {
    const bytes = new TextEncoder().encode("unmorph");
    const fromBuffer = await sha256Hex(bytes.buffer.slice(0) as ArrayBuffer);
    expect(fromBuffer).toHaveLength(64);
    expect(fromBuffer).toBe(await sha256Hex(bytes));
  });
});

describe("deriveVerdict", () => {
  const pad = (prefix: string) => prefix.padEnd(64, "0");

  it("maps the first byte into authentic / tampered / unregistered buckets", () => {
    expect(deriveVerdict(pad("1e")).verdict).toBe("authentic"); // 30 % 10 = 0
    expect(deriveVerdict(pad("10")).verdict).toBe("tampered"); // 16 % 10 = 6
    expect(deriveVerdict(pad("12")).verdict).toBe("unregistered"); // 18 % 10 = 8
  });

  it("is deterministic for the same hash", () => {
    const hash = "9f2c4ba1d0e7a71e".repeat(4);
    expect(deriveVerdict(hash)).toEqual(deriveVerdict(hash));
  });

  it("keeps confidence within sensible bounds", () => {
    for (let i = 0; i < 256; i++) {
      const hash = (i.toString(16).padStart(2, "0") + "ff").repeat(16);
      const { confidence, alteredRegions, verdict } = deriveVerdict(hash);
      expect(confidence).toBeGreaterThanOrEqual(70);
      expect(confidence).toBeLessThanOrEqual(100);
      if (verdict === "tampered") expect(alteredRegions).toBeGreaterThan(0);
      else expect(alteredRegions).toBe(0);
    }
  });

  it("rejects non-hex input", () => {
    expect(() => deriveVerdict("not-a-hash")).toThrow(/hex digest/);
  });
});

describe("pipeline", () => {
  it("runs fingerprinting first and attestation last", () => {
    expect(pipelineSteps[0].id).toBe("fingerprint");
    expect(pipelineSteps.at(-1)?.id).toBe("attestation");
  });

  it("assigns a stable scene to a hash", () => {
    const hash = "ab".repeat(32);
    expect(sceneForHash(hash)).toBe(sceneForHash(hash));
  });
});
