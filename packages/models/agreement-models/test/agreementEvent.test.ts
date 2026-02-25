import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { Agreement } from "../src/agreement.ts";
import { AgreementEventV1 } from "../src/agreementEvent.ts";
import { toAgreementV1 } from "../src/agreementProtobufConverterToV1.ts";
import { AgreementActivatedV1 } from "../src/generated/v1/agreementEvents.js";

describe("AgreementEventV1 codec", () => {
  const agreement = zocker(Agreement).generate();

  it("encodes and decodes an AgreementActivatedV1 payload (AgreementEventV1 full codec)", () => {
    const event: AgreementEventV1 = {
      data: {
        agreement: toAgreementV1(agreement),
      },
      type: "AgreementActivatedV1",
    };
    const encoded = AgreementEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "AgreementActivatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = AgreementEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an AgreementActivatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(AgreementActivatedV1);
    const value = {
      agreement: toAgreementV1(agreement),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaKafkaMessageEnvelope with AgreementEventV1 data", () => {
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
