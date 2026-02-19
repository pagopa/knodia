import { createEserviceProcessApiClient } from "@knodia/eservice-process-client";

import { config } from "../config/config.ts";

export type EserviceProcessClient = ReturnType<
  typeof createEserviceProcessApiClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients(): KnodiaClients {
  return {
    eserviceProcessClient: createEserviceProcessApiClient({
      baseURL: config.eserviceProcessUrl,
    }),
  };
}
