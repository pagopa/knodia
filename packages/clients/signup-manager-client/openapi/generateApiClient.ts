import { generateApiClient } from "@knodia/openapi-client-generator";

generateApiClient(
  "../../../apps/services/signup-manager/openapi/openapi.yaml",
  ["@tanstack/react-query"],
);
