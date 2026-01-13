import { createClient } from "./generated/client/client.eservice.gen.ts";
import * as generatedEserviceApi from "./generated/index.ts";

export const eserviceApi = {
  ...generatedEserviceApi,
  createEserviceClient: createClient,
};
