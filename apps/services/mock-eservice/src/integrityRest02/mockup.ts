import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// Integrity REST 02 e-service identity — kept in sync with
// `scripts/seed/sql/lynx/mock-integrity-rest-02-eservice.sql`.
export const INTEGRITY_REST_02_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "cf9dde0a-336a-43e0-a5f7-14b698a0586e",
);
export const INTEGRITY_REST_02_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("a72aa082-69f0-4ae2-ae61-051138118ab3");
export const INTEGRITY_REST_02_MOCK_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);
