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
import {
  createPurposeProcessApiClient,
  type PurposeProcessClient,
} from "@knodia/purpose-process-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
  organizationProcessClient: OrganizationProcessClient;
  purposeProcessClient: PurposeProcessClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
  organizationProcessUrl,
  purposeProcessUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
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
    organizationProcessClient: createOrganizationProcessApiClient({
      baseURL: organizationProcessUrl,
    }),
    purposeProcessClient: createPurposeProcessApiClient({
      baseURL: purposeProcessUrl,
    }),
  };
}
