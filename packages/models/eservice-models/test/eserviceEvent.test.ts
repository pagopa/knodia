import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";

import type { Eservice } from "../src/eservice.ts";

import { EserviceEventV1 } from "../src/eserviceEvent.ts";
import { toEserviceV1 } from "../src/eserviceProtobufConverterToV1.ts";
import {
  EserviceVersionActivatedV1,
  EserviceVersionArchivedV1,
  EserviceVersionReactivatedV1,
  EserviceVersionSuspendedV1,
} from "../src/generated/v1/eserviceEvents.ts";

describe("EserviceEventV1 codec", () => {
  const eservice: Eservice = {
    categories: [{ code: "CODE", scheme: "SCHEME" }],
    createdAt: new Date(1),
    description: { en: "Service description" },
    id: generateId(),
    isConsumerOperatorIdentificationRequired: false,
    isSignalHubEnabled: true,
    mode: "ProvideData",
    name: { en: "Test Service" },
    producerId: generateId(),
    updatedAt: new Date(1),
    versions: [
      {
        accessTokenAudience: ["audience"],
        accessTokenDuration: 3600,
        accessTokenType: "Bearer",
        createdAt: new Date(1),
        id: generateId(),
        interfaceDocument: {
          checksum: "checksum",
          contentType: "application/json",
          createdAt: new Date(1),
          id: generateId(),
          name: "interface-name",
          path: "/path",
          prettyName: { en: "Pretty Interface" },
          updatedAt: new Date(1),
        },
        maxDailyCallsPerConsumer: 200,
        maxDailyCallsPerKnode: 100,
        requiredAttributes: [
          [
            {
              code: "CODE",
              scheme: "ATTR",
            },
          ],
        ],
        state: "Active",
        updatedAt: new Date(1),
        versionNumber: 1,
      },
    ],
  };

  it("encodes and decodes an EserviceVersionActivatedV1 payload (EserviceEventV1 full codec)", () => {
    const event: EserviceEventV1 = {
      data: {
        eservice: toEserviceV1(eservice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eserviceVersionId: eservice.versions[0]!.id,
      },
      type: "EserviceVersionActivatedV1",
    };
    const encoded = EserviceEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "EserviceVersionActivatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = EserviceEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an EserviceVersionActivatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(EserviceVersionActivatedV1);
    const value = {
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("encodes and decodes an EserviceVersionSuspendedV1 payload (EserviceEventV1 full codec)", () => {
    const event: EserviceEventV1 = {
      data: {
        eservice: toEserviceV1(eservice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eserviceVersionId: eservice.versions[0]!.id,
      },
      type: "EserviceVersionSuspendedV1",
    };
    const encoded = EserviceEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "EserviceVersionSuspendedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = EserviceEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an EserviceVersionSuspendedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(EserviceVersionSuspendedV1);
    const value = {
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("encodes and decodes an EserviceVersionReactivatedV1 payload (EserviceEventV1 full codec)", () => {
    const event: EserviceEventV1 = {
      data: {
        eservice: toEserviceV1(eservice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eserviceVersionId: eservice.versions[0]!.id,
      },
      type: "EserviceVersionReactivatedV1",
    };
    const encoded = EserviceEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "EserviceVersionReactivatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = EserviceEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an EserviceVersionReactivatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(EserviceVersionReactivatedV1);
    const value = {
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("encodes and decodes an EserviceVersionArchivedV1 payload (EserviceEventV1 full codec)", () => {
    const event: EserviceEventV1 = {
      data: {
        eservice: toEserviceV1(eservice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eserviceVersionId: eservice.versions[0]!.id,
      },
      type: "EserviceVersionArchivedV1",
    };
    const encoded = EserviceEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "EserviceVersionArchivedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = EserviceEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an EserviceVersionArchivedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(EserviceVersionArchivedV1);
    const value = {
      eservice: toEserviceV1(eservice),
      eserviceVersionId: generateId(),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaMessageEnvelope with EserviceEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: EserviceEventV1 = {
      data: {
        eservice: toEserviceV1(eservice),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        eserviceVersionId: eservice.versions[0]!.id,
      },
      type: "EserviceVersionActivatedV1",
    };

    // This the encoding we perform when writing into the event store DB
    const { data, type } = EserviceEventV1.encode(event);

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

    const decoded = KafkaMessageEnvelope(EserviceEventV1).decode(envelope);
    expect(decoded).toMatchObject(event);
  });
});
