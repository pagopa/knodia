import { createEserviceProcessApiClient } from "@knodia/eservice-process-client";

export type EserviceProcessClient = ReturnType<
  typeof createEserviceProcessApiClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients({
  eserviceProcessUrl,
}: {
  eserviceProcessUrl: string;
}): KnodiaClients {
  return {
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: eserviceProcessUrl,
      throwOnError: true,
    }),
  };
}
