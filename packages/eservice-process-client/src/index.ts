import { createClient } from "./generated/client/client.gen.ts";
import * as generatedEserviceApi from "./generated/index.ts";

export const eserviceApi = {
  ...generatedEserviceApi,
  createEserviceClient: createClient,
};
