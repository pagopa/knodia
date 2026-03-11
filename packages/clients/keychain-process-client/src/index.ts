import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as keychainProcessApi from "./generated/index.ts";

export const createKeychainProcessApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);

export type KeychainProcessClient = ReturnType<
  typeof createKeychainProcessApiClient
>;
