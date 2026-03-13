import { KafkaMessageEnvelope } from "@knodia/common-models/event";
import { generateId } from "@knodia/common-models/ids";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { describe, expect, it } from "vitest";
import { zocker } from "zocker";

import { OrganizationCreatedV1 } from "../src/generated/v1/organizationEvents.ts";
import { OrganizationEventV1 } from "../src/organizationEvent.ts";
import { toOrganizationV1 } from "../src/organizationProtobufConverterToV1.ts";
import { Organization } from "../src/organizations.ts";

describe("OrganizationEventV1 codec", () => {
  const organization = zocker(Organization).generate();

  it("encodes and decodes an OrganizationCreatedV1 payload (OrganizationEventV1 full codec)", () => {
    const event: OrganizationEventV1 = {
      data: {
        organization: toOrganizationV1(organization),
      },
      type: "OrganizationCreatedV1",
    };
    const encoded = OrganizationEventV1.encode(event);
    expect(encoded).toMatchObject({ type: "OrganizationCreatedV1" });
    expect(encoded.data).toBeInstanceOf(Uint8Array);

    const decoded = OrganizationEventV1.decode(encoded);
    expect(decoded).toMatchObject(event);
  });

  it("encodes and decodes an OrganizationCreatedV1 payload (protobufBinaryCodec-only)", () => {
    const codec = protobufBinaryCodec(OrganizationCreatedV1);
    const value = {
      organization: toOrganizationV1(organization),
    };
    const bytes = codec.encode(value);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(codec.decode(bytes)).toEqual(value);
  });

  it("decodes a KafkaMessageEnvelope with OrganizationEventV1 data", () => {
    const toHex = (value: Uint8Array) => Buffer.from(value).toString("hex");

    const event: OrganizationEventV1 = {
      data: {
        organization: toOrganizationV1(organization),
      },
      type: "OrganizationCreatedV1",
    };

    const { data, type } = OrganizationEventV1.encode(event);

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

    const decoded = KafkaMessageEnvelope(OrganizationEventV1).decode(envelope);
    expect(decoded).toMatchObject(event);
  });
});
