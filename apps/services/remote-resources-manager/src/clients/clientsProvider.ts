import { createApiGatewayApiClient } from "@knodia/api-gateway-client";

import { config } from "../config/config.ts";

export type ApiGatewayClient = ReturnType<typeof createApiGatewayApiClient>;

export function getApiGatewayClient(): ApiGatewayClient {
  return createApiGatewayApiClient({
    baseURL: config.knodeUrl,
    throwOnError: true,
  });
}
