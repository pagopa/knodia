import { type EserviceId, generateId } from "@knodia/common-models/ids";
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

    expect(version0).toBe(0);
  });

  it("increments the metadata version when the latest matches", () => {
    const version1 = computeNextMetadataVersion({
      currentVersion: 0,
      latestVersion: 0,
      streamId,
    });

    expect(version1).toBe(1);

    const version2 = computeNextMetadataVersion({
      currentVersion: 1,
      latestVersion: 1,
      streamId,
    });

    expect(version2).toBe(2);
  });

  it("throws when the provided metadata version is not the latest", () => {
    expect(() =>
      computeNextMetadataVersion({
        currentVersion: 1,
        latestVersion: 2,
        streamId,
      }),
    ).toThrowError(
      `Current metadata version 1 is not the latest for stream ${String(streamId)} (latest is 2)`,
    );

    expect(() =>
      computeNextMetadataVersion({
        currentVersion: 0,
        latestVersion: undefined,
        streamId,
      }),
    ).toThrowError(
      `Current metadata version 0 is not the latest for stream ${String(streamId)} (latest is undefined)`,
    );
  });
});
