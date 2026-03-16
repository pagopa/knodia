import type { WithMetadata } from "@knodia/db-readmodel-commons/models";
import type { Purpose } from "@knodia/purpose-models";

import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { aggregatePurpose } from "../src/converters/aggregators.ts";
import { splitPurposeIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Purpose Aggregators", () => {
  it("should convert Purpose SQL objects into a Purpose business object", () => {
    const purpose = getMockPurpose();
    const metadataVersion = 1;

    const { purposeSQL } = splitPurposeIntoObjectsSQL(purpose, metadataVersion);

    const aggregatedPurpose = aggregatePurpose([{ purpose: purposeSQL }]);

    expect(aggregatedPurpose).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("should return undefined for empty input", () => {
    const aggregatedPurpose = aggregatePurpose([]);

    expect(aggregatedPurpose).toBeUndefined();
  });
});
