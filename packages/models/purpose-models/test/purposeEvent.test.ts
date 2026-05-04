/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateExternalId } from "@knodia/common-models/externalResource";
import {
  generateId,
  type PurposeStatementTemplateId,
} from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import {
  PurposeActivatedV1,
  PurposeArchivedV1,
  PurposeReactivatedByConsumerV1,
  PurposeReactivatedByProducerV1,
  PurposeSuspendedByConsumerV1,
  PurposeSuspendedByProducerV1,
} from "../src/generated/v1/purposeEvents.ts";
import { Purpose, PurposeState } from "../src/purpose.ts";
import { PurposeEventV1 } from "../src/purposeEvent.ts";
import { fromPurposeV1 } from "../src/purposeProtobufConverterFromV1.ts";
import { toPurposeV1 } from "../src/purposeProtobufConverterToV1.ts";

describe("PurposeEventV1 codec", () => {
  // zocker generates non-JSON-serializable values for Record<string, unknown>;
  // override formAnswersJson with a realistic JSON-safe object
  const mockFormAnswers = {
    checked: true,
    count: 42,
    nested: { deep: "value" },
    options: ["a", "b", "c"],
    question1: "answer1",
  };

  const purpose: Purpose = {
    ...zocker(Purpose).generate(),
    formAnswersJson: mockFormAnswers,
  };

  const consumerOnlySuspendedPurpose: Purpose = {
    ...zocker(Purpose).generate(),
    formAnswersJson: mockFormAnswers,
    state: PurposeState.enum.Suspended,
    suspendedByConsumerAt: new Date(),
    suspendedByProducerAt: null,
  };
  const producerOnlySuspendedPurpose: Purpose = {
    ...zocker(Purpose).generate(),
    formAnswersJson: mockFormAnswers,
    state: PurposeState.enum.Suspended,
    suspendedByConsumerAt: null,
    suspendedByProducerAt: new Date(),
  };
  // explicitly cover the template field round-trip (zocker may omit optionals)
  const purposeWithTemplate: Purpose = {
    ...zocker(Purpose).generate(),
    formAnswersJson: mockFormAnswers,
    template: {
      id: generateExternalId<PurposeStatementTemplateId>(),
      knodeId: "Orion",
    },
  };

  const cases = [
    {
      message: PurposeActivatedV1,
      purpose,
      type: "PurposeActivatedV1" as const,
    },
    {
      message: PurposeActivatedV1,
      purpose: purposeWithTemplate,
      type: "PurposeActivatedV1" as const,
    },
    {
      message: PurposeSuspendedByConsumerV1,
      purpose: consumerOnlySuspendedPurpose,
      type: "PurposeSuspendedByConsumerV1" as const,
    },
    {
      message: PurposeSuspendedByProducerV1,
      purpose: producerOnlySuspendedPurpose,
      type: "PurposeSuspendedByProducerV1" as const,
    },
    {
      message: PurposeReactivatedByConsumerV1,
      purpose: producerOnlySuspendedPurpose,
      type: "PurposeReactivatedByConsumerV1" as const,
    },
    {
      message: PurposeReactivatedByProducerV1,
      purpose: consumerOnlySuspendedPurpose,
      type: "PurposeReactivatedByProducerV1" as const,
    },
    {
      message: PurposeArchivedV1,
      purpose: consumerOnlySuspendedPurpose,
      type: "PurposeArchivedV1" as const,
    },
  ] as const;

  it.each(cases)(
    "encodes and decodes a $type payload (PurposeEventV1 full codec)",
    (caseItem) => {
      const event = match(caseItem)
        .with(
          { type: "PurposeActivatedV1" },
          { type: "PurposeSuspendedByConsumerV1" },
          { type: "PurposeSuspendedByProducerV1" },
          { type: "PurposeReactivatedByConsumerV1" },
          { type: "PurposeReactivatedByProducerV1" },
          { type: "PurposeArchivedV1" },
          ({ purpose: p, type }): PurposeEventV1 => ({
            data: { purpose: toPurposeV1(p) },
            type,
          }),
        )
        .exhaustive();

      const encoded = PurposeEventV1.encode(event);
      expect(encoded).toMatchObject({ type: event.type });
      expect(encoded.data).toBeInstanceOf(Uint8Array);

      const decoded = PurposeEventV1.decode(encoded);
      expect(fromPurposeV1(decoded.data.purpose!)).toEqual(caseItem.purpose);
    },
  );

  it.each(cases)(
    "encodes and decodes a $type payload (protobufBinaryCodec-only)",
    ({ message, purpose: originalPurpose }) => {
      const codec = protobufBinaryCodec(message);
      const value = { purpose: toPurposeV1(originalPurpose) };
      const bytes = codec.encode(value);
      expect(bytes).toBeInstanceOf(Uint8Array);

      const decoded = codec.decode(bytes);
      expect(fromPurposeV1(decoded.purpose!)).toEqual(originalPurpose);
    },
  );

  it("decodes a KafkaMessageEnvelope with PurposeEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: PurposeEventV1 = {
      data: {
        purpose: toPurposeV1(purpose),
      },
      type: "PurposeActivatedV1",
    };

    // This the encoding we perform when writing into the event store DB
    const { data, type } = PurposeEventV1.encode(event);

    // This is the envelope as produced in Kafka by Debezium from the event store DB
    const envelope = {
      value: JSON.stringify({
        after: {
          correlation_id: generateId(),
          data: toHex(data),
          log_date: new Date().toISOString(),
          sequence_num: 1,
          stream_id: generateId(),
          type,
          version: 1,
        },
      }),
    };

    const decoded = KafkaMessageEnvelope(PurposeEventV1).decode(envelope);
    expect(fromPurposeV1(decoded.data.purpose!)).toEqual(purpose);
  });
});
