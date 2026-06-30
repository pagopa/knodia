import {
  type EserviceId,
  type EserviceVersionId,
  type OrganizationId,
  unsafeBrandId,
} from "@knodia/common-models/ids";

// Identity of this mock e-service. Hardcoded on purpose.
// (kept in sync with scripts/seed/sql/<tenant>/mock-async-consumption-eservice.sql).
export const ASYNC_CONSUMPTION_MOCK_ESERVICE_ID = unsafeBrandId<EserviceId>(
  "4ed2b4f9-e974-4e69-84d6-7074af92cd4f",
);
export const ASYNC_CONSUMPTION_MOCK_ESERVICE_VERSION_ID =
  unsafeBrandId<EserviceVersionId>("8c86125f-ce3e-4fc7-8ea6-4b8c45c241e7");
export const ASYNC_CONSUMPTION_MOCK_PRODUCER_ID = unsafeBrandId<OrganizationId>(
  "00000000-0000-4000-8000-000000000004",
);
