import { getMockAgreement } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { AgreementAttributeSQL, AgreementSQL } from "../src/agreement.ts";

import { splitAgreementIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Agreement Splitters", () => {
  it("should split an Agreement business object into Agreement SQL objects", () => {
    const metadataVersion = 1;
    const agreement = getMockAgreement();

    const { agreementSQL, attributesSQL } = splitAgreementIntoObjectsSQL(
      agreement,
      metadataVersion,
    );

    const expectedAgreementSQL: AgreementSQL = {
      consumerId: agreement.consumer.id,
      consumerKnodeId: agreement.consumer.knodeId,
      createdAt: agreement.createdAt,
      eserviceId: agreement.eserviceId,
      eserviceVersionId: agreement.eserviceVersionId,
      id: agreement.id,
      metadataVersion,
      producerId: agreement.producerId,
      state: agreement.state,
      suspendedByConsumerAt: agreement.suspendedByConsumerAt,
      suspendedByProducerAt: agreement.suspendedByProducerAt,
      updatedAt: agreement.updatedAt,
    };

    const expectedAttributesSQL: AgreementAttributeSQL[] =
      agreement.attributes.map((attribute) => ({
        agreementId: agreement.id,
        code: attribute.code,
        metadataVersion,
        scheme: attribute.scheme,
      }));

    expect(agreementSQL).toEqual(expectedAgreementSQL);
    expect(attributesSQL).toEqual(
      expect.arrayContaining(expectedAttributesSQL),
    );
  });
});
