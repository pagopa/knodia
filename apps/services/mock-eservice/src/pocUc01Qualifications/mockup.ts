import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// POC UC01 qualifications e-service identity — kept in sync with
// `scripts/seed/sql/lynx/mock-poc-uc01-qualifications-eservice.sql`. Producer is
// studentRegistryLynx (POC UC01 seed, scripts/seed/sql/lynx/poc-use-case-01.sql).
export const POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_ID =
  unsafeBrandId<EserviceId>("4e769859-52d9-40d3-a54c-2de4ba44da10");
export const POC_UC01_QUALIFICATIONS_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("7046e499-ec54-4ea4-8821-fd22b5ee7ae4");
export const POC_UC01_QUALIFICATIONS_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000103");
