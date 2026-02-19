import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as bffApi from "./generated/index.ts";

export const createBffApiClient = (config: Omit<Config, "throwOnError">) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
