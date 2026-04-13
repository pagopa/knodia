import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type Eservice,
  eserviceEvents,
  EserviceVersionState,
  toEserviceV1,
} from "@knodia/eservice-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import { getMockEservice, toExpectEservice } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { consumer, producer, readmodelDb, topicName } from "./setup.ts";
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

    await consumer.waitForNextMessage();

    const retrievedEservices = await getAllEservices(readmodelDb);

    expect(retrievedEservices.length).toBe(1);
    expect(retrievedEservices[0]).toEqual({
      data: toExpectEservice(eservice),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Eservice>);
  });

  it("EserviceVersionSuspendedV1", async () => {
    const eservice = getMockEservice({
      latestVersionState: EserviceVersionState.enum.Suspended,
    });

    const eventData = protobufBinaryCodec(
      eserviceEvents.EserviceVersionSuspendedV1,
    ).encode({
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "EserviceVersionSuspendedV1",
      metadataVersion,
      producer,
      streamId: eservice.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedEservices = await getAllEservices(readmodelDb);

    expect(retrievedEservices.length).toBe(1);
    expect(retrievedEservices[0]).toEqual({
      data: toExpectEservice(eservice),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Eservice>);
  });
});
