import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { generateExternalId } from "@knodia/common-models/externalResource";
import { type PurposeTemplateId } from "@knodia/common-models/ids";
import { type Purpose } from "@knodia/purpose-models";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { aggregatePurpose } from "../src/converters/aggregators.ts";
import { splitPurposeIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Purpose Aggregators", () => {
  const cases: readonly { description: string; purpose: Purpose }[] = [
    {
      description: "without a template",
      purpose: { ...getMockPurpose(), template: undefined },
    },
    {
      description: "with a template",
      purpose: {
        ...getMockPurpose(),
        template: {
          id: generateExternalId<PurposeTemplateId>(),
          knodeId: "Lynx",
        },
      },
    },
  ];

  it.each(cases)(
    "should convert Purpose SQL objects into a Purpose business object ($description)",
    ({ purpose }) => {
      const metadataVersion = 1;

      const { purposeSQL } = splitPurposeIntoObjectsSQL(
        purpose,
        metadataVersion,
      );

      const aggregatedPurpose = aggregatePurpose([{ purpose: purposeSQL }]);

      expect(aggregatedPurpose).toEqual({
        data: purpose,
        metadata: { version: metadataVersion },
      } satisfies WithMetadata<Purpose>);
    },
  );

  it("should return undefined for empty input", () => {
    const aggregatedPurpose = aggregatePurpose([]);

    expect(aggregatedPurpose).toBeUndefined();
  });
});
