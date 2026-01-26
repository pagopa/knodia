import type { Eservice } from "@knodia/eservice-models";

import type { API_Eservice } from "./api.ts";

export const toAPI_Eservice = (
  eservice: Pick<Eservice, "name">,
): API_Eservice => ({
  name: eservice.name.en,
});
