import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import {
  protobufBinaryCodec,
  type ProtobufCodec,
} from "@knodia/common-models/protobuf";
import { match } from "ts-pattern";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { Agreement, AgreementState } from "../src/agreement.ts";
import { AgreementEventV1 } from "../src/agreementEvent.ts";
import { toAgreementV1 } from "../src/agreementProtobufConverterToV1.ts";
import {
  AgreementActivatedV1,
  AgreementArchivedV1,
  AgreementCreatedPendingConsumerOperatorIdentificationV1,
  AgreementReactivatedByConsumerV1,
  AgreementReactivatedByProducerV1,
  AgreementSuspendedByConsumerV1,
  AgreementSuspendedByProducerV1,
} from "../src/generated/v1/agreementEvents.ts";

describe("AgreementEventV1 codec", () => {
  const agreement = zocker(Agreement).generate();

  // Suspend/reactivate events carry agreements with non-null suspendedBy*At dates,
  // ensuring the Date serialization path is always exercised
  const suspendedAgreement: Agreement = {
    ...zocker(Agreement).generate(),
    state: AgreementState.enum.Suspended,
    suspendedByConsumerAt: new Date(),
    suspendedByProducerAt: new Date(),
  };

  const archivedAgreement: Agreement = {
    ...zocker(Agreement).generate(),
    state: AgreementState.enum.Archived,
    suspendedByConsumerAt: new Date(),
    suspendedByProducerAt: new Date(),
  };

  const defaultData = { agreement: toAgreementV1(agreement) };
  const suspendedData = { agreement: toAgreementV1(suspendedAgreement) };
  const archivedData = { agreement: toAgreementV1(archivedAgreement) };

  const cases = [
    {
      data: defaultData,
      message: AgreementActivatedV1,
      type: "AgreementActivatedV1" as const,
    },
    {
      data: suspendedData,
      message: AgreementSuspendedByConsumerV1,
      type: "AgreementSuspendedByConsumerV1" as const,
    },
    {
      data: suspendedData,
      message: AgreementSuspendedByProducerV1,
      type: "AgreementSuspendedByProducerV1" as const,
    },
    {
      data: suspendedData,
      message: AgreementReactivatedByConsumerV1,
      type: "AgreementReactivatedByConsumerV1" as const,
    },
    {
      data: suspendedData,
      message: AgreementReactivatedByProducerV1,
      type: "AgreementReactivatedByProducerV1" as const,
    },
    {
      data: archivedData,
      message: AgreementArchivedV1,
      type: "AgreementArchivedV1" as const,
    },
  ] as const;

  it.each(cases)(
    "encodes and decodes a $type payload (AgreementEventV1 full codec)",
    (caseItem) => {
      function testFullCodec<E extends AgreementEventV1>(event: E) {
        const encoded = AgreementEventV1.encode(event);
        expect(encoded).toMatchObject({ type: event.type });
        expect(encoded.data).toBeInstanceOf(Uint8Array);

        const decoded = AgreementEventV1.decode(encoded);
        expect(decoded).toMatchObject(event);
      }

      match(caseItem)
        .with(
          { type: "AgreementActivatedV1" },
          { type: "AgreementSuspendedByConsumerV1" },
          { type: "AgreementSuspendedByProducerV1" },
          { type: "AgreementReactivatedByConsumerV1" },
          { type: "AgreementReactivatedByProducerV1" },
          { type: "AgreementArchivedV1" },
          ({ data, type }) => testFullCodec({ data, type }),
        )
        .exhaustive();
    },
  );

  it.each(cases)(
    "encodes and decodes a $type payload (protobufBinaryCodec-only)",
    (caseItem) => {
      function testProtobufCodec<T>(message: ProtobufCodec<T>, data: T) {
        const codec = protobufBinaryCodec(message);
        const bytes = codec.encode(data);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(codec.decode(bytes)).toEqual(data);
      }

      match(caseItem)
        .with(
          { type: "AgreementActivatedV1" },
          { type: "AgreementSuspendedByConsumerV1" },
          { type: "AgreementSuspendedByProducerV1" },
          { type: "AgreementReactivatedByConsumerV1" },
          { type: "AgreementReactivatedByProducerV1" },
          { type: "AgreementArchivedV1" },
          ({ data, message }) => testProtobufCodec(message, data),
        )
        .exhaustive();
    },
  );

  it("encodes and decodes an AgreementCreatedPendingConsumerOperatorIdentificationV1 payload (AgreementEventV1 full codec)", () => {
    const event: AgreementEventV1 = {
      data: {
        agreement: toAgreementV1(agreement),
      },
      type: "AgreementCreatedPendingConsumerOperatorIdentificationV1",
    };
    const encoded = AgreementEventV1.encode(event);
    expect(encoded).toMatchObject({
      type: "AgreementCreatedPendingConsumerOperatorIdentificationV1",
    });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = AgreementEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an AgreementCreatedPendingConsumerOperatorIdentificationV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(
      AgreementCreatedPendingConsumerOperatorIdentificationV1,
    );
    const value = {
      agreement: toAgreementV1(agreement),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaMessageEnvelope with AgreementEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: AgreementEventV1 = {
      data: {
        agreement: toAgreementV1(agreement),
      },
      type: "AgreementActivatedV1",
    };

    // This the encoding we perform when writing into the event store DB
    const { data, type } = AgreementEventV1.encode(event);

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

    const decoded = KafkaMessageEnvelope(AgreementEventV1).decode(envelope);
    expect(decoded).toMatchObject(event);
  });
});
