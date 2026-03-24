import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as purposeProcessApi from "./generated/index.ts";

export const createPurposeProcessApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);

export type PurposeProcessClient = ReturnType<
  typeof createPurposeProcessApiClient
>;
