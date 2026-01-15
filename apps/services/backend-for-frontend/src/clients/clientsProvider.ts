import { eserviceProcessApi } from "@knodia/eservice-process-client";

import { config } from "../config/config.ts";

export type EserviceProcessClient = ReturnType<
  typeof eserviceProcessApi.createClient
>;

interface KnodiaClients {
  eserviceProcessClient: EserviceProcessClient;
}

export function getKnodiaClients(): KnodiaClients {
  return {
    eserviceProcessClient: eserviceProcessApi.createClient({
      baseURL: config.eserviceProcessUrl,
      throwOnError: true,
    }),
  };
}
