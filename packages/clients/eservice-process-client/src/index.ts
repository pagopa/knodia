import { createClient } from "./generated/client/client.gen.ts";
import * as generatedEserviceProcessApi from "./generated/index.ts";

export const eserviceProcessApi = {
  ...generatedEserviceProcessApi,
  createClient,
};

export type * from "./generated/types.gen.ts";
