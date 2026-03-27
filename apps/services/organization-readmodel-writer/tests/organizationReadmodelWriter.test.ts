import type { WithMetadata } from "@knodia/db-readmodel-commons/models";

import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import {
  type Organization,
  organizationEvents,
  toOrganizationV1,
} from "@knodia/organization-models";
import { sendTestEvent } from "@knodia/test-commons/kafka";
import {
  getMockOrganization,
  toExpectOrganization,
} from "@knodia/test-commons/utils";
import { describe, expect, it } from "vitest";

import { consumer, producer, readmodelDb, topicName } from "./setup.ts";
import { getAllOrganizations } from "./utils.ts";

describe("Organization read model writer tests", async () => {
  it("OrganizationCreatedV1", async () => {
    const organization = getMockOrganization();
    const eventData = protobufBinaryCodec(
      organizationEvents.OrganizationCreatedV1,
    ).encode({
      organization: toOrganizationV1(organization),
    });

    const metadataVersion = 0;
    await sendTestEvent({
      data: eventData,
      eventType: "OrganizationCreatedV1",
      metadataVersion,
      producer,
      streamId: organization.id,
      topicName,
    });

    await consumer.waitForNextMessage();

    const retrievedOrganizations = await getAllOrganizations(readmodelDb);

    expect(retrievedOrganizations.length).toBe(1);
    expect(retrievedOrganizations[0]).toEqual({
      data: toExpectOrganization(organization),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Organization>);
  });
});
