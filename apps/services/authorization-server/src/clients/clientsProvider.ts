import type { KnodeId } from "@knodia/common-models/ids";
import type { TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";

import {
  createK2K2GatewayApiClient,
  type K2K2GatewayApiClient,
} from "@knodia/k2k-gateway-client";

export function getK2K2GatewayApiClient(baseURL: string): K2K2GatewayApiClient {
  return createK2K2GatewayApiClient({ baseURL });
}

const clientCache = new Map<KnodeId, K2K2GatewayApiClient>();

export function getK2K2GatewayApiClientForTarget(
  targetKnodeUrls: TargetKnodeUrls,
  targetKnodeId: KnodeId,
): K2K2GatewayApiClient {
  const cached = clientCache.get(targetKnodeId);
  if (cached) return cached;
  const client = getK2K2GatewayApiClient(targetKnodeUrls[targetKnodeId]);
  clientCache.set(targetKnodeId, client);
  return client;
}
