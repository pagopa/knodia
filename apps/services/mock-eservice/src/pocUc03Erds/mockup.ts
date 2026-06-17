import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// POC UC03 (ERDS relay) e-service identities. Kept in sync with the seed SQL:
//   supervisory body  -> scripts/seed/sql/orion/mock-poc-uc03-supervisory-body-eservice.sql
//   relay (Lynx)      -> scripts/seed/sql/lynx/mock-poc-uc03-relay-eservice.sql
//   relay (Orion)     -> scripts/seed/sql/orion/mock-poc-uc03-relay-eservice.sql
// Producers are the POC UC03 orgs (scripts/seed/sql/{lynx,orion}/poc-use-case-03.sql).

// supervisoryBodyOrion provide-data e-service (lookupERDS + getERDSMetadata), on Orion.
export const POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID =
  unsafeBrandId<EserviceId>("a3f1c8e0-1b2c-4d3e-8f40-000000000301");
export const POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("a3f1c8e0-1b2c-4d3e-8f40-000000000302");
export const POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000107");

// Relay (receive-data) e-service ids — the getERDSMetadata dataset points at them.
// Their full identities (version + producer) are added with the relay router (WI-4).
export const POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "b4e2d9f1-2c3d-4e4f-9a51-000000000311",
);
export const POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "c5f3e0a2-3d4e-4f5a-ab62-000000000321",
);
