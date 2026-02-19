import type { Config } from "./generated/client/types.gen.ts";

import { createClient } from "./generated/client/client.gen.ts";

export * as remoteResourcesManagerApi from "./generated/index.ts";
export const createRemoteResourcesManagerApiClient = (
  config: Omit<Config, "throwOnError">,
) =>
  createClient({
    ...config,
    throwOnError: true,
  } satisfies Config);
