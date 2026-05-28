import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// Mockup 03 (Signal Hub) e-service identity — kept in sync with
// `scripts/seed/sql/<tenant>/mock-signal-hub-eservice.sql`.
export const SIGNAL_HUB_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "634ac97e-47cb-4aed-bb0a-b3936ee6f6c7",
);
export const SIGNAL_HUB_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("fa2a800a-5058-4859-b68a-bfbd3ee863c0");
export const SIGNAL_HUB_MOCK_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);
