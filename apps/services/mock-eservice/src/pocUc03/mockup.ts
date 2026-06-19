import {
  type EserviceId,
  type EserviceVersionId,
  KnodeId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// e-service identities — must stay in sync with the seed SQL
// (scripts/seed/sql/{lynx,orion}/mock-poc-uc03-*.sql).
export const POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_ID =
  unsafeBrandId<EserviceId>("a3f1c8e0-1b2c-4d3e-8f40-000000000301");
export const POC_UC03_SUPERVISORY_BODY_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("a3f1c8e0-1b2c-4d3e-8f40-000000000302");
export const POC_UC03_SUPERVISORY_BODY_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000107");

// Relay e-service ids referenced by the getERDSMetadata dataset.
export const POC_UC03_RELAY_LYNX_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "b4e2d9f1-2c3d-4e4f-9a51-000000000311",
);
export const POC_UC03_RELAY_ORION_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "c5f3e0a2-3d4e-4f5a-ab62-000000000321",
);

// Full relay identities (version + producer) — consumed only by the per-knode
// identity map below; the relay router and its tests read that map, not these.
const POC_UC03_RELAY_LYNX_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("b4e2d9f1-2c3d-4e4f-9a51-000000000312");
const POC_UC03_RELAY_LYNX_MOCK_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000105",
);
const POC_UC03_RELAY_ORION_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("c5f3e0a2-3d4e-4f5a-ab62-000000000322");
const POC_UC03_RELAY_ORION_MOCK_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000106",
);

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
