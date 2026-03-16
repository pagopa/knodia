import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { PurposeActivatedV1 } from "../src/generated/v1/purposeEvents.ts";
import { Purpose } from "../src/purpose.ts";
import { PurposeEventV1 } from "../src/purposeEvent.ts";
import { toPurposeV1 } from "../src/purposeProtobufConverterToV1.ts";

describe("PurposeEventV1 codec", () => {
  const purpose = {
    ...zocker(Purpose).generate(),
    // formAnswers must contain only string values to survive protobuf map<string, string> roundtrip
    formAnswers: { question1: "answer1", question2: "answer2" },
  };

  it("encodes and decodes a PurposeActivatedV1 payload (PurposeEventV1 full codec)", () => {
    const event: PurposeEventV1 = {
      data: {
        purpose: toPurposeV1(purpose),
      },
      type: "PurposeActivatedV1",
    };
    const encoded = PurposeEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "PurposeActivatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = PurposeEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes a PurposeActivatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(PurposeActivatedV1);
    const value = {
      purpose: toPurposeV1(purpose),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

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
    expect(decoded).toMatchObject(event);
  });
});
