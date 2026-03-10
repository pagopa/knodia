import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as agreementProcessApi from "./generated/index.ts";

export const createAgreementProcessApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);

export type AgreementProcessClient = ReturnType<
  typeof createAgreementProcessApiClient
>;
