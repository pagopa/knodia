import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import {
  createKeychainProcessApiClient,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
  keychainProcessClient: KeychainProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients({
  eserviceProcessUrl,
  keychainProcessUrl,
  remoteResourcesManagerUrl,
}: {
  eserviceProcessUrl: string;
  keychainProcessUrl: string;
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
    keychainProcessClient: createKeychainProcessApiClient({
      baseURL: keychainProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
