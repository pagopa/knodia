import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// POC UC02 companies e-service identity — kept in sync with
// `scripts/seed/sql/lynx/mock-poc-uc02-companies-eservice.sql`. Producer is
// businessBookletLynx (POC UC02 seed, scripts/seed/sql/lynx/poc-use-case-02.sql).
export const POC_UC02_COMPANIES_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "16895bc2-deb0-427c-8c25-336207b2d0a1",
);
export const POC_UC02_COMPANIES_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("4b559dea-4af9-4ec1-ac2e-0a59449dfdfc");
export const POC_UC02_COMPANIES_MOCK_PRODUCER_ID =
  unsafeBrandId<OrganizationId>("00000000-0000-4000-8000-000000000101");
