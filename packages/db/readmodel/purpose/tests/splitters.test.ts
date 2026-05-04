import { generateExternalId } from "@knodia/common-models/externalResource";
import { type PurposeStatementTemplateId } from "@knodia/common-models/ids";
import { type Purpose } from "@knodia/purpose-models";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { PurposeSQL } from "../src/purpose.ts";

import { splitPurposeIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Purpose Splitters", () => {
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
          id: generateExternalId<PurposeStatementTemplateId>(),
          knodeId: "Orion",
        },
      },
    },
  ];

  it.each(cases)(
    "should split a Purpose business object into Purpose SQL objects ($description)",
    ({ purpose }) => {
      const metadataVersion = 1;

      const { purposeSQL } = splitPurposeIntoObjectsSQL(
        purpose,
        metadataVersion,
      );

      const expectedPurposeSQL: PurposeSQL = {
        consumerId: purpose.consumer.id,
        consumerKnodeId: purpose.consumer.knodeId,
        createdAt: purpose.createdAt,
        dailyCalls: purpose.dailyCalls,
        description: purpose.description,
        eserviceId: purpose.eserviceId,
        formAnswersJson: purpose.formAnswersJson,
        formSchemaVersion: purpose.formSchemaVersion,
        id: purpose.id,
        metadataVersion,
        name: purpose.name,
        state: purpose.state,
        suspendedByConsumerAt: purpose.suspendedByConsumerAt,
        suspendedByProducerAt: purpose.suspendedByProducerAt,
        templateId: purpose.template?.id ?? null,
        templateKnodeId: purpose.template?.knodeId ?? null,
        updatedAt: purpose.updatedAt,
      };

      expect(purposeSQL).toEqual(expectedPurposeSQL);
    },
  );
});
