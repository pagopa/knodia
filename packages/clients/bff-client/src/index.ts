import { createClient } from "./generated/client/client.gen.ts";
import * as generatedBffApi from "./generated/index.ts";

export const bffApi = {
  ...generatedBffApi,
  createClient,
};

export type * from "./generated/types.gen.ts";
