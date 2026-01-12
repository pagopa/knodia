import { createClient } from "./gen/client/client.eservice.gen.ts";
import * as generatedEserviceApi from "./gen/index.ts";

export const eserviceApi = {
  ...generatedEserviceApi,
  createEserviceClient: createClient,
};
