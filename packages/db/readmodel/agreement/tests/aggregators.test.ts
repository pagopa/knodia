import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { Agreement } from "@knodia/agreement-models";
import { toExpectAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import {
  aggregateAgreement,
  aggregateAgreements,
} from "../src/converters/aggregators.ts";
import { splitAgreementIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Agreement Aggregators", () => {
  it("should convert Agreement SQL objects into an Agreement business object", () => {
    const agreement: WithMetadata<Agreement> = {
      data: zocker(Agreement).setSeed(0).generate(),
      metadata: {
        version: 1,
      },
    };

    const { agreementSQL, requiredAttributesSQL } =
      splitAgreementIntoObjectsSQL(agreement.data, agreement.metadata.version);

    const aggregatedAgreement = aggregateAgreement(
      requiredAttributesSQL.map((requiredAttribute) => ({
        agreement: agreementSQL,
        requiredAttribute,
      })),
    );

    expect(aggregatedAgreement).toEqual({
      data: toExpectAgreement(agreement.data),
      metadata: agreement.metadata,
    } satisfies WithMetadata<Agreement>);
  });

  it("should convert Agreements SQL objects into Agreements business objects", () => {
    const agreement1: WithMetadata<Agreement> = {
      data: zocker(Agreement).setSeed(0).generate(),
      metadata: {
        version: 1,
      },
    };
    const agreement2: WithMetadata<Agreement> = {
      data: zocker(Agreement).setSeed(1).generate(),
      metadata: {
        version: 1,
      },
    };

    const {
      agreementSQL: agreementSQL1,
      requiredAttributesSQL: requiredAttributesSQL1,
    } = splitAgreementIntoObjectsSQL(
      agreement1.data,
      agreement1.metadata.version,
    );
    const {
      agreementSQL: agreementSQL2,
      requiredAttributesSQL: requiredAttributesSQL2,
    } = splitAgreementIntoObjectsSQL(
      agreement2.data,
      agreement2.metadata.version,
    );

    const aggregatedAgreements = aggregateAgreements([
      ...requiredAttributesSQL1.map((requiredAttribute) => ({
        agreement: agreementSQL1,
        requiredAttribute,
      })),
      ...requiredAttributesSQL2.map((requiredAttribute) => ({
        agreement: agreementSQL2,
        requiredAttribute,
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
