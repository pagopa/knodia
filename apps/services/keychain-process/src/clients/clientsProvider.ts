import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

interface KnodiaClients {
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients({
  remoteResourcesManagerUrl,
}: {
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
