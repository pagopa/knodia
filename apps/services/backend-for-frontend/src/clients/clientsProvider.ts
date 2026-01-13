import { eserviceApi } from "@knodia/eservice-process-client";

import { config } from "../config/config.ts";

export type EserviceProcessClient = ReturnType<
  typeof eserviceApi.createEserviceClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients(): KnodiaClients {
  return {
    eserviceProcessClient: eserviceApi.createEserviceClient({
      baseURL: config.eserviceProcessUrl,
    }),
  };
}
