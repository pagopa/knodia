import { Eservice } from "@knodia/eservice-models";
import { zocker } from "zocker";

export function getMockEservice(seed = 0): Eservice {
  return zocker(Eservice)
    .array({
      min: 1,
    })
    .setSeed(seed)
    .generate();
}
