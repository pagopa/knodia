import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import {
  type Agreement,
  agreementEvents,
  toAgreementV1,
} from "@knodia/agreement-models";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockAgreement,
  toExpectAgreement,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { consumer, producer, readmodelDb, topicName } from "./setup.ts";
import { getAllAgreements } from "./utils.ts";

describe("Agreement read model writer tests", async () => {
  it("AgreementActivatedV1", async () => {
    const agreement = getMockAgreement();
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementActivatedV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementActivatedV1",
      metadataVersion,
      producer,
      streamId: agreement.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedAgreements = await getAllAgreements(readmodelDb);

    expect(retrievedAgreements.length).toBe(1);
    expect(retrievedAgreements[0]).toEqual({
      data: toExpectAgreement(agreement),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Agreement>);
  });
});
