import {
  type EserviceId,
  type EserviceVersionId,
  KnodeId,
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

// systemSERCLynx relay (receive-data) e-service, on Lynx.
export const POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "b4e2d9f1-2c3d-4e4f-9a51-000000000311",
);
export const POC_UC03_RELAY_LYNX_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("b4e2d9f1-2c3d-4e4f-9a51-000000000312");
export const POC_UC03_RELAY_LYNX_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000105");

// systemSERCOrion relay (receive-data) e-service, on Orion.
export const POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "c5f3e0a2-3d4e-4f5a-ab62-000000000321",
);
export const POC_UC03_RELAY_ORION_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("c5f3e0a2-3d4e-4f5a-ab62-000000000322");
export const POC_UC03_RELAY_ORION_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000106");

// The relay e-service identity served by each knode's mock, selected by KNODE_ID.
// Both knodes run the same relay router code; only the expected e-service differs.
export const POC_UC03_RELAY_IDENTITY_BY_KNODE = {
  [KnodeId.enum.Lynx]: {
    eserviceId: POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID,
    eserviceVersionId: POC_UC03_RELAY_LYNX_MOCK_ESERVICE_VERSION_ID,
    producerId: POC_UC03_RELAY_LYNX_MOCK_PRODUCER_ID,
  },
  [KnodeId.enum.Orion]: {
    eserviceId: POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID,
    eserviceVersionId: POC_UC03_RELAY_ORION_MOCK_ESERVICE_VERSION_ID,
    producerId: POC_UC03_RELAY_ORION_MOCK_PRODUCER_ID,
  },
} as const;
