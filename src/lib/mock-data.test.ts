import {
  MOCK_NOW,
  countByVerdict,
  dailyActivity,
  filterVerifications,
  kpis,
  recentVerifications,
  seededHex,
  timeAgo,
} from "./mock-data";

describe("mock data", () => {
  it("is deterministic", () => {
    expect(seededHex(42, 16)).toBe(seededHex(42, 16));
    expect(seededHex(42, 16)).not.toBe(seededHex(43, 16));
    expect(seededHex(1, 64)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("has unique verification ids and valid digests", () => {
    const ids = new Set(recentVerifications.map((v) => v.id));
    expect(ids.size).toBe(recentVerifications.length);
    for (const v of recentVerifications) expect(v.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("only links registry records to registered images", () => {
    for (const v of recentVerifications) {
      if (v.verdict === "unregistered") expect(v.arkivRecord).toBeNull();
      else expect(v.arkivRecord).toMatch(/^ark_/);
    }
  });

  it("provides 14 days of activity and 12-point KPI trends", () => {
    expect(dailyActivity).toHaveLength(14);
    for (const kpi of kpis) expect(kpi.trend).toHaveLength(12);
  });
});

describe("filterVerifications", () => {
  it("filters by verdict", () => {
    const tampered = filterVerifications(recentVerifications, "tampered");
    expect(tampered.length).toBeGreaterThan(0);
    expect(tampered.every((v) => v.verdict === "tampered")).toBe(true);
  });

  it("searches file names, ids and hash prefixes case-insensitively", () => {
    const [first] = recentVerifications;
    expect(filterVerifications(recentVerifications, "all", first.fileName.toUpperCase())).toContain(
      first,
    );
    expect(filterVerifications(recentVerifications, "all", first.id.toLowerCase())).toContain(
      first,
    );
    expect(filterVerifications(recentVerifications, "all", first.sha256.slice(0, 8))).toContain(
      first,
    );
    expect(filterVerifications(recentVerifications, "all", "zzz-no-match")).toHaveLength(0);
  });
});

describe("countByVerdict", () => {
  it("adds up to the total", () => {
    const c = countByVerdict(recentVerifications);
    expect(c.authentic + c.tampered + c.unregistered).toBe(c.all);
  });
});

describe("timeAgo", () => {
  const ago = (ms: number) => new Date(MOCK_NOW - ms).toISOString();
  it("formats relative times against the mock clock", () => {
    expect(timeAgo(ago(10_000))).toBe("just now");
    expect(timeAgo(ago(5 * 60_000))).toBe("5m ago");
    expect(timeAgo(ago(3 * 3_600_000))).toBe("3h ago");
    expect(timeAgo(ago(2 * 86_400_000))).toBe("2d ago");
  });
});
