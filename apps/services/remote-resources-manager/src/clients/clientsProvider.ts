import {
  createK2K2GatewayApiClient,
  type K2K2GatewayApiClient,
} from "@knodia/k2k-gateway-client";

export function getK2K2GatewayApiClient({
  knodeUrl,
}: {
  knodeUrl: string;
}): K2K2GatewayApiClient {
  return createK2K2GatewayApiClient({
    baseURL: knodeUrl,
  });
}
