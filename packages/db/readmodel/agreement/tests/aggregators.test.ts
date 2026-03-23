import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { Agreement } from "@knodia/agreement-models";
import {
  getMockAgreement,
  toExpectAgreement,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  aggregateAgreement,
  aggregateAgreements,
} from "../src/converters/aggregators.ts";
import { splitAgreementIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Agreement Aggregators", () => {
  it("should convert Agreement SQL objects into an Agreement business object", () => {
    const agreement: WithMetadata<Agreement> = {
      data: getMockAgreement(),
      metadata: {
        version: 1,
      },
    };

    const { agreementSQL, attributesSQL } = splitAgreementIntoObjectsSQL(
      agreement.data,
      agreement.metadata.version,
    );

    const aggregatedAgreement = aggregateAgreement(
      attributesSQL.map((attribute) => ({
        agreement: agreementSQL,
        attribute,
      })),
    );

    expect(aggregatedAgreement).toEqual({
      data: toExpectAgreement(agreement.data),
      metadata: agreement.metadata,
    } satisfies WithMetadata<Agreement>);
  });

  it("should convert Agreements SQL objects into Agreements business objects", () => {
    const agreement1: WithMetadata<Agreement> = {
      data: getMockAgreement(),
      metadata: {
        version: 1,
      },
    };
    const agreement2: WithMetadata<Agreement> = {
      data: getMockAgreement({ seed: 1 }),
      metadata: {
        version: 1,
      },
    };

    const { agreementSQL: agreementSQL1, attributesSQL: attributesSQL1 } =
      splitAgreementIntoObjectsSQL(
        agreement1.data,
        agreement1.metadata.version,
      );
    const { agreementSQL: agreementSQL2, attributesSQL: attributesSQL2 } =
      splitAgreementIntoObjectsSQL(
        agreement2.data,
        agreement2.metadata.version,
      );

    const aggregatedAgreements = aggregateAgreements([
      ...attributesSQL1.map((attribute) => ({
        agreement: agreementSQL1,
        attribute,
      })),
      ...attributesSQL2.map((attribute) => ({
        agreement: agreementSQL2,
        attribute,
      })),
    ]);

    expect(aggregatedAgreements).toEqual(
      expect.arrayContaining([
        {
          data: toExpectAgreement(agreement1.data),
          metadata: agreement1.metadata,
        },
        {
          data: toExpectAgreement(agreement2.data),
          metadata: agreement2.metadata,
        },
      ] satisfies WithMetadata<Agreement>[]),
    );
  });
});
