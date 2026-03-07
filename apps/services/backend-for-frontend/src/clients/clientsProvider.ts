import {
  type AgreementProcessClient,
  createAgreementProcessApiClient,
} from "@knodia/agreement-process-client";
import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  remoteResourcesManagerUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    agreementProcessClient: createAgreementProcessApiClient({
      baseURL: agreementProcessUrl,
    }),
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
