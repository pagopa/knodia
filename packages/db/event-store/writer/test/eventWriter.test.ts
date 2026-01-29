import { EserviceId, generateId } from "@knodia/common-models/ids";
import { describe, expect, it } from "vitest";

import { computeNextMetadataVersion } from "../src/eventWriter.ts";

describe("computeNextMetadataVersion", () => {
  const streamId = generateId<EserviceId>();

  it("starts at version 0 when there is no prior version", () => {
    const version0 = computeNextMetadataVersion({
      currentVersion: undefined,
      latestVersion: undefined,
      streamId,
    });

    expect(version0).toBe(BigInt(0));
  });

  it("increments the metadata version when the latest matches", () => {
    const version1 = computeNextMetadataVersion({
      currentVersion: BigInt(0),
      latestVersion: BigInt(0),
      streamId,
    });

    expect(version1).toBe(BigInt(1));

    const version2 = computeNextMetadataVersion({
      currentVersion: BigInt(1),
      latestVersion: BigInt(1),
      streamId,
    });

    expect(version2).toBe(BigInt(2));
  });

  it("throws when the provided metadata version is not the latest", () => {
    expect(() =>
      computeNextMetadataVersion({
        currentVersion: BigInt(1),
        latestVersion: BigInt(2),
        streamId,
      }),
    ).toThrowError(
      `Current metadata version 1 is not the latest for stream ${String(streamId)} (latest is 2)`,
    );

    expect(() =>
      computeNextMetadataVersion({
        currentVersion: BigInt(0),
        latestVersion: undefined,
        streamId,
      }),
    ).toThrowError(
      `Current metadata version 0 is not the latest for stream ${String(streamId)} (latest is undefined)`,
    );
  });
});
