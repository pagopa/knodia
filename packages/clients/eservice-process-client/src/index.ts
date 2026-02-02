import { createClient } from "./generated/client/client.gen.js";
import * as generatedEserviceProcessApi from "./generated/index.js";

export const eserviceProcessApi = {
  ...generatedEserviceProcessApi,
  createClient,
};

export type * from "./generated/types.gen.ts";
