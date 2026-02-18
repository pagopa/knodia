import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";

export * as k2kGatewayApi from "./generated/index.ts";
export const createK2K2GatewayApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
