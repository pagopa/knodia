import type { CorrelationId } from "@knodia/common-models/ids";
import type { NewEventStoreOrganizationEvent } from "@knodia/db-event-store-writer/organization";

import {
  type Organization,
  toOrganizationV1,
} from "@knodia/organization-models";

export const createOrganizationCreatedV1Event = (
  organization: Organization,
  correlationId: CorrelationId,
): NewEventStoreOrganizationEvent => ({
  correlationId,
  currentMetadataVersion: undefined,
  event: {
    data: {
      organization: toOrganizationV1(organization),
    },
    type: "OrganizationCreatedV1",
  },
  streamId: organization.id,
});
