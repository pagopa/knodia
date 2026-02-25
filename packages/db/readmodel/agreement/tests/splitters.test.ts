import { Agreement } from "@knodia/agreement-models";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import type {
  AgreementRequiredAttributeSQL,
  AgreementSQL,
} from "../src/agreement.ts";

import { splitAgreementIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Agreement Splitters", () => {
  it("should split an Agreement business object into Agreement SQL objects", () => {
    const metadataVersion = 1;
    const agreement = zocker(Agreement).setSeed(0).generate();

    const { agreementSQL, requiredAttributesSQL } =
      splitAgreementIntoObjectsSQL(agreement, metadataVersion);

    const expectedAgreementSQL: AgreementSQL = {
      consumerId: agreement.consumerId,
      createdAt: agreement.createdAt,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      id: agreement.id,
      metadataVersion,
      producerId: agreement.producerId,
      state: agreement.state,
      updatedAt: agreement.updatedAt,
    };

    const expectedRequireAttributesSQL: AgreementRequiredAttributeSQL[] =
      agreement.requiredAttributes.flatMap((group, groupId) =>
        group.map((attribute) => ({
          agreementId: agreement.id,
          code: attribute.code,
          groupId,
          metadataVersion,
          scheme: attribute.scheme,
        })),
      );

    expect(agreementSQL).toStrictEqual(expectedAgreementSQL);
    expect(requiredAttributesSQL).toStrictEqual(
      expect.arrayContaining(expectedRequireAttributesSQL),
    );
  });
});
