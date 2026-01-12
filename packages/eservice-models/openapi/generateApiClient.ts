import { createProcessClient } from "@knodia/openapi-client-generator";

createProcessClient(
  "../../apps/services/eservice-process/openapi/openapi.yaml",
  "eservice",
);
