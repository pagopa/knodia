import { stripContentTypeOnBodylessRequests } from "@knodia/openapi-client-generator/runtime";

import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";

export * as k2kGatewayApi from "./generated/index.ts";
export const createK2K2GatewayApiClient = (
  config: Omit<Config, "throwOnError">,
) => {
  const client = createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
  stripContentTypeOnBodylessRequests(client.instance);
  return client;
};

export type K2K2GatewayApiClient = ReturnType<
  typeof createK2K2GatewayApiClient
>;
