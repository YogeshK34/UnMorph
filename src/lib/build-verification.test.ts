import { buildVerification } from "./build-verification";
import { deriveVerdict } from "./verification";

const subject = {
  fileName: "x.jpg",
  sizeBytes: 1024,
  dimensions: "10 × 10",
  scene: "glacier" as const,
};

describe("buildVerification", () => {
  it("anchors registered images to a record and history", () => {
    const hash = "1e".padEnd(64, "a");
    const record = buildVerification(subject, hash, deriveVerdict(hash), 0);
    expect(record.verdict).toBe("authentic");
    expect(record.id).toBe("VRF-20932");
    expect(record.arkivRecord).toMatch(/^ark_/);
    expect(record.storageRoot).toBe(`0x${hash}`);
    expect(record.history.map((h) => h.type)).toEqual(["registered", "verified"]);
  });

  it("records a lookup miss for unregistered images", () => {
    const hash = "12".padEnd(64, "b");
    const record = buildVerification(subject, hash, deriveVerdict(hash), 3);
    expect(record.verdict).toBe("unregistered");
    expect(record.id).toBe("VRF-20935");
    expect(record.arkivRecord).toBeNull();
    expect(record.history).toEqual([expect.objectContaining({ type: "lookup-miss" })]);
  });
});
