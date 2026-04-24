import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type Purpose,
  purposeEvents,
  toPurposeV1,
} from "@knodia/purpose-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import { getMockPurpose } from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { consumer, producer, readmodelDb, topicName } from "./setup.ts";
import { getAllPurposes } from "./utils.ts";

describe("Purpose read model writer tests", async () => {
  it("PurposeActivatedV1", async () => {
    const purpose: Purpose = getMockPurpose();
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

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("PurposeSuspendedByConsumerV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      state: "Suspended",
      suspendedByConsumerAt: new Date("2026-01-15T10:00:00Z"),
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeSuspendedByConsumerV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeSuspendedByConsumerV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("PurposeSuspendedByProducerV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      state: "Suspended",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: new Date("2026-01-15T10:00:00Z"),
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeSuspendedByProducerV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeSuspendedByProducerV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("PurposeReactivatedByConsumerV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeReactivatedByConsumerV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeReactivatedByConsumerV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("PurposeReactivatedByProducerV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      state: "Active",
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeReactivatedByProducerV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeReactivatedByProducerV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });

  it("PurposeArchivedV1", async () => {
    const purpose: Purpose = {
      ...getMockPurpose(),
      archivedAt: new Date("2026-02-01T09:00:00Z"),
      state: "Archived",
    };
    const eventData = protobufBinaryCodec(
      purposeEvents.PurposeArchivedV1,
    ).encode({
      purpose: toPurposeV1(purpose),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "PurposeArchivedV1",
      metadataVersion,
      producer,
      streamId: purpose.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedPurposes = await getAllPurposes(readmodelDb);

    expect(retrievedPurposes.length).toBe(1);
    expect(retrievedPurposes[0]).toEqual({
      data: purpose,
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Purpose>);
  });
});
