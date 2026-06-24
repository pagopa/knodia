import { describe, expect, it } from "vitest";

import { getInitials } from "./getInitials";

describe("getInitials", () => {
  it("returns the first letter (uppercased) for a single word", () => {
    expect(getInitials("vcaprio")).toBe("V");
    expect(getInitials("jane")).toBe("J");
  });

  it("returns the first letter for a single token containing dots, dashes or underscores", () => {
    // Cognito-style handles: no whitespace -> single letter only.
    expect(getInitials("vittorio.caprio")).toBe("V");
    expect(getInitials("jane_doe")).toBe("J");
    expect(getInitials("mario-rossi")).toBe("M");
  });

  it("returns first + last initial when the name contains whitespace", () => {
    expect(getInitials("Mario Rossi")).toBe("MR");
    expect(getInitials("Lynx Knode")).toBe("LK");
    expect(getInitials("Orion Knode")).toBe("OK");
  });

  it("uses the first and last word for names with more than two words", () => {
    expect(getInitials("Anna Maria Rossi")).toBe("AR");
    expect(getInitials("a b c")).toBe("AC");
  });

  it("trims surrounding whitespace", () => {
    expect(getInitials("  jane  ")).toBe("J");
    expect(getInitials("  Mario   Rossi  ")).toBe("MR");
  });

  it("returns an empty string for empty or whitespace-only input", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });

  it("handles accented and non-latin characters", () => {
    expect(getInitials("Élise")).toBe("É");
    expect(getInitials("Élise Dupont")).toBe("ÉD");
  });

  it("handles emojis without splitting surrogate pairs", () => {
    // Array.from is used to iterate code points correctly.
    const result = getInitials("🚀rocket");
    expect(result).toBe("🚀");
  });
});
