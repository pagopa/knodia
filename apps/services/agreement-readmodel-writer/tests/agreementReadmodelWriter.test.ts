/* eslint-disable max-lines-per-function */
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

  it("AgreementCreatedPendingConsumerOperatorIdentificationV1", async () => {
    const agreement = getMockAgreement();
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementCreatedPendingConsumerOperatorIdentificationV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementCreatedPendingConsumerOperatorIdentificationV1",
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

  it("AgreementActivatedByConsumerOperatorV1", async () => {
    const agreement = getMockAgreement();
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementActivatedByConsumerOperatorV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementActivatedByConsumerOperatorV1",
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

  it("AgreementSuspendedByConsumerV1", async () => {
    const agreement: Agreement = {
      ...getMockAgreement({ state: "Suspended" }),
      suspendedByConsumerAt: new Date("2026-01-15T10:00:00Z"),
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementSuspendedByConsumerV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementSuspendedByConsumerV1",
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

  it("AgreementSuspendedByProducerV1", async () => {
    const agreement: Agreement = {
      ...getMockAgreement({ state: "Suspended" }),
      suspendedByConsumerAt: null,
      suspendedByProducerAt: new Date("2026-01-15T10:00:00Z"),
    };
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementSuspendedByProducerV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 1;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementSuspendedByProducerV1",
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

  it("AgreementReactivatedByConsumerV1", async () => {
    const agreement: Agreement = {
      ...getMockAgreement(),
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementReactivatedByConsumerV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementReactivatedByConsumerV1",
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

  it("AgreementReactivatedByProducerV1", async () => {
    const agreement: Agreement = {
      ...getMockAgreement(),
      suspendedByConsumerAt: null,
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementReactivatedByProducerV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementReactivatedByProducerV1",
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

  it("AgreementArchivedV1", async () => {
    const agreement: Agreement = {
      ...getMockAgreement({ state: "Archived" }),
      suspendedByConsumerAt: new Date("2026-01-15T10:00:00Z"),
      suspendedByProducerAt: null,
    };
    const eventData = protobufBinaryCodec(
      agreementEvents.AgreementArchivedV1,
    ).encode({
      agreement: toAgreementV1(agreement),
    });

    const metadataVersion = 2;
    await sendTestEvent({
      data: eventData,
      eventType: "AgreementArchivedV1",
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
