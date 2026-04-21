import { stripContentTypeOnBodylessRequests } from "@knodia/openapi-client-generator/runtime";

import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as bffApi from "./generated/index.ts";

export const createBffApiClient = (config: Omit<Config, "throwOnError">) => {
  const client = createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
  stripContentTypeOnBodylessRequests(client.instance);
  return client;
};
