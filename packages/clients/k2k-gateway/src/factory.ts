import type { KnodeId } from "@knodia/common-models/ids";
import type { TargetKnodeUrls } from "@knodia/common-models/targetKnodeUrls";

import {
  createK2K2GatewayApiClient,
  type K2K2GatewayApiClient,
} from "./index.ts";

export type K2K2GatewayApiClientFactory = ReturnType<
  typeof makeK2K2GatewayApiClientFactory
>;

export function makeK2K2GatewayApiClientFactory(
  targetKnodeUrls: TargetKnodeUrls,
  onMissingUrl: (targetKnodeId: KnodeId) => Error,
) {
  const cache = new Map<KnodeId, K2K2GatewayApiClient>();
  return function getK2K2GatewayApiClient(
    targetKnodeId: KnodeId,
  ): K2K2GatewayApiClient {
    const cached = cache.get(targetKnodeId);
    if (cached) return cached;
    const baseURL = targetKnodeUrls[targetKnodeId];
    if (!baseURL) {
      throw onMissingUrl(targetKnodeId);
    }
    const client = createK2K2GatewayApiClient({ baseURL });
    cache.set(targetKnodeId, client);
    return client;
  };
}
