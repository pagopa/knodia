import { createEserviceProcessApiClient } from "@knodia/eservice-process-client";
import { createRemoteResourcesManagerApiClient } from "@knodia/remote-resources-manager-client";

import { config } from "../config/config.ts";

export type EserviceProcessClient = ReturnType<
  typeof createEserviceProcessApiClient
>;
export type RemoteResourcesManagerClient = ReturnType<
  typeof createRemoteResourcesManagerApiClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients(): KnodiaClients {
  return {
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: config.eserviceProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: config.remoteResourcesManagerUrl,
      throwOnError: true,
    }),
  };
}
