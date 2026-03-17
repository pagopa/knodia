import {
  type AgreementProcessClient,
  createAgreementProcessApiClient,
} from "@knodia/agreement-process-client";
import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import {
  createKeychainProcessApiClient,
  type KeychainProcessClient,
} from "@knodia/keychain-process-client";
import {
  createOrganizationProcessApiClient,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";
import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  keychainProcessUrl,
  organizationProcessUrl,
  remoteResourcesManagerUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
  keychainProcessUrl: string;
  organizationProcessUrl: string;
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    agreementProcessClient: createAgreementProcessApiClient({
      baseURL: agreementProcessUrl,
    }),
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
    keychainProcessClient: createKeychainProcessApiClient({
      baseURL: keychainProcessUrl,
    }),
    organizationProcessClient: createOrganizationProcessApiClient({
      baseURL: organizationProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
