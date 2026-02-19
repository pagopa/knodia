import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as eserviceProcessApi from "./generated/index.ts";

export const createEserviceProcessApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
