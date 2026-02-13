import { createKnodiaApiGatewayApiClient } from "@knodia/knodia-api-gateway-client";

import { config } from "../config/config.ts";

export type KnodiaApiGatewayClient = ReturnType<
  typeof createKnodiaApiGatewayApiClient
>;

export function getKnodiaApiGatewayClient(): KnodiaApiGatewayClient {
  return createKnodiaApiGatewayApiClient({
    baseURL: config.knodeUrl,
    throwOnError: true,
  });
}
