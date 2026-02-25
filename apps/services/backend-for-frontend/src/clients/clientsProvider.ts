import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

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
