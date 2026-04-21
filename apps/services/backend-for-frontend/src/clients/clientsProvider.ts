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
import {
  createRemoteResourcesManagerApiClient,
  type RemoteResourcesManagerClient,
} from "@knodia/remote-resources-manager-client";
import axios from "axios";

// Axios's default `headers.post/put/patch['Content-Type']` is
// `application/x-www-form-urlencoded`, which Fastify rejects with 415 since
// no parser is registered for it. Axios already adds the correct
// `application/json` Content-Type when a JSON body is present, so we clear
// the per-method defaults to avoid sending Content-Type on empty-body
// mutation requests (e.g. suspend/reactivate).
const axiosInstance = axios.create();
axiosInstance.defaults.headers.post["Content-Type"] = null;
axiosInstance.defaults.headers.put["Content-Type"] = null;
axiosInstance.defaults.headers.patch["Content-Type"] = null;

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  keychainProcessClient: KeychainProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  purposeProcessClient: PurposeProcessClient;
  remoteResourcesManagerClient: RemoteResourcesManagerClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  keychainProcessUrl,
  organizationProcessUrl,
  purposeProcessUrl,
  remoteResourcesManagerUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
  keychainProcessUrl: string;
  organizationProcessUrl: string;
  purposeProcessUrl: string;
  remoteResourcesManagerUrl: string;
}): KnodiaClients {
  return {
    agreementProcessClient: createAgreementProcessApiClient({
      axios: axiosInstance,
      baseURL: agreementProcessUrl,
    }),
    eserviceProcessClient: createEserviceProcessApiClient({
      axios: axiosInstance,
      baseURL: eserviceProcessUrl,
    }),
    keychainProcessClient: createKeychainProcessApiClient({
      axios: axiosInstance,
      baseURL: keychainProcessUrl,
    }),
    organizationProcessClient: createOrganizationProcessApiClient({
      axios: axiosInstance,
      baseURL: organizationProcessUrl,
    }),
    purposeProcessClient: createPurposeProcessApiClient({
      axios: axiosInstance,
      baseURL: purposeProcessUrl,
    }),
    remoteResourcesManagerClient: createRemoteResourcesManagerApiClient({
      axios: axiosInstance,
      baseURL: remoteResourcesManagerUrl,
    }),
  };
}
