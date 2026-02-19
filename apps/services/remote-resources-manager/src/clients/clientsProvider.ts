import { createK2K2GatewayApiClient } from "@knodia/k2k-gateway-client";

import { config } from "../config/config.ts";

export type K2K2GatewayApiClient = ReturnType<
  typeof createK2K2GatewayApiClient
>;

export function getK2K2GatewayApiClient(): K2K2GatewayApiClient {
  return createK2K2GatewayApiClient({
    baseURL: config.knodeUrl,
  });
}
