import { cn, formatBytes, formatCount, truncateMiddle } from "./utils";

describe("utils", () => {
  it("merges tailwind classes, last one wins", () => {
    expect(cn("px-2 text-sm", false && "hidden", "px-4")).toBe("text-sm px-4");
  });

  it("truncates long hashes in the middle", () => {
    expect(truncateMiddle("0123456789abcdef", 4, 4)).toBe("0123…cdef");
    expect(truncateMiddle("short", 4, 4)).toBe("short");
  });

  it("formats counts in full below 10k and compact above", () => {
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(12_900)).toBe("12.9K");
  });

  it("formats byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
