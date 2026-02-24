import { createEserviceProcessApiClient } from "@knodia/eservice-process-client";
import { createRemoteResourcesManagerApiClient } from "@knodia/remote-resources-manager-client";

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

export function getKnodiaClients({
  eserviceProcessUrl,
  remoteResourcesManagerUrl,
}: {
  eserviceProcessUrl: string;
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
