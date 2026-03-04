import {
  type AgreementProcessClient,
  createAgreementProcessApiClient,
} from "@knodia/agreement-process-client";
import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";

interface KnodiaClients {
  agreementProcessClient: AgreementProcessClient;
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients({
  agreementProcessUrl,
  eserviceProcessUrl,
}: {
  agreementProcessUrl: string;
  eserviceProcessUrl: string;
}): KnodiaClients {
  return {
    agreementProcessClient: createAgreementProcessApiClient({
      baseURL: agreementProcessUrl,
    }),
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
    }),
  };
}
