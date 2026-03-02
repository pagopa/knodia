import { createAgreementProcessApiClient } from "@knodia/agreement-process-client";
import {
  createEserviceProcessApiClient,
  type EserviceProcessClient,
} from "@knodia/eservice-process-client";

interface KnodiaClients {
  agreementProcessClient: ReturnType<typeof createAgreementProcessApiClient>;
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
