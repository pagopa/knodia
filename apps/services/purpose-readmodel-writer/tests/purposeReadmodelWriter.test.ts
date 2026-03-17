import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type Purpose,
  purposeEvents,
  toPurposeV1,
} from "@knodia/purpose-models";
import { runTestConsumer, sendTestEvent } from "@knodia/test-commons/kafka";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import {
  kafkaConfig,
  processMessage,
  producer,
  readmodelDb,
  topicName,
} from "./setup.ts";
import { getAllPurposes } from "./utils.ts";

describe("Purpose read model writer tests", async () => {
  it("PurposeActivatedV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      formAnswersJson: { question1: "answer1" },
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeActivatedV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeActivatedV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await runTestConsumer(topicName, processMessage, kafkaConfig);

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });
});
