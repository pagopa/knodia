import { eserviceProcessApi } from "@knodia/eservice-process-client";

import { config } from "../config/config.ts";

export type EserviceProcessClient = ReturnType<
  typeof eserviceProcessApi.createEserviceClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients(): KnodiaClients {
  return {
    eserviceProcessClient: eserviceProcessApi.createEserviceClient({
      baseURL: config.eserviceProcessUrl,
    }),
  };
}
