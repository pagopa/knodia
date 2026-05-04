import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCalculateChecksum } from "./useCalculateChecksum";

const TEST_FILE_CONTENT = "hello";
const TEST_SHA256 =
  "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

describe("useCalculateChecksum", () => {
  it("returns an empty checksum when no file is provided", () => {
    const { result } = renderHook(() => useCalculateChecksum(null));
    expect(result.current.sha256Checksum).toBe("");
  });

  it("computes the SHA-256 checksum of a File", async () => {
    const file = new File([TEST_FILE_CONTENT], "test.txt", {
      type: "text/plain",
    });
    const { result } = renderHook(() => useCalculateChecksum(file));

    await waitFor(() => {
      expect(result.current.sha256Checksum).not.toBe("");
    });

    expect(result.current.sha256Checksum).toBe(TEST_SHA256);
  });

  it("recomputes when the file changes", async () => {
    const fileA = new File([TEST_FILE_CONTENT], "a.txt");
    const fileB = new File(["world"], "b.txt");

    const { rerender, result } = renderHook(
      ({ doc }: { doc: File }) => useCalculateChecksum(doc),
      { initialProps: { doc: fileA } },
    );

    await waitFor(() => {
      expect(result.current.sha256Checksum).not.toBe("");
    });

    const checksumA = result.current.sha256Checksum;
    expect(checksumA).toBe(TEST_SHA256);

    rerender({ doc: fileB });

    await waitFor(() => {
      expect(result.current.sha256Checksum).not.toBe(checksumA);
    });

    expect(result.current.sha256Checksum).toMatch(/^[0-9a-f]{64}$/);
  });
});
