import {
  type AgreementProcessClient,
  createAgreementProcessApiClient,
} from "@knodia/agreement-process-client";
import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";
import {
  createOrganizationProcessApiClient,
  type OrganizationProcessClient,
} from "@knodia/organization-process-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  organizationProcessUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
  organizationProcessUrl: string;
}): KnodiaClients {
  return {
    agreementProcessClient: createAgreementProcessApiClient({
      baseURL: agreementProcessUrl,
    }),
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
    organizationProcessClient: createOrganizationProcessApiClient({
      baseURL: organizationProcessUrl,
    }),
  };
}
