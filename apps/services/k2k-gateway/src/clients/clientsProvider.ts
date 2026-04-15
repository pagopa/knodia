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
  createPurposeProcessApiClient,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  purposeProcessClient: PurposeProcessClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  keychainProcessUrl,
  organizationProcessUrl,
  purposeProcessUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
  keychainProcessUrl: string;
  organizationProcessUrl: string;
  purposeProcessUrl: string;
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
    purposeProcessClient: createPurposeProcessApiClient({
      baseURL: purposeProcessUrl,
    }),
  };
}
