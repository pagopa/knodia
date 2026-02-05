import type { WithMetadata } from "@knodia/db-readmodel-commons";

import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  Eservice,
  eserviceEvents,
  toEserviceV1,
} from "@knodia/eservice-models";
import { runConsumer } from "@knodia/kafka-commons";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import { getMockEservice, toExpectEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { kafkaConfig, processMessage, producer, topicName } from "./setup.ts";
import { getAllEservices } from "./utils.ts";

describe("E-service read model writer tests", async () => {
  it("EserviceVersionActivatedV1", async () => {
    const eservice = getMockEservice();

    const eventData = protobufBinaryCodec(
      eserviceEvents.EserviceVersionActivatedV1,
    ).encode({
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "EserviceVersionActivatedV1",
      metadataVersion,
      producer,
      streamId: eservice.id,
      topicName,
    });

    await runConsumer([topicName], processMessage, kafkaConfig);

    let retrievedEservices: WithMetadata<Eservice>[] = [];
    await expect
      .poll(async () => {
        retrievedEservices = await getAllEservices();
        return retrievedEservices.length;
      })
      .toBe(1);

    expect(retrievedEservices[0]).toEqual({
      data: toExpectEservice(eservice),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Eservice>);
  });
});
