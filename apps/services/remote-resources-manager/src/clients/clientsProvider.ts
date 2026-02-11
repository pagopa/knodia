import { createApiGatewayApiClient } from "@knodia/api-gateway-client";

import { config } from "../config/config.ts";

export type KnodiaApiGatewayClient = ReturnType<
  typeof createApiGatewayApiClient
>;

export function getKnodiaApiGatewayClient(): KnodiaApiGatewayClient {
  return createApiGatewayApiClient({
    baseURL: config.knodeUrl,
    throwOnError: true,
  });
}
