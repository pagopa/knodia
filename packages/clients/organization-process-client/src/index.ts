import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";
export * as organizationProcessApi from "./generated/index.ts";

export const createOrganizationProcessApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);

export type OrganizationProcessClient = ReturnType<
  typeof createOrganizationProcessApiClient
>;
