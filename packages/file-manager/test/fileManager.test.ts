import crypto from "crypto";
import { describe, expect, it } from "vitest";

import { fileManager, testBucket } from "./setup.ts";

describe("fileManager", () => {
  it("storeBytes and getBytes successfully store and retrieve content", async () => {
    const content = Buffer.from('{"message": "test content"}');
    const key = "test-folder/data.json";

    const returnedKey = await fileManager.storeBytes({
      bucket: testBucket,
      checksumSHA256Hex: crypto
        .createHash("sha256")
        .update(content)
        .digest("hex"),
      content,
      contentType: "application/json",
      key,
    });

    expect(returnedKey).toBe(key);
    const result = await fileManager.getBytes({
      bucket: testBucket,
      key,
    });

    expect(result.content).toEqual(content);
    expect(result.contentType).toBe("application/json");
  });

  it("storeBytes rejects a mismatched checksum", async () => {
    const content = Buffer.from("checksum mismatch");
    const key = "test-folder/bad-checksum.txt";
    const wrongChecksum = crypto
      .createHash("sha256")
      .update("different content")
      .digest("hex");

    await expect(
      fileManager.storeBytes({
        bucket: testBucket,
        checksumSHA256Hex: wrongChecksum,
        content,
        contentType: "text/plain",
        key,
      }),
    ).rejects.toThrowError();
  });

  it("storeBytes rejects an invalid hex checksum", async () => {
    const content = Buffer.from("some content");
    const key = "test-folder/invalid-hex.txt";

    await expect(
      fileManager.storeBytes({
        bucket: testBucket,
        checksumSHA256Hex: "some-invalid-hex",
        content,
        contentType: "text/plain",
        key,
      }),
    ).rejects.toThrowError("Invalid SHA-256 hex checksum");
  });
});
