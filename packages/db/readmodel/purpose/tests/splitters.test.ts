import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import type { PurposeSQL } from "../src/purpose.ts";

import { splitPurposeIntoObjectsSQL } from "../src/converters/splitters.ts";

describe("Purpose Splitters", () => {
  it("should split a Purpose business object into Purpose SQL objects", () => {
    const metadataVersion = 1;
    const purpose = getMockPurpose();

    const { purposeSQL } = splitPurposeIntoObjectsSQL(purpose, metadataVersion);

    const expectedPurposeSQL: PurposeSQL = {
      consumerId: purpose.consumer.id,
      consumerKnodeId: purpose.consumer.knodeId,
      createdAt: purpose.createdAt,
      dailyCalls: purpose.dailyCalls,
      description: purpose.description,
      eserviceId: purpose.eserviceId,
      formAnswersJson: purpose.formAnswersJson,
      id: purpose.id,
      metadataVersion,
      name: purpose.name,
      state: purpose.state,
      updatedAt: purpose.updatedAt,
    };

    expect(purposeSQL).toEqual(expectedPurposeSQL);
  });
});
