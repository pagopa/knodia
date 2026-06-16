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

  const sha256Hex = (content: Buffer): string =>
    crypto.createHash("sha256").update(content).digest("hex");

  it("storeBytesIfAbsent writes a new key and reports alreadyExists=false", async () => {
    const content = Buffer.from('{"action":"Onboarding"}');
    const key = "signup-actions/new/Onboarding/nonce-1.json";

    const result = await fileManager.storeBytesIfAbsent({
      bucket: testBucket,
      checksumSHA256Hex: sha256Hex(content),
      content,
      contentType: "application/json",
      key,
    });

    expect(result).toEqual({ alreadyExists: false, key });
    const stored = await fileManager.getBytes({ bucket: testBucket, key });
    expect(stored.content).toEqual(content);
  });

  it("storeBytesIfAbsent does not overwrite an existing key (If-None-Match 412)", async () => {
    const key = "signup-actions/dup/Onboarding/nonce-2.json";
    const original = Buffer.from('{"v":"original"}');

    const first = await fileManager.storeBytesIfAbsent({
      bucket: testBucket,
      checksumSHA256Hex: sha256Hex(original),
      content: original,
      contentType: "application/json",
      key,
    });
    expect(first.alreadyExists).toBe(false);

    const replacement = Buffer.from('{"v":"replacement"}');
    const second = await fileManager.storeBytesIfAbsent({
      bucket: testBucket,
      checksumSHA256Hex: sha256Hex(replacement),
      content: replacement,
      contentType: "application/json",
      key,
    });

    // Reprocessing the same Kafka message must be a no-op, not a new version.
    expect(second).toEqual({ alreadyExists: true, key });
    const stored = await fileManager.getBytes({ bucket: testBucket, key });
    expect(stored.content).toEqual(original);
  });

  it("storeBytesIfAbsent still rejects an invalid hex checksum", async () => {
    await expect(
      fileManager.storeBytesIfAbsent({
        bucket: testBucket,
        checksumSHA256Hex: "nope",
        content: Buffer.from("x"),
        contentType: "text/plain",
        key: "signup-actions/bad/Onboarding/nonce-3.json",
      }),
    ).rejects.toThrowError("Invalid SHA-256 hex checksum");
  });
});
