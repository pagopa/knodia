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
    expect(retrievedOrganizations.at(0)).toEqual({
      data: toExpectOrganization(organization),
      metadata: { version: metadataVersion },
    } satisfies WithMetadata<Organization>);
  });

  it("drops a duplicate organization that reuses an externalRequestId", async () => {
    const externalRequestId = "22222222-2222-4222-8222-222222222222";
    const first: Organization = {
      ...getMockOrganization(1),
      externalRequestId,
    };
    const second: Organization = {
      ...getMockOrganization(2),
      externalRequestId,
    };

    for (const organization of [first, second]) {
      await sendTestEvent({
        data: protobufBinaryCodec(
          organizationEvents.OrganizationCreatedV1,
        ).encode({ organization: toOrganizationV1(organization) }),
        eventType: "OrganizationCreatedV1",
        metadataVersion: 0,
        producer,
        streamId: organization.id,
        topicName,
      });
      await consumer.waitForNextMessage();
    }

    const retrievedOrganizations = await getAllOrganizations(readmodelDb);
    // The second organization collides on the unique externalRequestId and is
    // dropped by the writer; only the first is projected.
    expect(retrievedOrganizations.length).toBe(1);
    expect(retrievedOrganizations.at(0)?.data.id).toBe(first.id);
  });
});
